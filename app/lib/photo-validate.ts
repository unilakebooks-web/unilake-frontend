import { FaceDetector, FilesetResolver } from "@mediapipe/tasks-vision";

export type PhotoCheck = {
  passed: boolean;
  blockReason?: "no_face" | "multiple_faces";
  warnings: string[];
};

let faceDetector: FaceDetector | null = null;

async function initializeFaceDetector() {
  if (faceDetector) return faceDetector;

  const vision = await FilesetResolver.forVisionTasks(
    "/mediapipe/wasm"
  );
  faceDetector = await FaceDetector.createFromOptions(vision, {
    baseOptions: {
      modelAssetPath: "/mediapipe/blaze_face_short_range.tflite",
      delegate: "GPU",
    },
    runningMode: "IMAGE",
  });
  return faceDetector;
}

export async function checkPhoto(blob: Blob): Promise<PhotoCheck> {
  const detector = await initializeFaceDetector();
  
  // Create an image element to feed to MediaPipe
  const img = new Image();
  const url = URL.createObjectURL(blob);
  
  await new Promise((resolve, reject) => {
    img.onload = resolve;
    img.onerror = reject;
    img.src = url;
  });
  
  URL.revokeObjectURL(url);
  
  const detections = detector.detect(img).detections;
  
  if (detections.length === 0) {
    return { passed: false, blockReason: "no_face", warnings: [] };
  }
  
  if (detections.length > 1) {
    return { passed: false, blockReason: "multiple_faces", warnings: [] };
  }
  
  const box = detections[0].boundingBox;
  const warnings: string[] = [];

  if (box) {
    // Face size: the threshold is per-edge, NOT area (§5.2). A face 20% wide by 25%
    // tall is perfectly usable but only 5% of the image by area — comparing areas
    // against 0.15 warns on almost every normal photo.
    const widthRatio = box.width / img.width;
    const heightRatio = box.height / img.height;
    if (widthRatio < 0.15 || heightRatio < 0.15) {
      warnings.push("The face looks small — a closer photo usually works better.");
    }

    // Off-centre on either axis, not just horizontally.
    const centreX = (box.originX + box.width / 2) / img.width;
    const centreY = (box.originY + box.height / 2) / img.height;
    if (Math.abs(centreX - 0.5) > 0.25 || Math.abs(centreY - 0.5) > 0.25) {
      warnings.push("Try centring your child's face in the photo.");
    }
  }

  return { passed: true, warnings };
}

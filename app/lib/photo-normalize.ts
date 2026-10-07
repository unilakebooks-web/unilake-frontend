// 🔴 heic2any is deliberately NOT imported at the top of this file.
//
// It reads `window` while its module body is evaluating, and "use client" does
// not mean "browser only" — Next still renders client components on the server
// to produce the initial HTML. A top-level import therefore crashes the server
// render of every route that reaches this module, and /comic/[comicId] returned
// a 500 on any direct visit or hard refresh.
//
// Loading it inside the conversion branch keeps it off the server entirely, and
// as a bonus this sizeable library now only downloads for the few users who
// actually pick a HEIC file, instead of everyone who opens a comic page.

// Maximum dimension for the image
const MAX_DIMENSION = 1600;
const COMPRESSION_QUALITY = 0.9;

export async function normalizePhoto(file: File): Promise<Blob> {
  let blobToProcess: Blob = file;

  // Convert HEIC/HEIF to JPEG if necessary
  if (
    file.type === "image/heic" ||
    file.type === "image/heif" ||
    file.name.toLowerCase().endsWith(".heic") ||
    file.name.toLowerCase().endsWith(".heif")
  ) {
    try {
      const { default: heic2any } = await import("heic2any");

      const converted = await heic2any({
        blob: file,
        toType: "image/jpeg",
        quality: COMPRESSION_QUALITY,
      });
      // heic2any can return an array of blobs if it's an image sequence; grab the first one
      blobToProcess = Array.isArray(converted) ? converted[0] : converted;
    } catch (e) {
      console.error("HEIC conversion failed:", e);
      throw new Error("Failed to convert HEIC image. Please try a different photo.");
    }
  }

  return new Promise((resolve, reject) => {
    const img = new Image();
    const url = URL.createObjectURL(blobToProcess);

    img.onload = () => {
      URL.revokeObjectURL(url);
      
      let { width, height } = img;
      
      // Calculate new dimensions keeping aspect ratio
      if (width > MAX_DIMENSION || height > MAX_DIMENSION) {
        if (width > height) {
          height = Math.round((height * MAX_DIMENSION) / width);
          width = MAX_DIMENSION;
        } else {
          width = Math.round((width * MAX_DIMENSION) / height);
          height = MAX_DIMENSION;
        }
      }

      const canvas = document.createElement("canvas");
      canvas.width = width;
      canvas.height = height;

      const ctx = canvas.getContext("2d");
      if (!ctx) {
        return reject(new Error("Failed to get canvas context for image resizing"));
      }

      // Draw and compress
      ctx.drawImage(img, 0, 0, width, height);
      
      canvas.toBlob(
        (blob) => {
          if (blob) {
            resolve(blob);
          } else {
            reject(new Error("Failed to compress image"));
          }
        },
        "image/jpeg",
        COMPRESSION_QUALITY
      );
    };

    img.onerror = () => {
      URL.revokeObjectURL(url);
      reject(new Error("Failed to read image file"));
    };

    img.src = url;
  });
}

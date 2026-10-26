import { useState, useRef, useEffect, useCallback } from "react";
import ReactCrop, { Crop, PixelCrop } from "react-image-crop";
import "react-image-crop/dist/ReactCrop.css";
import { cropImage } from "@/app/lib/crop-image";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog";

interface ImageCropModalProps {
  open: boolean;
  imageSrc: string | null;
  onConfirm: (blob: Blob) => void;
  onCancel: () => void;
}

export default function ImageCropModal({
  open,
  imageSrc,
  onConfirm,
  onCancel,
}: ImageCropModalProps) {
  const [crop, setCrop] = useState<Crop>();
  const [completedCrop, setCompletedCrop] = useState<PixelCrop>();
  const [isCropping, setIsCropping] = useState(false);
  
  const imgRef = useRef<HTMLImageElement>(null);

  // The tallest the photo may be drawn: the crop area's real inner height,
  // measured. The photo must fit this box completely, at its own aspect ratio.
  //
  // It used to be capped at `calc(80vh - 200px)` instead, a guess at the space
  // left by the header and footer. On most laptop screens that guess exceeded
  // the real area (the dialog is a fixed 600px tall from sm up), so a square or
  // portrait photo was drawn taller than the area and ReactCrop's wrapper
  // (overflow: hidden) clipped its bottom off. Worse, the crop box was then
  // measured against the clipped box while handleConfirm scaled it by the full
  // drawn height, so the saved crop did not match the selection.
  const [maxImageHeight, setMaxImageHeight] = useState<number | null>(null);

  // Callback ref, not useRef + effect: the dialog portals its content in when
  // it opens, so the node can appear after this component's effects have run.
  // React 19 runs the returned cleanup when the node detaches.
  const cropAreaRef = useCallback((node: HTMLDivElement | null) => {
    if (!node) return;

    const measure = () => {
      const styles = getComputedStyle(node);
      const height =
        node.clientHeight -
        parseFloat(styles.paddingTop) -
        parseFloat(styles.paddingBottom);
      if (height > 0) setMaxImageHeight(Math.floor(height));
    };

    measure();
    const observer = new ResizeObserver(measure);
    observer.observe(node);
    return () => observer.disconnect();
  }, []);

  const handleConfirm = async () => {
    if (!imageSrc || !completedCrop || !imgRef.current) return;

    setIsCropping(true);
    try {
      // react-image-crop returns pixel crop based on the displayed image size,
      // but cropImage needs it based on natural image size.
      const scaleX = imgRef.current.naturalWidth / imgRef.current.width;
      const scaleY = imgRef.current.naturalHeight / imgRef.current.height;
      
      const pixelCrop = {
        x: Math.round(completedCrop.x * scaleX),
        y: Math.round(completedCrop.y * scaleY),
        width: Math.round(completedCrop.width * scaleX),
        height: Math.round(completedCrop.height * scaleY),
      };

      const croppedBlob = await cropImage(imageSrc, pixelCrop);
      onConfirm(croppedBlob);
    } catch (e) {
      console.error("Failed to crop image:", e);
    } finally {
      setIsCropping(false);
    }
  };

  function onImageLoad(e: React.SyntheticEvent<HTMLImageElement>) {
    // Default to a generous centered crop, freeform (no aspect ratio)
    const initialCrop: Crop = {
      unit: '%',
      x: 10,
      y: 10,
      width: 80,
      height: 80
    };
    setCrop(initialCrop);
  }

  // Reset state when modal opens with new image
  useEffect(() => {
    if (open) {
      setCrop(undefined);
      setCompletedCrop(undefined);
    }
  }, [open]);

  return (
    <Dialog open={open} onOpenChange={(isOpen) => !isOpen && onCancel()}>
      <DialogContent className="sm:max-w-xl p-0 overflow-hidden flex flex-col h-[80vh] sm:h-[600px]" showCloseButton={false}>
        <DialogHeader className="p-4 sm:p-6 pb-0">
          <DialogTitle className="text-xl sm:text-2xl text-[#3F3C95]">Crop Your Photo</DialogTitle>
          <p className="text-sm text-gray-500 mt-1">Drag the corners to adjust the crop area. and slect the face area</p>
        </DialogHeader>

        <div
          ref={cropAreaRef}
          className="relative flex-1 min-h-0 w-full flex items-center justify-center bg-[#F3F4F6] overflow-hidden mx-auto p-4 border-y border-gray-100"
        >
          {/* Rendered only once the area is measured, so the photo is never
              drawn at a size it then has to shrink from — and the crop box
              set in onImageLoad is always relative to the final size. */}
          {imageSrc && maxImageHeight !== null && (
            <ReactCrop
              crop={crop}
              onChange={(_, percentCrop) => setCrop(percentCrop)}
              onComplete={(c) => setCompletedCrop(c)}
              // Same measured cap as the <img>: ReactCrop's CSS gives its
              // overflow-hidden child wrapper `max-height: inherit`, so this
              // must never be smaller than the image or it clips it again.
              style={{ maxHeight: maxImageHeight, maxWidth: '100%', display: 'flex' }}
            >
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img 
                ref={imgRef}
                src={imageSrc} 
                alt="Crop me" 
                onLoad={onImageLoad}
                // Both caps together scale the photo down, keeping its aspect
                // ratio, until it fits the crop area on both axes.
                style={{
                  maxHeight: maxImageHeight,
                  maxWidth: '100%',
                }}
              />
            </ReactCrop>
          )}
        </div>

        <div className="p-4 sm:p-6 flex flex-col gap-4 bg-white z-10">
          <DialogFooter className="flex-row justify-end gap-3 sm:gap-3 p-0 border-t-0 bg-transparent mb-0">
            <button
              onClick={onCancel}
              disabled={isCropping}
              className="px-5 py-2.5 rounded-xl border border-gray-300 text-gray-700 font-medium hover:bg-gray-50 disabled:opacity-50 transition-colors"
            >
              Cancel
            </button>
            <button
              onClick={handleConfirm}
              disabled={isCropping || !completedCrop?.width || !completedCrop?.height}
              className="px-5 py-2.5 rounded-xl bg-[#3F3C95] text-white font-medium hover:bg-[#3F3C95]/90 disabled:opacity-50 transition-colors flex items-center justify-center min-w-[140px]"
            >
              {isCropping ? "Cropping..." : "Crop & Continue"}
            </button>
          </DialogFooter>
        </div>
      </DialogContent>
    </Dialog>
  );
}

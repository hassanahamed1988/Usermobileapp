import React, { useState, useRef, useEffect } from 'react';
import { X, Crop, RefreshCw, Check, RotateCw, Sparkles } from 'lucide-react';
import { detectReceiptFractionalBounds } from '../utils/imageUtils';

interface ReceiptCropperModalProps {
  isOpen: boolean;
  imageSrc: string; // Original raw base64 or object URL of the receipt image
  language: 'bn' | 'en';
  onClose: () => void;
  onCropComplete: (croppedBase64: string) => void;
}

export default function ReceiptCropperModal({
  isOpen,
  imageSrc,
  language,
  onClose,
  onCropComplete,
}: ReceiptCropperModalProps) {
  if (!isOpen || !imageSrc) return null;

  const [rotation, setRotation] = useState<number>(0); // 0, 90, 180, 270 degrees
  const [selectedFilter, setSelectedFilter] = useState<'none' | 'magic' | 'bw' | 'grayscale'>('magic');
  const [imageLoaded, setImageLoaded] = useState<boolean>(false);

  const getPreviewFilterStyle = () => {
    switch (selectedFilter) {
      case 'magic':
        return 'contrast(1.3) brightness(1.05) saturate(1.2)';
      case 'bw':
        return 'grayscale(1) contrast(2.2) brightness(1.1)';
      case 'grayscale':
        return 'grayscale(1) contrast(1.4) brightness(1.05)';
      default:
        return 'none';
    }
  };

  // 4 Independent Fractional cropping corners (0 to 1)
  const [corners, setCorners] = useState<{
    tl: { x: number; y: number };
    tr: { x: number; y: number };
    bl: { x: number; y: number };
    br: { x: number; y: number };
  }>({
    tl: { x: 0.05, y: 0.05 },
    tr: { x: 0.95, y: 0.05 },
    bl: { x: 0.05, y: 0.95 },
    br: { x: 0.95, y: 0.95 },
  });

  // Display dimensions of the image on screen
  const [imgDisplayDim, setImgDisplayDim] = useState<{ width: number; height: number }>({
    width: 0,
    height: 0,
  });

  const containerRef = useRef<HTMLDivElement>(null);
  const imgRef = useRef<HTMLImageElement>(null);
  const activeDragRef = useRef<{
    type: 'tl' | 'tr' | 'bl' | 'br';
  } | null>(null);

  // Set initial crop corners when image loads
  const handleImageLoad = () => {
    if (!imgRef.current) return;
    const { clientWidth, clientHeight } = imgRef.current;
    setImgDisplayDim({ width: clientWidth, height: clientHeight });
    setImageLoaded(true);

    // Initial default positions (almost full image area)
    setCorners({
      tl: { x: 0.02, y: 0.02 },
      tr: { x: 0.98, y: 0.02 },
      bl: { x: 0.02, y: 0.98 },
      br: { x: 0.98, y: 0.98 },
    });
  };

  // Recalculate dimensions on window resize or rotation change
  useEffect(() => {
    if (imageLoaded && imgRef.current) {
      const { clientWidth, clientHeight } = imgRef.current;
      setImgDisplayDim({ width: clientWidth, height: clientHeight });
    }
  }, [rotation, imageLoaded]);

  // Pointer event handlers for touch & mouse dragging
  const handlePointerDown = (
    e: React.PointerEvent<HTMLDivElement>,
    type: 'tl' | 'tr' | 'bl' | 'br'
  ) => {
    e.preventDefault();
    e.stopPropagation();
    (e.target as HTMLDivElement).setPointerCapture(e.pointerId);

    activeDragRef.current = {
      type,
    };
  };

  const handlePointerMove = (e: React.PointerEvent<HTMLDivElement>) => {
    if (!activeDragRef.current || !imgDisplayDim.width || !imgDisplayDim.height || !imgRef.current) return;
    e.preventDefault();

    const rect = imgRef.current.getBoundingClientRect();
    
    // Direct coordinate mapping relative to loaded display image boundaries
    let x = (e.clientX - rect.left) / rect.width;
    let y = (e.clientY - rect.top) / rect.height;

    // Constrain coordinates completely within image bounds [0, 1]
    x = Math.max(0, Math.min(1, x));
    y = Math.max(0, Math.min(1, y));

    const targetCorner = activeDragRef.current.type;

    setCorners((prev) => ({
      ...prev,
      [targetCorner]: { x, y },
    }));
  };

  const handlePointerUp = (e: React.PointerEvent<HTMLDivElement>) => {
    if (!activeDragRef.current) return;
    e.preventDefault();
    (e.target as HTMLDivElement).releasePointerCapture(e.pointerId);
    activeDragRef.current = null;
  };

  // Perform automatic crop detection using image bounds on demand
  const triggerAutoCrop = () => {
    if (!imgRef.current) return;
    try {
      const bounds = detectReceiptFractionalBounds(imgRef.current);
      setCorners({
        tl: { x: bounds.x, y: bounds.y },
        tr: { x: bounds.x + bounds.w, y: bounds.y },
        bl: { x: bounds.x, y: bounds.y + bounds.h },
        br: { x: bounds.x + bounds.w, y: bounds.y + bounds.h },
      });
    } catch (err) {
      console.warn('Auto crop calculation failed:', err);
    }
  };

  // Reset rotation and set default cropping coordinates (full image bounds)
  const triggerReset = () => {
    setRotation(0);
    setCorners({
      tl: { x: 0.02, y: 0.02 },
      tr: { x: 0.98, y: 0.02 },
      bl: { x: 0.02, y: 0.98 },
      br: { x: 0.98, y: 0.98 },
    });
  };

  // Apply perspective crop, rotate, and contrast enhancements on a high-res canvas
  const handleConfirmCrop = () => {
    if (!imgRef.current) return;
    const originalImg = imgRef.current;

    const sourceW = originalImg.naturalWidth;
    const sourceH = originalImg.naturalHeight;

    // Apply rotation transform first to the source image to make it upright
    const isRotated90 = rotation === 90 || rotation === 270;
    const rotSourceW = isRotated90 ? sourceH : sourceW;
    const rotSourceH = isRotated90 ? sourceW : sourceH;

    const sourceCanvas = document.createElement('canvas');
    sourceCanvas.width = rotSourceW;
    sourceCanvas.height = rotSourceH;
    const sCtx = sourceCanvas.getContext('2d');
    if (!sCtx) return;

    // Draw rotated upright source
    sCtx.translate(rotSourceW / 2, rotSourceH / 2);
    sCtx.rotate((rotation * Math.PI) / 180);
    sCtx.drawImage(originalImg, -sourceW / 2, -sourceH / 2);

    // Map selected 4 corners to absolute coordinates on the upright source image
    const p0 = { x: corners.tl.x * rotSourceW, y: corners.tl.y * rotSourceH }; // TL
    const p1 = { x: corners.tr.x * rotSourceW, y: corners.tr.y * rotSourceH }; // TR
    const p2 = { x: corners.br.x * rotSourceW, y: corners.br.y * rotSourceH }; // BR
    const p3 = { x: corners.bl.x * rotSourceW, y: corners.bl.y * rotSourceH }; // BL

    // Estimate deskewed target dimensions by calculating distances between corners
    const dist = (pt1: { x: number; y: number }, pt2: { x: number; y: number }) => {
      return Math.hypot(pt1.x - pt2.x, pt1.y - pt2.y);
    };

    const topW = dist(p0, p1);
    const bottomW = dist(p3, p2);
    const leftH = dist(p0, p3);
    const rightH = dist(p1, p2);

    const targetW = Math.round(Math.max(topW, bottomW));
    const targetH = Math.round(Math.max(leftH, rightH));

    // Limit extreme dimensions to 2048px to prevent memory crashes while keeping high resolution
    const maxDimension = 2048;
    let finalW = targetW;
    let finalH = targetH;
    if (finalW > maxDimension || finalH > maxDimension) {
      const scale = maxDimension / Math.max(finalW, finalH);
      finalW = Math.round(finalW * scale);
      finalH = Math.round(finalH * scale);
    }

    // Solve for square-to-quad perspective transformation coefficients
    const x0 = p0.x, y0 = p0.y;
    const x1 = p1.x, y1 = p1.y;
    const x2 = p2.x, y2 = p2.y;
    const x3 = p3.x, y3 = p3.y;

    const dx1 = x1 - x2;
    const dx2 = x3 - x2;
    const dy1 = y1 - y2;
    const dy2 = y3 - y2;
    const sx = x0 - x1 + x2 - x3;
    const sy = y0 - y1 + y2 - y3;

    let a: number, b: number, c: number, d: number, e: number, f: number, g: number, h: number;

    if (sx === 0 && sy === 0) {
      // Affine mapping (parallelogram)
      a = x1 - x0;
      b = x3 - x0;
      c = x0;
      d = y1 - y0;
      e = y3 - y0;
      f = y0;
      g = 0;
      h = 0;
    } else {
      const det = dx1 * dy2 - dx2 * dy1;
      if (det === 0) {
        a = x1 - x0;
        b = x3 - x0;
        c = x0;
        d = y1 - y0;
        e = y3 - y0;
        f = y0;
        g = 0;
        h = 0;
      } else {
        g = (sx * dy2 - sy * dx2) / det;
        h = (sy * dx1 - sx * dy1) / det;
        a = x1 - x0 + g * x1;
        b = x3 - x0 + h * x3;
        c = x0;
        d = y1 - y0 + g * y1;
        e = y3 - y0 + h * y3;
        f = y0;
      }
    }

    // Get source upright pixels
    const sourceImgData = sCtx.getImageData(0, 0, rotSourceW, rotSourceH);
    const srcData = sourceImgData.data;

    // Prepare target canvas and destination pixel array
    const targetCanvas = document.createElement('canvas');
    targetCanvas.width = finalW;
    targetCanvas.height = finalH;
    const tCtx = targetCanvas.getContext('2d');
    if (!tCtx) return;

    const targetImgData = tCtx.createImageData(finalW, finalH);
    const dstData = targetImgData.data;

    // Perform inverse perspective mapping with Nearest-Neighbor interpolation
    for (let v = 0; v < finalH; v++) {
      const vPercent = v / finalH;
      for (let u = 0; u < finalW; u++) {
        const uPercent = u / finalW;

        const denom = g * uPercent + h * vPercent + 1;
        const srcX = (a * uPercent + b * vPercent + c) / denom;
        const srcY = (d * uPercent + e * vPercent + f) / denom;

        const clampedX = Math.max(0, Math.min(rotSourceW - 1, Math.round(srcX)));
        const clampedY = Math.max(0, Math.min(rotSourceH - 1, Math.round(srcY)));

        const srcIdx = (clampedY * rotSourceW + clampedX) * 4;
        const dstIdx = (v * finalW + u) * 4;

        dstData[dstIdx] = srcData[srcIdx];         // R
        dstData[dstIdx + 1] = srcData[srcIdx + 1]; // G
        dstData[dstIdx + 2] = srcData[srcIdx + 2]; // B
        dstData[dstIdx + 3] = srcData[srcIdx + 3]; // A
      }
    }

    tCtx.putImageData(targetImgData, 0, 0);

    // Apply Premium Document Contrast Filter if selected
    if (selectedFilter !== 'none') {
      try {
        const imgData = tCtx.getImageData(0, 0, finalW, finalH);
        const data = imgData.data;
        let minL = 255;
        let maxL = 0;

        for (let i = 0; i < data.length; i += 4) {
          const l = 0.299 * data[i] + 0.587 * data[i + 1] + 0.114 * data[i + 2];
          if (l < minL) minL = l;
          if (l > maxL) maxL = l;
        }

        const range = maxL - minL;
        const whitePoint = maxL - range * 0.25; // Brightest 25% becomes pure white
        const blackPoint = minL + range * 0.20; // Darkest 20% becomes pure black
        const stretchRange = whitePoint - blackPoint;

        for (let i = 0; i < data.length; i += 4) {
          const r = data[i];
          const g = data[i + 1];
          const b = data[i + 2];
          const l = 0.299 * r + 0.587 * g + 0.114 * b;

          if (selectedFilter === 'bw') {
            // Pure B&W Threshold Binarization
            if (l >= whitePoint) {
              data[i] = 255; data[i + 1] = 255; data[i + 2] = 255;
            } else if (l <= blackPoint) {
              data[i] = 12; data[i + 1] = 12; data[i + 2] = 12;
            } else {
              const pct = (l - blackPoint) / (stretchRange || 1);
              const binarized = pct > 0.45 ? 255 : 12;
              data[i] = binarized; data[i + 1] = binarized; data[i + 2] = binarized;
            }
          } else if (selectedFilter === 'magic') {
            // Magic Color: Whiten background, preserve colors and sharpen text
            if (l >= whitePoint) {
              data[i] = 255; data[i + 1] = 255; data[i + 2] = 255;
            } else {
              const factor = 1.4;
              const nr = Math.max(0, Math.min(255, (r - 128) * factor + 128));
              const ng = Math.max(0, Math.min(255, (g - 128) * factor + 128));
              const nb = Math.max(0, Math.min(255, (b - 128) * factor + 128));
              
              if (l > whitePoint - range * 0.15) {
                data[i] = 255; data[i + 1] = 255; data[i + 2] = 255;
              } else {
                data[i] = nr; data[i + 1] = ng; data[i + 2] = nb;
              }
            }
          } else if (selectedFilter === 'grayscale') {
            // Grayscale clean scan
            if (l >= whitePoint) {
              data[i] = 255; data[i + 1] = 255; data[i + 2] = 255;
            } else if (l <= blackPoint) {
              data[i] = 12; data[i + 1] = 12; data[i + 2] = 12;
            } else {
              const pct = (l - blackPoint) / (stretchRange || 1);
              const val = Math.max(12, Math.min(255, pct * 243 + 12));
              data[i] = val; data[i + 1] = val; data[i + 2] = val;
            }
          }
        }
        tCtx.putImageData(imgData, 0, 0);
      } catch (err) {
        console.error('Enhancer fail in cropper:', err);
      }
    }

    // Convert to compressed jpeg format and output
    const outputBase64 = targetCanvas.toDataURL('image/jpeg', 0.85);
    onCropComplete(outputBase64);
  };

  return (
    <div className="fixed inset-0 z-[9999] flex flex-col justify-between bg-black text-white select-none animate-in fade-in duration-200 pb-[env(safe-area-inset-bottom,16px)]">
      <style dangerouslySetInnerHTML={{ __html: `
        /* Hide standard bottom navigation bar when cropper is visible */
        .bottom-nav-solid,
        nav[class*="fixed bottom-0"],
        .lg\\:hidden.fixed.bottom-0 {
          display: none !important;
          visibility: hidden !important;
          opacity: 0 !important;
          pointer-events: none !important;
          height: 0 !important;
        }
      ` }} />
      {/* Top Header */}
      <div className="flex items-center justify-between px-4 py-3 md:py-2 bg-zinc-900 border-b border-zinc-800 shrink-0">
        <div className="flex items-center gap-3">
          <div className="w-8 h-8 rounded-lg bg-emerald-500/10 text-emerald-400 flex items-center justify-center">
            <Crop size={18} />
          </div>
          <div>
            <h3 className="font-bold text-sm md:text-base">
              {language === 'bn' ? 'ফটো ক্রপ এবং সোজা করুন' : 'Crop & Deskew Photo'}
            </h3>
            <p className="text-[10px] md:text-xs text-zinc-400">
              {language === 'bn'
                ? '৪টি কোণ টেনে সোজা করুন (প্রতিটি কোণ স্বাধীনভাবে নড়বে)'
                : 'Drag 4 corners to straighten (each corner moves independently)'}
            </p>
          </div>
        </div>
        <button
          onClick={onClose}
          className="w-8 h-8 rounded-full bg-zinc-800 text-zinc-400 hover:text-white flex items-center justify-center transition-colors"
        >
          <X size={18} />
        </button>
      </div>

      {/* Main Editing Area */}
      <div
        ref={containerRef}
        className="flex-1 relative flex items-center justify-center overflow-hidden p-4 min-h-[300px]"
      >
        <div className="relative max-w-full max-h-full flex items-center justify-center">
          {/* Main Display Image */}
          <img
            ref={imgRef}
            src={imageSrc}
            alt="To Crop"
            onLoad={handleImageLoad}
            style={{
              transform: `rotate(${rotation}deg)`,
              filter: getPreviewFilterStyle(),
              maxWidth: '100%',
              maxHeight: '52vh',
              objectFit: 'contain',
              transition: 'transform 0.15s ease-out, filter 0.15s ease-out',
            }}
            className="rounded-lg shadow-2xl select-none pointer-events-none"
          />

          {imageLoaded && imgDisplayDim.width > 0 && (
            // Premium Perspective 4-Corner Overlay & Handles
            <div
              className="absolute top-0 left-0 pointer-events-auto"
              style={{
                width: imgDisplayDim.width,
                height: imgDisplayDim.height,
              }}
              onPointerMove={handlePointerMove}
              onPointerUp={handlePointerUp}
            >
              {/* SVG Dimming Mask & Spotlight Edge Overlay */}
              <svg 
                className="absolute top-0 left-0 w-full h-full pointer-events-none z-10"
                viewBox={`0 0 ${imgDisplayDim.width} ${imgDisplayDim.height}`}
              >
                {/* Dark dimming outside the active perspective quad */}
                <path
                  d={`M 0 0 H ${imgDisplayDim.width} V ${imgDisplayDim.height} H 0 Z 
                     M ${corners.tl.x * imgDisplayDim.width} ${corners.tl.y * imgDisplayDim.height} 
                     L ${corners.tr.x * imgDisplayDim.width} ${corners.tr.y * imgDisplayDim.height} 
                     L ${corners.br.x * imgDisplayDim.width} ${corners.br.y * imgDisplayDim.height} 
                     L ${corners.bl.x * imgDisplayDim.width} ${corners.bl.y * imgDisplayDim.height} Z`}
                  fill="rgba(0, 0, 0, 0.65)"
                  fillRule="evenodd"
                />
                
                {/* Glowing Green Dotted Outline for exact scanning boundaries */}
                <polygon
                  points={`${corners.tl.x * imgDisplayDim.width},${corners.tl.y * imgDisplayDim.height} 
                           ${corners.tr.x * imgDisplayDim.width},${corners.tr.y * imgDisplayDim.height} 
                           ${corners.br.x * imgDisplayDim.width},${corners.br.y * imgDisplayDim.height} 
                           ${corners.bl.x * imgDisplayDim.width},${corners.bl.y * imgDisplayDim.height}`}
                  fill="rgba(16, 185, 129, 0.12)"
                  stroke="#10b981"
                  strokeWidth="2.5"
                  strokeDasharray="5 3"
                />
              </svg>

              {/* 4 Draggable Independent Corner Handles */}
              {[
                { id: 'tl' as const, pos: corners.tl },
                { id: 'tr' as const, pos: corners.tr },
                { id: 'bl' as const, pos: corners.bl },
                { id: 'br' as const, pos: corners.br },
              ].map((h) => (
                <div
                  key={h.id}
                  className="absolute -translate-x-1/2 -translate-y-1/2 w-12 h-12 flex items-center justify-center cursor-pointer z-30 group touch-none"
                  style={{
                    left: h.pos.x * imgDisplayDim.width,
                    top: h.pos.y * imgDisplayDim.height,
                  }}
                  onPointerDown={(e) => handlePointerDown(e, h.id)}
                >
                  {/* Outer circle halo for premium touch response */}
                  <div className="w-6 h-6 rounded-full border-2 border-white bg-emerald-500 shadow-[0_0_10px_rgba(16,185,129,0.8)] group-hover:scale-125 group-active:scale-130 transition-transform flex items-center justify-center">
                    <div className="w-1.5 h-1.5 rounded-full bg-white animate-pulse" />
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* Editor Options and Control Panels */}
      <div className="p-4 bg-zinc-950 border-t border-zinc-800 shrink-0 space-y-4">
        {/* Premium Scanner Filter Selection Chips */}
        <div className="space-y-2">
          <p className="text-[11px] font-black uppercase tracking-wider text-center text-zinc-400 flex items-center justify-center gap-1">
            <Sparkles size={12} className="text-emerald-400 animate-pulse" />
            {language === 'bn' ? 'প্রিমিয়াম স্ক্যানার কালার ফিল্টার' : 'Premium Scanner Color Filters'}
          </p>
          <div className="grid grid-cols-4 gap-1.5 max-w-lg mx-auto">
            {[
              { id: 'none', labelBn: 'স্বাভাবিক', labelEn: 'Original' },
              { id: 'magic', labelBn: 'ম্যাজিক', labelEn: 'Magic Color' },
              { id: 'bw', labelBn: 'গাঢ় সাদা', labelEn: 'B&W Scan' },
              { id: 'grayscale', labelBn: 'গ্রে-স্কেল', labelEn: 'Grayscale' }
            ].map((f) => {
              const isActive = selectedFilter === f.id;
              return (
                <button
                  key={f.id}
                  onClick={() => setSelectedFilter(f.id as any)}
                  className={`py-2 px-1 rounded-lg text-center flex flex-col items-center justify-center gap-1 transition-all active:scale-95 border ${
                    isActive 
                      ? 'bg-emerald-500/20 text-emerald-400 border-emerald-500 shadow-sm' 
                      : 'bg-zinc-900 text-zinc-400 border-zinc-800 hover:bg-zinc-850 hover:text-zinc-200'
                  }`}
                >
                  <span className="text-[11px] font-bold tracking-wide whitespace-nowrap">
                    {language === 'bn' ? f.labelBn : f.labelEn}
                  </span>
                </button>
              );
            })}
          </div>
        </div>

        {/* Operation Buttons */}
        <div className="flex items-center justify-between gap-2 max-w-lg mx-auto">
          {/* Rotate */}
          <button
            onClick={() => setRotation((prev) => (prev + 90) % 360)}
            className="flex-1 py-3 px-2 rounded-xl bg-zinc-800 hover:bg-zinc-750 text-zinc-100 flex flex-col items-center gap-1 transition-all text-xs border border-zinc-700/50"
            title="Rotate image 90 degrees"
          >
            <RotateCw size={18} className="text-blue-400 animate-hover" />
            <span>{language === 'bn' ? 'ঘোরান' : 'Rotate'}</span>
          </button>

          {/* Auto Crop */}
          <button
            onClick={triggerAutoCrop}
            className="flex-grow-[1.5] py-3 px-2 rounded-xl bg-emerald-950/40 hover:bg-emerald-900/40 text-emerald-200 flex flex-col items-center gap-1 transition-all text-xs border border-emerald-500/20"
            title="Automatically detect receipt frame bounds"
          >
            <Sparkles size={18} className="text-emerald-400 animate-pulse" />
            <span className="font-semibold">{language === 'bn' ? 'অটো ক্রপ' : 'Auto Crop'}</span>
          </button>

          {/* Reset */}
          <button
            onClick={triggerReset}
            className="flex-1 py-3 px-2 rounded-xl bg-zinc-800 hover:bg-zinc-750 text-zinc-100 flex flex-col items-center gap-1 transition-all text-xs border border-zinc-700/50"
            title="Reset crop selection and rotation"
          >
            <RefreshCw size={18} className="text-amber-400" />
            <span>{language === 'bn' ? 'রিসেট' : 'Reset'}</span>
          </button>
        </div>

        {/* Footer Action Buttons */}
        <div className="grid grid-cols-2 gap-3 max-w-lg mx-auto">
          <button
            onClick={onClose}
            className="py-3.5 bg-zinc-800 hover:bg-zinc-750 text-zinc-300 rounded-xl font-bold text-sm transition-colors"
          >
            {language === 'bn' ? 'বাতিল' : 'Cancel'}
          </button>
          <button
            onClick={handleConfirmCrop}
            className="py-3.5 bg-gradient-to-r from-emerald-500 to-teal-600 hover:from-emerald-600 hover:to-teal-700 text-white rounded-xl font-bold text-sm transition-all shadow-[0_4px_15px_rgba(16,185,129,0.3)] flex items-center justify-center gap-1.5"
          >
            <Check size={16} />
            {language === 'bn' ? 'নিশ্চিত করুন' : 'Confirm Crop'}
          </button>
        </div>
      </div>
    </div>
  );
}

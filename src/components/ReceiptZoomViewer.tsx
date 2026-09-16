import React, { useState, useRef, useEffect } from 'react';
import { ZoomIn, ZoomOut, RotateCcw, Move } from 'lucide-react';

interface ReceiptZoomViewerProps {
  imageSrc: string;
  language?: string;
}

export default function ReceiptZoomViewer({ imageSrc, language = 'en' }: ReceiptZoomViewerProps) {
  const [scale, setScale] = useState<number>(1);
  const [position, setPosition] = useState<{ x: number; y: number }>({ x: 0, y: 0 });
  const [isDragging, setIsDragging] = useState<boolean>(false);
  
  const containerRef = useRef<HTMLDivElement>(null);
  const dragStartRef = useRef<{ x: number; y: number }>({ x: 0, y: 0 });
  const lastTouchRef = useRef<{ dist: number; scale: number }>({ dist: 0, scale: 1 });

  // Reset view when image source changes
  useEffect(() => {
    setScale(1);
    setPosition({ x: 0, y: 0 });
  }, [imageSrc]);

  // Button actions
  const handleZoomIn = () => {
    setScale((prev) => Math.min(prev + 0.5, 5));
  };

  const handleZoomOut = () => {
    setScale((prev) => {
      const next = Math.max(prev - 0.5, 1);
      if (next === 1) {
        setPosition({ x: 0, y: 0 });
      }
      return next;
    });
  };

  const handleReset = () => {
    setScale(1);
    setPosition({ x: 0, y: 0 });
  };

  // Mouse drag handlers (Desktop)
  const handleMouseDown = (e: React.MouseEvent<HTMLDivElement>) => {
    if (scale <= 1) return;
    setIsDragging(true);
    dragStartRef.current = {
      x: e.clientX - position.x,
      y: e.clientY - position.y,
    };
  };

  const handleMouseMove = (e: React.MouseEvent<HTMLDivElement>) => {
    if (!isDragging || scale <= 1) return;
    
    // Prevent image selection/dragging default behaviour
    e.preventDefault();

    const newX = e.clientX - dragStartRef.current.x;
    const newY = e.clientY - dragStartRef.current.y;
    
    // Constrain panning relative to container bounds to keep image visible
    const container = containerRef.current;
    if (container) {
      const boundaryX = (container.clientWidth * (scale - 1)) / 2;
      const boundaryY = (container.clientHeight * (scale - 1)) / 2;
      
      setPosition({
        x: Math.max(-boundaryX - 100, Math.min(boundaryX + 100, newX)),
        y: Math.max(-boundaryY - 100, Math.min(boundaryY + 100, newY)),
      });
    } else {
      setPosition({ x: newX, y: newY });
    }
  };

  const handleMouseUpOrLeave = () => {
    setIsDragging(false);
  };

  // Touch handlers (Mobile pinch & zoom & drag)
  const handleTouchStart = (e: React.TouchEvent<HTMLDivElement>) => {
    const touches = e.touches;
    
    if (touches.length === 1) {
      // Single finger: Drag/Pan (if zoomed)
      if (scale > 1) {
        setIsDragging(true);
        dragStartRef.current = {
          x: touches[0].clientX - position.x,
          y: touches[0].clientY - position.y,
        };
      }
    } else if (touches.length === 2) {
      // Two fingers: Pinch to zoom
      setIsDragging(false);
      const dist = Math.hypot(
        touches[0].clientX - touches[1].clientX,
        touches[0].clientY - touches[1].clientY
      );
      lastTouchRef.current = { dist, scale };
    }
  };

  const handleTouchMove = (e: React.TouchEvent<HTMLDivElement>) => {
    const touches = e.touches;

    if (touches.length === 1 && isDragging && scale > 1) {
      // Handle finger panning
      const newX = touches[0].clientX - dragStartRef.current.x;
      const newY = touches[0].clientY - dragStartRef.current.y;

      const container = containerRef.current;
      if (container) {
        const boundaryX = (container.clientWidth * (scale - 1)) / 2;
        const boundaryY = (container.clientHeight * (scale - 1)) / 2;
        
        setPosition({
          x: Math.max(-boundaryX - 150, Math.min(boundaryX + 150, newX)),
          y: Math.max(-boundaryY - 150, Math.min(boundaryY + 150, newY)),
        });
      } else {
        setPosition({ x: newX, y: newY });
      }
    } else if (touches.length === 2) {
      // Handle pinch zoom
      const dist = Math.hypot(
        touches[0].clientX - touches[1].clientX,
        touches[0].clientY - touches[1].clientY
      );
      
      const factor = dist / lastTouchRef.current.dist;
      const newScale = Math.max(1, Math.min(lastTouchRef.current.scale * factor, 5));
      setScale(newScale);

      if (newScale === 1) {
        setPosition({ x: 0, y: 0 });
      }
    }
  };

  const handleTouchEnd = () => {
    setIsDragging(false);
  };

  // Add scroll-wheel zoom support on desktop
  const handleWheel = (e: React.WheelEvent<HTMLDivElement>) => {
    e.preventDefault();
    const zoomIntensity = 0.1;
    const delta = e.deltaY < 0 ? 1 : -1;
    
    setScale((prevScale) => {
      const nextScale = Math.max(1, Math.min(prevScale + delta * zoomIntensity, 5));
      if (nextScale === 1) {
        setPosition({ x: 0, y: 0 });
      }
      return nextScale;
    });
  };

  return (
    <div className="relative w-full flex-1 flex flex-col items-center justify-center overflow-hidden bg-black/50 rounded-lg border border-white/5 shadow-inner">
      {/* Zoom / Move Indicator Overlay */}
      {scale > 1 && (
        <div className="absolute top-3 left-3 z-10 flex items-center gap-1 px-2.5 py-1 rounded-md bg-black/60 backdrop-blur-md border border-white/10 text-[10px] font-bold text-zinc-300">
          <Move size={11} className="text-purple-400 animate-pulse" />
          <span>{language === 'bn' ? 'টেনে ডানে-বামে সরান' : 'Drag to Move'} ({scale.toFixed(1)}x)</span>
        </div>
      )}

      {/* Interactive Canvas Container */}
      <div
        ref={containerRef}
        onMouseDown={handleMouseDown}
        onMouseMove={handleMouseMove}
        onMouseUp={handleMouseUpOrLeave}
        onMouseLeave={handleMouseUpOrLeave}
        onTouchStart={handleTouchStart}
        onTouchMove={handleTouchMove}
        onTouchEnd={handleTouchEnd}
        onWheel={handleWheel}
        className="w-full flex-1 flex items-center justify-center overflow-hidden cursor-grab active:cursor-grabbing select-none touch-none p-4"
        style={{ cursor: scale > 1 ? (isDragging ? 'grabbing' : 'grab') : 'default' }}
      >
        <img
          src={imageSrc}
          alt="Zoomable Receipt"
          className="max-w-full max-h-[58vh] object-contain rounded-lg border border-white/5 shadow-lg select-none pointer-events-none transition-transform duration-75 ease-out"
          style={{
            transform: `translate(${position.x}px, ${position.y}px) scale(${scale})`,
            transformOrigin: 'center center',
          }}
          referrerPolicy="no-referrer"
        />
      </div>

      {/* Elegant Control Bar at the bottom */}
      <div className="absolute bottom-3 z-10 flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-zinc-900/90 backdrop-blur-md border border-white/10 shadow-lg">
        <button
          onClick={handleZoomOut}
          disabled={scale <= 1}
          className="w-8 h-8 rounded-full flex items-center justify-center text-zinc-300 hover:text-white hover:bg-white/10 active:scale-95 transition-all disabled:opacity-40 disabled:pointer-events-none"
          title={language === 'bn' ? 'জুম আউট' : 'Zoom Out'}
        >
          <ZoomOut size={16} />
        </button>

        <span className="text-[11px] font-bold text-zinc-400 px-1 min-w-[36px] text-center">
          {Math.round(scale * 100)}%
        </span>

        <button
          onClick={handleZoomIn}
          disabled={scale >= 5}
          className="w-8 h-8 rounded-full flex items-center justify-center text-zinc-300 hover:text-white hover:bg-white/10 active:scale-95 transition-all disabled:opacity-40 disabled:pointer-events-none"
          title={language === 'bn' ? 'জুম ইন' : 'Zoom In'}
        >
          <ZoomIn size={16} />
        </button>

        {scale > 1 && (
          <>
            <div className="h-4 w-[1px] bg-white/10 mx-0.5" />
            <button
              onClick={handleReset}
              className="w-8 h-8 rounded-full flex items-center justify-center text-zinc-400 hover:text-white hover:bg-white/10 active:scale-95 transition-all"
              title={language === 'bn' ? 'রিসেট' : 'Reset View'}
            >
              <RotateCcw size={14} />
            </button>
          </>
        )}
      </div>
    </div>
  );
}

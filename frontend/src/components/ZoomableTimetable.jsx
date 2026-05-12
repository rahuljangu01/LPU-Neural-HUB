import React, { useState, useRef, useCallback, useEffect } from 'react';

const ZoomableTimetable = ({ children, className = "" }) => {
  const [zoom, setZoom] = useState(1);
  const [position, setPosition] = useState({ x: 0, y: 0 });
  const [isDragging, setIsDragging] = useState(false);
  const [isMobile, setIsMobile] = useState(false);
  const containerRef = useRef(null);
  const lastTouchRef = useRef({ distance: 0, centerX: 0, centerY: 0 });

  useEffect(() => {
    const checkMobile = () => {
      setIsMobile(window.innerWidth < 768);
    };
    checkMobile();
    window.addEventListener('resize', checkMobile);
    return () => window.removeEventListener('resize', checkMobile);
  }, []);

  const getDistance = (touches) => {
    const dx = touches[0].clientX - touches[1].clientX;
    const dy = touches[0].clientY - touches[1].clientY;
    return Math.sqrt(dx * dx + dy * dy);
  };

  const getCenter = (touches) => {
    return {
      x: (touches[0].clientX + touches[1].clientX) / 2,
      y: (touches[0].clientY + touches[1].clientY) / 2
    };
  };

  const handleTouchStart = useCallback((e) => {
    if (!isMobile) return;
    
    if (e.touches.length === 2) {
      e.preventDefault();
      const distance = getDistance(e.touches);
      const center = getCenter(e.touches);
      lastTouchRef.current = { distance, centerX: center.x, centerY: center.y };
    } else if (e.touches.length === 1 && zoom > 1) {
      setIsDragging(true);
    }
  }, [zoom, isMobile]);

  const handleTouchMove = useCallback((e) => {
    if (!isMobile) return;
    
    if (e.touches.length === 2) {
      e.preventDefault();
      const distance = getDistance(e.touches);
      const center = getCenter(e.touches);
      
      const scaleFactor = distance / lastTouchRef.current.distance;
      const newZoom = Math.min(Math.max(zoom * scaleFactor, 1), 3);
      setZoom(newZoom);
      
      lastTouchRef.current = { distance, centerX: center.x, centerY: center.y };
    } else if (e.touches.length === 1 && isDragging && zoom > 1) {
      e.preventDefault();
      const touch = e.touches[0];
      const dx = touch.clientX - lastTouchRef.current.centerX;
      const dy = touch.clientY - lastTouchRef.current.centerY;
      setPosition(prev => ({
        x: prev.x + dx * 0.5,
        y: prev.y + dy * 0.5
      }));
      lastTouchRef.current.centerX = touch.clientX;
      lastTouchRef.current.centerY = touch.clientY;
    }
  }, [zoom, isDragging, isMobile]);

  const handleTouchEnd = useCallback((e) => {
    if (!isMobile) return;
    
    if (e.touches.length < 2) {
      setIsDragging(false);
      // Snap zoom to clean values
      if (zoom < 1.25) setZoom(1);
      else if (zoom < 1.75) setZoom(1.5);
      else if (zoom < 2.5) setZoom(2);
      else setZoom(3);
      
      // Reset position when zoomed all the way out
      if (zoom <= 1.1) {
        setPosition({ x: 0, y: 0 });
      }
    }
  }, [zoom, isMobile]);

  const handleDoubleClick = useCallback(() => {
    if (!isMobile) return;
    
    if (zoom > 1) {
      setZoom(1);
      setPosition({ x: 0, y: 0 });
    } else {
      setZoom(2);
    }
  }, [zoom, isMobile]);

  // Desktop: passthrough without zoom controls
  if (!isMobile) {
    return (
      <div className={`overflow-auto ${className}`}>
        {children}
      </div>
    );
  }

  return (
    <div className="relative">
      {zoom > 1 && (
        <div className="fixed top-4 right-4 z-50 flex flex-col gap-2 bg-black/80 backdrop-blur-sm rounded-xl p-2 shadow-lg">
          <button
            onClick={() => {
              const newZoom = Math.min(zoom + 0.5, 3);
              setZoom(newZoom);
            }}
            className="w-10 h-10 bg-white/10 hover:bg-white/20 text-white rounded-lg flex items-center justify-center font-bold text-xl transition-colors"
          >
            +
          </button>
          <div className="text-center text-white text-xs font-bold py-1">
            {Math.round(zoom * 100)}%
          </div>
          <button
            onClick={() => {
              const newZoom = Math.max(zoom - 0.5, 1);
              setZoom(newZoom);
              if (newZoom <= 1) setPosition({ x: 0, y: 0 });
            }}
            className="w-10 h-10 bg-white/10 hover:bg-white/20 text-white rounded-lg flex items-center justify-center font-bold text-xl transition-colors"
          >
            −
          </button>
          <button
            onClick={() => {
              setZoom(1);
              setPosition({ x: 0, y: 0 });
            }}
            className="w-10 h-10 bg-red-500/80 hover:bg-red-500 text-white rounded-lg flex items-center justify-center transition-colors"
          >
            ✕
          </button>
        </div>
      )}

      <div
        ref={containerRef}
        className={`overflow-auto touch-none ${className}`}
        style={{
          transform: `scale(${zoom}) translate(${position.x / zoom}px, ${position.y / zoom}px)`,
          transformOrigin: 'top left',
          transition: isDragging ? 'none' : 'transform 0.2s ease-out'
        }}
        onTouchStart={handleTouchStart}
        onTouchMove={handleTouchMove}
        onTouchEnd={handleTouchEnd}
        onDoubleClick={handleDoubleClick}
      >
        {children}
      </div>
    </div>
  );
};

export default ZoomableTimetable;

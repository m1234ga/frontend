'use client';

import React, { useEffect } from 'react';
import Image from 'next/image';
import { X, Download, ZoomIn, ZoomOut, RotateCw } from 'lucide-react';

interface ImageModalProps {
  isOpen: boolean;
  onClose: () => void;
  imageSrc: string;
  imageAlt?: string;
}

export const ImageModal: React.FC<ImageModalProps> = ({
  isOpen,
  onClose,
  imageSrc,
  imageAlt = 'Image'
}) => {
  const [zoom, setZoom] = React.useState(1);
  const [rotation, setRotation] = React.useState(0);
  const [position, setPosition] = React.useState({ x: 0, y: 0 });
  const [isDragging, setIsDragging] = React.useState(false);
  const [dragStart, setDragStart] = React.useState({ x: 0, y: 0 });

  // Reset state when modal opens/closes
  useEffect(() => {
    if (isOpen) {
      setZoom(1);
      setRotation(0);
      setPosition({ x: 0, y: 0 });
    }
  }, [isOpen]);

  // Handle keyboard events
  useEffect(() => {
    const handleKeyDown = (event: KeyboardEvent) => {
      if (!isOpen) return;

      switch (event.key) {
        case 'Escape':
          onClose();
          break;
        case '+':
        case '=':
          event.preventDefault();
          setZoom(prev => Math.min(prev + 0.2, 3));
          break;
        case '-':
          event.preventDefault();
          setZoom(prev => Math.max(prev - 0.2, 0.5));
          break;
        case 'r':
        case 'R':
          event.preventDefault();
          setRotation(prev => (prev + 90) % 360);
          break;
        case '0':
          event.preventDefault();
          setZoom(1);
          setPosition({ x: 0, y: 0 });
          break;
      }
    };

    document.addEventListener('keydown', handleKeyDown);
    return () => document.removeEventListener('keydown', handleKeyDown);
  }, [isOpen, onClose]);

  // Handle mouse events for dragging
  const handleMouseDown = (e: React.MouseEvent) => {
    if (zoom > 1) {
      setIsDragging(true);
      setDragStart({ x: e.clientX - position.x, y: e.clientY - position.y });
    }
  };

  const handleMouseMove = (e: React.MouseEvent) => {
    if (isDragging && zoom > 1) {
      setPosition({
        x: e.clientX - dragStart.x,
        y: e.clientY - dragStart.y
      });
    }
  };

  const handleMouseUp = () => {
    setIsDragging(false);
  };

  // Handle download
  const handleDownload = async () => {
    try {
      const response = await fetch(imageSrc);
      const blob = await response.blob();
      const url = window.URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      link.download = `image_${Date.now()}.jpg`;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      window.URL.revokeObjectURL(url);
    } catch (error) {
      console.error('Error downloading image:', error);
    }
  };

  // Handle wheel zoom
  const handleWheel = (e: React.WheelEvent) => {
    e.preventDefault();
    const delta = e.deltaY > 0 ? -0.1 : 0.1;
    setZoom(prev => Math.max(0.5, Math.min(3, prev + delta)));
  };

  if (!isOpen) return null;

  return (
    <div 
      className="fixed inset-0 bg-black/90 z-50 flex items-center justify-center"
      onClick={onClose}
    >
      {/* Close button */}
      <button
        onClick={onClose}
        className="absolute top-4 right-4 z-10 p-2 bg-black/50 hover:bg-black/70 rounded-full transition-colors"
        title="Close (Esc)"
      >
        <X className="w-6 h-6 text-white" />
      </button>

      {/* Controls */}
      <div className="absolute top-4 left-4 z-10 flex space-x-2">
        <button
          onClick={() => setZoom(prev => Math.min(prev + 0.2, 3))}
          className="p-2 bg-black/50 hover:bg-black/70 rounded-full transition-colors"
          title="Zoom In (+)"
        >
          <ZoomIn className="w-5 h-5 text-white" />
        </button>
        
        <button
          onClick={() => setZoom(prev => Math.max(prev - 0.2, 0.5))}
          className="p-2 bg-black/50 hover:bg-black/70 rounded-full transition-colors"
          title="Zoom Out (-)"
        >
          <ZoomOut className="w-5 h-5 text-white" />
        </button>
        
        <button
          onClick={() => setRotation(prev => (prev + 90) % 360)}
          className="p-2 bg-black/50 hover:bg-black/70 rounded-full transition-colors"
          title="Rotate (R)"
        >
          <RotateCw className="w-5 h-5 text-white" />
        </button>
        
        <button
          onClick={handleDownload}
          className="p-2 bg-black/50 hover:bg-black/70 rounded-full transition-colors"
          title="Download"
        >
          <Download className="w-5 h-5 text-white" />
        </button>
      </div>

      {/* Image container */}
      <div 
        className="relative max-w-full max-h-full overflow-hidden"
        onWheel={handleWheel}
        onClick={(e) => e.stopPropagation()}
      >
        <div
          className="relative"
          style={{
            transform: `translate(${position.x}px, ${position.y}px) scale(${zoom}) rotate(${rotation}deg)`,
            transition: isDragging ? 'none' : 'transform 0.2s ease-out',
            cursor: zoom > 1 ? (isDragging ? 'grabbing' : 'grab') : 'default'
          }}
          onMouseDown={handleMouseDown}
          onMouseMove={handleMouseMove}
          onMouseUp={handleMouseUp}
          onMouseLeave={handleMouseUp}
        >
          <Image
            src={imageSrc}
            alt={imageAlt}
            width={800}
            height={600}
            className="max-w-none"
            style={{
              maxWidth: '90vw',
              maxHeight: '90vh',
              objectFit: 'contain'
            }}
            priority
          />
        </div>
      </div>

      {/* Zoom info */}
      <div className="absolute bottom-4 left-4 z-10 px-3 py-1 bg-black/50 rounded-full text-white text-sm">
        {Math.round(zoom * 100)}%
      </div>

      {/* Instructions */}
      <div className="absolute bottom-4 right-4 z-10 text-white text-sm bg-black/50 px-3 py-1 rounded-full">
        <div className="text-xs opacity-75">
          Mouse wheel: zoom | Drag: pan | R: rotate | Esc: close
        </div>
      </div>
    </div>
  );
};

import React, { useEffect } from 'react';
import { XMarkIcon, ChevronLeftIcon, ChevronRightIcon } from '@heroicons/react/24/outline';

interface ImageViewerProps {
  images: string[];
  currentIndex: number;
  isOpen: boolean;
  onClose: () => void;
  onNext: () => void;
  onPrevious: () => void;
}

const ImageViewer: React.FC<ImageViewerProps> = ({
  images,
  currentIndex,
  isOpen,
  onClose,
  onNext,
  onPrevious
}) => {
  // Manejar teclas del teclado
  useEffect(() => {
    if (!isOpen) return;

    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        onClose();
      } else if (e.key === 'ArrowLeft') {
        onPrevious();
      } else if (e.key === 'ArrowRight') {
        onNext();
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isOpen, onClose, onNext, onPrevious]);

  // Prevenir scroll del body cuando está abierto
  useEffect(() => {
    if (isOpen) {
      document.body.style.overflow = 'hidden';
    } else {
      document.body.style.overflow = 'unset';
    }
    
    return () => {
      document.body.style.overflow = 'unset';
    };
  }, [isOpen]);

  if (!isOpen) return null;

  const hasMultipleImages = images.length > 1;

  return (
    <div 
      className="fixed inset-0 z-[470] bg-black bg-opacity-95 flex items-center justify-center"
      onClick={onClose}
    >
      {/* Botón de cerrar */}
      <button
        onClick={onClose}
        className="absolute top-4 right-4 z-10 p-2 bg-white bg-opacity-10 hover:bg-opacity-20 rounded-full text-white transition-all"
        aria-label="Cerrar"
      >
        <XMarkIcon className="w-8 h-8" />
      </button>

      {/* Contador de imágenes */}
      {hasMultipleImages && (
        <div className="absolute top-4 left-1/2 transform -translate-x-1/2 z-10 px-4 py-2 bg-black bg-opacity-50 rounded-full text-white text-sm">
          {currentIndex + 1} / {images.length}
        </div>
      )}

      {/* Botón anterior */}
      {hasMultipleImages && (
        <button
          onClick={(e) => {
            e.stopPropagation();
            onPrevious();
          }}
          className="absolute left-4 z-10 p-3 bg-white bg-opacity-10 hover:bg-opacity-20 rounded-full text-white transition-all disabled:opacity-50 disabled:cursor-not-allowed"
          disabled={currentIndex === 0}
          aria-label="Imagen anterior"
        >
          <ChevronLeftIcon className="w-8 h-8" />
        </button>
      )}

      {/* Imagen */}
      <div 
        className="relative max-w-7xl max-h-[90vh] w-full h-full flex items-center justify-center px-20"
        onClick={(e) => e.stopPropagation()}
      >
        <img
          src={images[currentIndex]}
          alt={`Imagen ${currentIndex + 1}`}
          className="max-w-full max-h-full object-contain rounded-lg shadow-2xl"
          draggable={false}
        />
      </div>

      {/* Botón siguiente */}
      {hasMultipleImages && (
        <button
          onClick={(e) => {
            e.stopPropagation();
            onNext();
          }}
          className="absolute right-4 z-10 p-3 bg-white bg-opacity-10 hover:bg-opacity-20 rounded-full text-white transition-all disabled:opacity-50 disabled:cursor-not-allowed"
          disabled={currentIndex === images.length - 1}
          aria-label="Imagen siguiente"
        >
          <ChevronRightIcon className="w-8 h-8" />
        </button>
      )}

      {/* Miniaturas (thumbnails) */}
      {hasMultipleImages && images.length <= 10 && (
        <div className="absolute bottom-4 left-1/2 transform -translate-x-1/2 z-10 flex gap-2 max-w-4xl overflow-x-auto px-4 py-2 bg-black bg-opacity-50 rounded-lg">
          {images.map((image, index) => (
            <button
              key={index}
              onClick={(e) => {
                e.stopPropagation();
                // Aquí necesitaríamos una función para cambiar al índice específico
                // Por ahora solo mostramos las miniaturas
              }}
              className={`flex-shrink-0 w-16 h-16 rounded-lg overflow-hidden border-2 transition-all ${
                index === currentIndex
                  ? 'border-white scale-110'
                  : 'border-transparent opacity-60 hover:opacity-100'
              }`}
            >
              <img
                src={image}
                alt={`Miniatura ${index + 1}`}
                className="w-full h-full object-cover"
                draggable={false}
              />
            </button>
          ))}
        </div>
      )}
    </div>
  );
};

export default ImageViewer;

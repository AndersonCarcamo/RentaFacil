import React, { useState } from 'react';
import {
  PlusIcon,
  FunnelIcon,
  ArrowPathIcon,
  XMarkIcon
} from '@heroicons/react/24/solid';
import {
  HomeIcon,
  ChartBarIcon,
  Cog6ToothIcon
} from '@heroicons/react/24/outline';

interface QuickActionsProps {
  onCreateListing: () => void;
  onOpenFilters: () => void;
  onRefresh: () => void;
  showFilters?: boolean;
}

export const QuickActions: React.FC<QuickActionsProps> = ({
  onCreateListing,
  onOpenFilters,
  onRefresh,
  showFilters = true
}) => {
  const [isExpanded, setIsExpanded] = useState(false);

  const toggleExpanded = () => {
    setIsExpanded(!isExpanded);
  };

  return (
    <>
      {/* Backdrop cuando está expandido */}
      {isExpanded && (
        <div 
          className="fixed inset-0 bg-black/20 z-40"
          onClick={() => setIsExpanded(false)}
        />
      )}

      {/* Contenedor de acciones */}
      <div className="fixed bottom-24 right-4 z-50 flex flex-col items-end gap-3">
        {/* Acciones secundarias (visible cuando está expandido) */}
        {isExpanded && (
          <div className="flex flex-col items-end gap-3 animate-fade-in">
            {/* Refrescar */}
            <button
              onClick={() => {
                onRefresh();
                setIsExpanded(false);
              }}
              className="flex items-center gap-3 bg-white rounded-full shadow-lg px-4 py-3 active:scale-95 transition-transform"
            >
              <span className="text-sm font-medium text-gray-700">Actualizar</span>
              <div className="w-10 h-10 bg-blue-100 rounded-full flex items-center justify-center">
                <ArrowPathIcon className="w-5 h-5 text-blue-600" />
              </div>
            </button>

            {/* Filtros */}
            {showFilters && (
              <button
                onClick={() => {
                  onOpenFilters();
                  setIsExpanded(false);
                }}
                className="flex items-center gap-3 bg-white rounded-full shadow-lg px-4 py-3 active:scale-95 transition-transform"
              >
                <span className="text-sm font-medium text-gray-700">Filtros</span>
                <div className="w-10 h-10 bg-purple-100 rounded-full flex items-center justify-center">
                  <FunnelIcon className="w-5 h-5 text-purple-600" />
                </div>
              </button>
            )}
          </div>
        )}

        {/* Botón principal */}
        <button
          onClick={isExpanded ? () => setIsExpanded(false) : onCreateListing}
          onLongPress={toggleExpanded}
          className={`w-14 h-14 rounded-full shadow-lg flex items-center justify-center active:scale-95 transition-all ${
            isExpanded 
              ? 'bg-red-500' 
              : 'bg-gradient-to-br from-blue-500 to-blue-600'
          }`}
        >
          {isExpanded ? (
            <XMarkIcon className="w-6 h-6 text-white" />
          ) : (
            <PlusIcon className="w-6 h-6 text-white" />
          )}
        </button>

        {/* Etiqueta flotante al hacer hover (opcional en móvil) */}
        {!isExpanded && (
          <div className="absolute right-16 top-1/2 -translate-y-1/2 bg-gray-900 text-white text-xs px-2 py-1 rounded opacity-0 pointer-events-none group-hover:opacity-100 transition-opacity whitespace-nowrap">
            Nueva publicación
          </div>
        )}
      </div>
    </>
  );
};

// Hook personalizado para detectar long press (opcional)
declare module 'react' {
  interface HTMLAttributes<T> {
    onLongPress?: () => void;
  }
}

// Extender el componente button para soportar long press
const ButtonWithLongPress = React.forwardRef<
  HTMLButtonElement,
  React.ButtonHTMLAttributes<HTMLButtonElement> & { onLongPress?: () => void }
>(({ onLongPress, onClick, ...props }, ref) => {
  const [pressTimer, setPressTimer] = React.useState<NodeJS.Timeout | null>(null);

  const handleTouchStart = () => {
    if (onLongPress) {
      const timer = setTimeout(() => {
        onLongPress();
      }, 500); // 500ms para long press
      setPressTimer(timer);
    }
  };

  const handleTouchEnd = () => {
    if (pressTimer) {
      clearTimeout(pressTimer);
      setPressTimer(null);
    }
  };

  return (
    <button
      ref={ref}
      onTouchStart={handleTouchStart}
      onTouchEnd={handleTouchEnd}
      onMouseDown={handleTouchStart}
      onMouseUp={handleTouchEnd}
      onMouseLeave={handleTouchEnd}
      onClick={onClick}
      {...props}
    />
  );
});

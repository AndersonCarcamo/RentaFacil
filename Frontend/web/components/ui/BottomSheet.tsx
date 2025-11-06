import { useState, useEffect, useRef, ReactNode } from 'react'
import { createPortal } from 'react-dom'

export type SheetState = 'minimized' | 'medium' | 'expanded'

interface BottomSheetProps {
  isOpen: boolean
  onClose: () => void
  children: ReactNode
  initialState?: SheetState
  onStateChange?: (state: SheetState) => void
}

const SHEET_HEIGHTS = {
  minimized: '20vh',  // Muestra 1 propiedad
  medium: '50vh',     // Muestra 2-3 propiedades
  expanded: '85vh'    // Lista completa
}

export default function BottomSheet({ 
  isOpen, 
  onClose, 
  children, 
  initialState = 'medium',
  onStateChange 
}: BottomSheetProps) {
  const [state, setState] = useState<SheetState>(initialState)
  const [isDragging, setIsDragging] = useState(false)
  const [startY, setStartY] = useState(0)
  const [currentY, setCurrentY] = useState(0)
  const [isMounted, setIsMounted] = useState(false)
  const sheetRef = useRef<HTMLDivElement>(null)

  // Fix hydration: only render portal on client side
  useEffect(() => {
    setIsMounted(true)
  }, [])

  useEffect(() => {
    if (isOpen) {
      setState(initialState)
    }
  }, [isOpen, initialState])

  useEffect(() => {
    onStateChange?.(state)
  }, [state, onStateChange])

  if (!isOpen || !isMounted) return null

  const handleDragStart = (clientY: number) => {
    setIsDragging(true)
    setStartY(clientY)
    setCurrentY(clientY)
  }

  const handleDragMove = (clientY: number) => {
    if (!isDragging) return
    setCurrentY(clientY)
  }

  const handleDragEnd = () => {
    if (!isDragging) return
    setIsDragging(false)

    const deltaY = currentY - startY
    const threshold = 50 // Umbral mínimo de movimiento

    if (Math.abs(deltaY) < threshold) return

    // Determinar nuevo estado basado en dirección del arrastre
    if (deltaY > 0) {
      // Arrastrar hacia abajo
      if (state === 'expanded') setState('medium')
      else if (state === 'medium') setState('minimized')
      else onClose() // Si está minimizado y arrastra más, cerrar
    } else {
      // Arrastrar hacia arriba
      if (state === 'minimized') setState('medium')
      else if (state === 'medium') setState('expanded')
    }
  }

  const getTransform = () => {
    if (!isDragging) return 'translateY(0)'
    const deltaY = Math.max(0, currentY - startY) // Solo permitir arrastrar hacia abajo
    return `translateY(${deltaY}px)`
  }

  const sheetContent = (
    <div 
      ref={sheetRef}
      className="fixed inset-x-0 bottom-0 z-[9999] bg-white rounded-t-3xl shadow-2xl transition-all duration-300 ease-out flex flex-col"
      style={{
        height: SHEET_HEIGHTS[state],
        transform: getTransform(),
        willChange: 'transform, height'
      }}
      onTouchStart={(e) => handleDragStart(e.touches[0].clientY)}
      onTouchMove={(e) => handleDragMove(e.touches[0].clientY)}
      onTouchEnd={handleDragEnd}
      onMouseDown={(e) => handleDragStart(e.clientY)}
      onMouseMove={(e) => e.buttons === 1 && handleDragMove(e.clientY)}
      onMouseUp={handleDragEnd}
      onMouseLeave={handleDragEnd}
    >
      {/* Handle - Barra para arrastrar */}
      <div className="flex-shrink-0 py-3 px-4 cursor-grab active:cursor-grabbing">
        <div className="w-12 h-1 bg-gray-300 rounded-full mx-auto" />
      </div>

      {/* Content */}
      <div className="flex-1 overflow-hidden flex flex-col">
        {children}
      </div>
    </div>
  )

  return typeof document !== 'undefined'
    ? createPortal(sheetContent, document.body)
    : null
}

// Componente para el header del sheet
export function SheetHeader({ children }: { children: ReactNode }) {
  return (
    <div className="flex-shrink-0 px-4 pb-3 border-b border-gray-200">
      {children}
    </div>
  )
}

// Componente para el contenido scrolleable del sheet
export function SheetContent({ children }: { children: ReactNode }) {
  return (
    <div className="flex-1 overflow-y-auto px-5 py-4">
      {children}
    </div>
  )
}

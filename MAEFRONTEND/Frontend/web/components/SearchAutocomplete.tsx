import { useState, useEffect, useRef } from 'react'
import { MagnifyingGlassIcon, ClockIcon, XMarkIcon } from '@heroicons/react/24/outline'

interface SearchAutocompleteProps {
  value: string
  onChange: (value: string) => void
  onSelect?: (value: string) => void
  placeholder?: string
  className?: string
}

interface SearchHistory {
  text: string
  timestamp: number
}

const STORAGE_KEY = 'rentafacil_search_history'
const MAX_HISTORY = 5

// Distritos de Lima y Callao
const POPULAR_LOCATIONS = [
  // Lima Centro
  'Lima Centro',
  'Cercado de Lima',
  'Breña',
  'La Victoria',
  'Rímac',
  
  // Lima Moderna
  'Miraflores',
  'San Isidro',
  'Barranco',
  'Santiago de Surco',
  'Surco',
  'La Molina',
  'San Borja',
  'Jesús María',
  'Lince',
  'Magdalena del Mar',
  'Magdalena',
  'Pueblo Libre',
  'San Miguel',
  
  // Lima Este
  'Ate',
  'Santa Anita',
  'El Agustino',
  'San Luis',
  'Chaclacayo',
  'Lurigancho',
  'Chosica',
  
  // Lima Norte
  'Los Olivos',
  'Independencia',
  'San Martín de Porres',
  'Comas',
  'Carabayllo',
  'Puente Piedra',
  'Santa Rosa',
  'Ancón',
  
  // Lima Sur
  'Chorrillos',
  'Villa El Salvador',
  'Villa María del Triunfo',
  'San Juan de Miraflores',
  'Lurín',
  'Pachacamac',
  'Punta Hermosa',
  'Punta Negra',
  'San Bartolo',
  'Santa María del Mar',
  'Pucusana',
  
  // Callao
  'Callao',
  'Bellavista',
  'La Perla',
  'La Punta',
  'Carmen de la Legua',
  'Ventanilla',
]

// Sugerencias de búsqueda comunes
const SEARCH_SUGGESTIONS = [
  'Departamento en Miraflores',
  'Casa en San Isidro',
  'Departamento amoblado',
  'Casa con jardín',
  'Oficina en San Isidro',
  'Departamento en Barranco',
  'Estudio cerca al mar',
  'Departamento con vista al mar',
  'Casa para familia',
  'Departamento moderno',
  'Local comercial',
  'Terreno',
]

export default function SearchAutocomplete({
  value,
  onChange,
  onSelect,
  placeholder,
  className = ''
}: SearchAutocompleteProps) {
  const [isOpen, setIsOpen] = useState(false)
  const [searchHistory, setSearchHistory] = useState<SearchHistory[]>([])
  const [filteredSuggestions, setFilteredSuggestions] = useState<string[]>([])
  const wrapperRef = useRef<HTMLDivElement>(null)

  // Cargar historial desde localStorage
  useEffect(() => {
    const stored = localStorage.getItem(STORAGE_KEY)
    if (stored) {
      try {
        const history: SearchHistory[] = JSON.parse(stored)
        setSearchHistory(history.slice(0, MAX_HISTORY))
      } catch (error) {
        console.error('Error loading search history:', error)
      }
    }
  }, [])

  // Filtrar sugerencias basadas en el input con debouncing
  useEffect(() => {
    // Debouncing: esperar 300ms después de que el usuario deje de escribir
    const timeoutId = setTimeout(() => {
      if (value.trim().length > 0) {
        const query = value.toLowerCase()
        
        // Buscar en ubicaciones
        const locationMatches = POPULAR_LOCATIONS.filter(location =>
          location.toLowerCase().includes(query)
        )
        
        // Buscar en sugerencias de búsqueda comunes
        const searchMatches = SEARCH_SUGGESTIONS.filter(suggestion =>
          suggestion.toLowerCase().includes(query)
        )
        
        // Combinar y limitar resultados
        const allMatches = [...searchMatches, ...locationMatches].slice(0, 8)
        setFilteredSuggestions(allMatches)
      } else {
        setFilteredSuggestions([])
      }
    }, 300)
    
    return () => clearTimeout(timeoutId)
  }, [value])

  // Cerrar dropdown al hacer click fuera
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (wrapperRef.current && !wrapperRef.current.contains(event.target as Node)) {
        setIsOpen(false)
      }
    }

    document.addEventListener('mousedown', handleClickOutside)
    return () => document.removeEventListener('mousedown', handleClickOutside)
  }, [])

  const saveToHistory = (searchText: string) => {
    if (!searchText.trim()) return

    const newHistory: SearchHistory[] = [
      { text: searchText, timestamp: Date.now() },
      ...searchHistory.filter(item => item.text !== searchText)
    ].slice(0, MAX_HISTORY)

    setSearchHistory(newHistory)
    localStorage.setItem(STORAGE_KEY, JSON.stringify(newHistory))
  }

  const removeFromHistory = (text: string, e: React.MouseEvent) => {
    e.stopPropagation()
    const newHistory = searchHistory.filter(item => item.text !== text)
    setSearchHistory(newHistory)
    localStorage.setItem(STORAGE_KEY, JSON.stringify(newHistory))
  }

  const clearHistory = () => {
    setSearchHistory([])
    localStorage.removeItem(STORAGE_KEY)
  }

  const handleSelect = (text: string) => {
    onChange(text)
    saveToHistory(text)
    setIsOpen(false)
    onSelect?.(text)
  }

  const handleInputChange = (newValue: string) => {
    onChange(newValue)
    if (newValue.trim().length > 0 || searchHistory.length > 0) {
      setIsOpen(true)
    }
  }

  const handleFocus = () => {
    if (value.trim().length > 0 || searchHistory.length > 0) {
      setIsOpen(true)
    }
  }

  const showHistory = searchHistory.length > 0 && value.trim().length === 0
  const showSuggestions = filteredSuggestions.length > 0 && value.trim().length > 0

  return (
    <div ref={wrapperRef} className={`relative ${className}`}>
      <input
        type="text"
        value={value}
        onChange={(e) => handleInputChange(e.target.value)}
        onFocus={handleFocus}
        placeholder={placeholder}
        className="w-full rounded-lg border border-brand-navy/20 bg-white/70 py-2 pl-10 pr-3 text-sm text-brand-navy placeholder:text-brand-navy/40 focus:border-brand-navy/40 focus:outline-none focus:ring-2 focus:ring-secondary-500/60"
      />

      {/* Dropdown */}
      {isOpen && (showHistory || showSuggestions) && (
        <div className="absolute top-full left-0 right-0 mt-1 bg-white rounded-lg shadow-lg border border-gray-200 max-h-64 overflow-y-auto z-50">
          {/* Búsquedas recientes */}
          {showHistory && (
            <div className="py-2">
              <div className="flex items-center justify-between px-4 py-2">
                <span className="text-xs font-semibold text-gray-500 uppercase">Búsquedas recientes</span>
                <button
                  onClick={clearHistory}
                  className="text-xs text-gray-400 hover:text-gray-600 transition"
                >
                  Limpiar
                </button>
              </div>
              {searchHistory.map((item, index) => (
                <button
                  key={`${item.text}-${index}`}
                  onClick={() => handleSelect(item.text)}
                  className="w-full flex items-center justify-between px-4 py-2 hover:bg-gray-50 transition text-left group"
                >
                  <div className="flex items-center gap-3 flex-1 min-w-0">
                    <ClockIcon className="h-4 w-4 text-gray-400 flex-shrink-0" />
                    <span className="text-sm text-brand-navy truncate">{item.text}</span>
                  </div>
                  <button
                    onClick={(e) => removeFromHistory(item.text, e)}
                    className="opacity-0 group-hover:opacity-100 p-1 hover:bg-gray-200 rounded transition"
                    title="Eliminar"
                  >
                    <XMarkIcon className="h-4 w-4 text-gray-500" />
                  </button>
                </button>
              ))}
            </div>
          )}

          {/* Separador */}
          {showHistory && showSuggestions && (
            <div className="border-t border-gray-100" />
          )}

          {/* Sugerencias de autocompletado */}
          {showSuggestions && (
            <div className="py-2">
              <div className="px-4 py-2">
                <span className="text-xs font-semibold text-gray-500 uppercase">Sugerencias</span>
              </div>
              {filteredSuggestions.map((suggestion, index) => (
                <button
                  key={`${suggestion}-${index}`}
                  onClick={() => handleSelect(suggestion)}
                  className="w-full flex items-center gap-3 px-4 py-2 hover:bg-gray-50 transition text-left"
                >
                  <MagnifyingGlassIcon className="h-4 w-4 text-gray-400 flex-shrink-0" />
                  <span className="text-sm text-brand-navy">
                    {suggestion.split(new RegExp(`(${value})`, 'gi')).map((part, i) =>
                      part.toLowerCase() === value.toLowerCase() ? (
                        <strong key={i} className="font-semibold text-secondary-600">
                          {part}
                        </strong>
                      ) : (
                        <span key={i}>{part}</span>
                      )
                    )}
                  </span>
                </button>
              ))}
            </div>
          )}
        </div>
      )}
    </div>
  )
}

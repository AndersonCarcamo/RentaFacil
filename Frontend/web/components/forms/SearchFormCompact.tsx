import { useState, useEffect, useRef } from 'react'
import Button from '../ui/Button'
import { 
  MagnifyingGlassIcon, 
  MapPinIcon, 
  AdjustmentsHorizontalIcon, 
  BuildingOffice2Icon, 
  HomeIcon,
  XMarkIcon,
  ChevronDownIcon,
  FunnelIcon
} from '@heroicons/react/24/outline'

type Mode = 'alquiler' | 'comprar' | 'vender' | 'proyecto'

interface SearchFormProps {
  onSearch?: (params: { 
    mode: Mode
    location: string
    minPrice?: number
    maxPrice?: number
    propertyType?: string
    bedrooms?: number
    bathrooms?: number
    minArea?: number
    maxArea?: number
    furnished?: boolean
    verified?: boolean
    rentalMode?: string
    petFriendly?: boolean
    ageYears?: string
  }) => void
  className?: string
  isLoading?: boolean
  placeholder?: string
}

const formatPrice = (num: number): string => {
  return num.toString().replace(/\B(?=(\d{3})+(?!\d))/g, ',')
}

export default function SearchFormCompact({ onSearch, className = '', isLoading = false, placeholder }: SearchFormProps) {
  const [mode, setMode] = useState<Mode>('alquiler')
  const [location, setLocation] = useState('')
  const [propertyType, setPropertyType] = useState('')
  const [minPrice, setMinPrice] = useState('')
  const [maxPrice, setMaxPrice] = useState('')
  const [advanced, setAdvanced] = useState(false)
  const [isScrolled, setIsScrolled] = useState(false)
  
  // Filtros avanzados
  const [bedrooms, setBedrooms] = useState('')
  const [bathrooms, setBathrooms] = useState('')
  const [minArea, setMinArea] = useState('')
  const [maxArea, setMaxArea] = useState('')
  const [furnished, setFurnished] = useState<boolean | undefined>(undefined)
  const [verified, setVerified] = useState<boolean | undefined>(undefined)
  const [rentalMode, setRentalMode] = useState('')
  const [petFriendly, setPetFriendly] = useState<boolean | undefined>(undefined)
  const [ageYears, setAgeYears] = useState('')
  const [showFiltersDropdown, setShowFiltersDropdown] = useState(false)
  const dropdownRef = useRef<HTMLDivElement>(null)

  // Detect scroll for minification with debounce
  useEffect(() => {
    let ticking = false
    let lastScrollY = window.scrollY

    const handleScroll = () => {
      lastScrollY = window.scrollY

      if (!ticking) {
        window.requestAnimationFrame(() => {
          const shouldBeScrolled = lastScrollY > 50
          if (shouldBeScrolled !== isScrolled) {
            setIsScrolled(shouldBeScrolled)
          }
          ticking = false
        })
        ticking = true
      }
    }
    
    window.addEventListener('scroll', handleScroll, { passive: true })
    return () => window.removeEventListener('scroll', handleScroll)
  }, [isScrolled])

  // Close dropdown when clicking outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setShowFiltersDropdown(false)
      }
    }

    document.addEventListener('mousedown', handleClickOutside)
    return () => document.removeEventListener('mousedown', handleClickOutside)
  }, [])

  const submit = (e: React.FormEvent) => {
    e.preventDefault()
    onSearch?.({
      mode,
      location: location.trim(),
      minPrice: minPrice ? Number(minPrice) : undefined,
      maxPrice: maxPrice ? Number(maxPrice) : undefined,
      propertyType: propertyType || undefined,
      bedrooms: bedrooms ? Number(bedrooms) : undefined,
      bathrooms: bathrooms ? Number(bathrooms) : undefined,
      minArea: minArea ? Number(minArea) : undefined,
      maxArea: maxArea ? Number(maxArea) : undefined,
      furnished: furnished,
      verified: verified,
      rentalMode: rentalMode || undefined,
      petFriendly: petFriendly,
      ageYears: ageYears || undefined
    })
  }

  // Contar filtros activos
  const activeFiltersCount = [
    location,
    propertyType,
    minPrice,
    maxPrice,
    bedrooms,
    bathrooms,
    minArea,
    maxArea,
    furnished,
    verified,
    rentalMode,
    petFriendly,
    ageYears
  ].filter(Boolean).length

  // Generar chips de filtros activos
  const getActiveFiltersChips = () => {
    const chips: { label: string; onRemove: () => void }[] = []
    
    if (location) chips.push({ label: `📍 ${location}`, onRemove: () => setLocation('') })
    if (propertyType) {
      const typeLabels: Record<string, string> = {
        apartment: 'Departamento',
        house: 'Casa',
        TipoAirbnb: 'Tipo Airbnb',
        room: 'Habitación',
        studio: 'Estudio',
        office: 'Oficina'
      }
      chips.push({ label: typeLabels[propertyType] || propertyType, onRemove: () => setPropertyType('') })
    }
    if (minPrice || maxPrice) {
      const priceLabel = minPrice && maxPrice 
        ? `S/ ${formatPrice(Number(minPrice))} - ${formatPrice(Number(maxPrice))}`
        : minPrice 
          ? `Desde S/ ${formatPrice(Number(minPrice))}`
          : `Hasta S/ ${formatPrice(Number(maxPrice))}`
      chips.push({ label: priceLabel, onRemove: () => { setMinPrice(''); setMaxPrice('') }})
    }
    if (bedrooms) chips.push({ label: `${bedrooms}+ hab`, onRemove: () => setBedrooms('') })
    if (bathrooms) chips.push({ label: `${bathrooms}+ baños`, onRemove: () => setBathrooms('') })
    if (furnished) chips.push({ label: 'Amoblado', onRemove: () => setFurnished(undefined) })
    if (verified) chips.push({ label: '✓ Verificado', onRemove: () => setVerified(undefined) })
    if (petFriendly) chips.push({ label: '🐕 Pet Friendly', onRemove: () => setPetFriendly(undefined) })
    
    return chips
  }

  const clearAllFilters = () => {
    setLocation('')
    setPropertyType('')
    setMinPrice('')
    setMaxPrice('')
    setBedrooms('')
    setBathrooms('')
    setMinArea('')
    setMaxArea('')
    setFurnished(undefined)
    setVerified(undefined)
    setRentalMode('')
    setPetFriendly(undefined)
    setAgeYears('')
  }

  const activeChips = getActiveFiltersChips()

  return (
    <form
      onSubmit={submit}
      className={`w-full rounded-2xl bg-white shadow-lg transition-all duration-300 ease-in-out ${
        isScrolled ? 'py-2 px-4' : 'p-4'
      } ${className}`}
    >
      {/* Vista Minificada (cuando hay scroll) */}
      <div className={`transition-opacity duration-300 ${isScrolled ? 'opacity-100' : 'opacity-0 hidden'}`}>
        <div className="flex items-center gap-3">
          <MapPinIcon className="w-5 h-5 text-gray-400 flex-shrink-0" />
          <input
            value={location}
            onChange={(e) => setLocation(e.target.value)}
            placeholder="Buscar ubicación..."
            className="flex-1 py-2 text-sm text-gray-900 placeholder:text-gray-400 focus:outline-none bg-transparent"
          />
          
          {/* Dropdown de Filtros Activos en Vista Minificada */}
          {activeFiltersCount > 0 && (
            <div className="relative" ref={dropdownRef}>
              <button
                type="button"
                onClick={() => setShowFiltersDropdown(!showFiltersDropdown)}
                className="flex items-center gap-2 px-3 py-1.5 bg-blue-50 text-blue-700 rounded-full text-xs font-medium hover:bg-blue-100 transition-colors"
              >
                <FunnelIcon className="w-4 h-4" />
                {activeFiltersCount}
                <ChevronDownIcon className={`w-3 h-3 transition-transform ${showFiltersDropdown ? 'rotate-180' : ''}`} />
              </button>

              {/* Dropdown Content */}
              {showFiltersDropdown && (
                <div className="absolute top-full right-0 mt-2 w-80 bg-white rounded-lg shadow-xl border border-gray-200 z-50 max-h-[400px] overflow-y-auto">
                  <div className="p-4">
                    <div className="flex items-center justify-between mb-3 pb-3 border-b border-gray-200">
                      <h3 className="text-sm font-semibold text-gray-900">Filtros activos</h3>
                      <button
                        type="button"
                        onClick={() => {
                          clearAllFilters()
                          setShowFiltersDropdown(false)
                        }}
                        className="text-xs font-medium text-red-600 hover:text-red-700 hover:underline"
                      >
                        Limpiar todo
                      </button>
                    </div>

                    <div className="space-y-2">
                      {activeChips.map((chip, index) => (
                        <div
                          key={index}
                          className="flex items-center justify-between p-2 bg-gray-50 hover:bg-gray-100 rounded-lg transition-colors group"
                        >
                          <span className="text-sm text-gray-700">{chip.label}</span>
                          <button
                            type="button"
                            onClick={chip.onRemove}
                            className="p-1 text-gray-400 hover:text-red-600 hover:bg-red-50 rounded-full transition-colors"
                          >
                            <XMarkIcon className="w-4 h-4" />
                          </button>
                        </div>
                      ))}
                    </div>
                  </div>
                </div>
              )}
            </div>
          )}
          
          <button
            type="button"
            onClick={() => setAdvanced(!advanced)}
            className="flex items-center gap-1 px-3 py-1.5 text-sm font-medium text-gray-700 hover:bg-gray-100 rounded-lg transition"
          >
            Filtros
            <ChevronDownIcon className={`w-4 h-4 transition-transform ${advanced ? 'rotate-180' : ''}`} />
          </button>
          
          <Button type="submit" variant="primary" size="sm" loading={isLoading}>
            <MagnifyingGlassIcon className="h-4 w-4" />
          </Button>
        </div>
      </div>

      {/* Vista Normal (sin scroll) */}
      <div className={`transition-opacity duration-300 ${!isScrolled ? 'opacity-100' : 'opacity-0 hidden'}`}>
        {/* Tabs de Modo */}
        <div className="flex flex-wrap items-center justify-between gap-2 mb-4">
            <div className="flex gap-2">
              <button
                type="button"
                onClick={() => setMode('alquiler')}
                className={`flex items-center gap-1 rounded-full px-4 py-2 text-sm font-semibold transition ${
                  mode === 'alquiler'
                    ? 'bg-blue-600 text-white shadow'
                    : 'text-gray-600 hover:bg-gray-100'
                }`}
              >
                <BuildingOffice2Icon className="h-4 w-4" /> Alquiler
              </button>
              <button
                type="button"
                onClick={() => setMode('comprar')}
                className={`flex items-center gap-1 rounded-full px-4 py-2 text-sm font-semibold transition ${
                  mode === 'comprar'
                    ? 'bg-blue-600 text-white shadow'
                    : 'text-gray-600 hover:bg-gray-100'
                }`}
              >
                <HomeIcon className="h-4 w-4" /> Comprar
              </button>
            </div>

            {/* Logo */}
            <div className="text-xl font-bold">
              <span className="text-yellow-500">RENTA</span>
              <span className="text-blue-600"> fácil</span>
            </div>
          </div>

          {/* Campos Principales */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-3 mb-3">
            {/* Ubicación */}
            <div className="md:col-span-1">
              <div className="relative">
                <MapPinIcon className="absolute left-3 top-1/2 -translate-y-1/2 h-5 w-5 text-gray-400" />
                <input
                  value={location}
                  onChange={(e) => setLocation(e.target.value)}
                  placeholder={placeholder || "¿Dónde quieres buscar?"}
                  className="w-full rounded-lg border border-gray-300 bg-white py-2.5 pl-10 pr-3 text-sm text-gray-900 placeholder:text-gray-400 focus:border-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-500/20"
                />
              </div>
            </div>

            {/* Tipo de Propiedad */}
            <div>
              <select
                value={propertyType}
                onChange={(e) => setPropertyType(e.target.value)}
                className="w-full rounded-lg border border-gray-300 bg-white py-2.5 px-3 text-sm text-gray-900 focus:border-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-500/20"
              >
                <option value="">Tipo de propiedad</option>
                <option value="apartment">Departamento</option>
                <option value="house">Casa</option>
                <option value="TipoAirbnb">Tipo airbnb</option>
                <option value="room">Habitación</option>
                <option value="studio">Estudio</option>
                <option value="office">Oficina</option>
              </select>
            </div>

            {/* Botón de búsqueda */}
            <div className="flex gap-2">
              <Button type="submit" variant="primary" className="flex-1" loading={isLoading}>
                <MagnifyingGlassIcon className="h-5 w-5 mr-2" />
                Buscar
              </Button>
              <button
                type="button"
                onClick={() => setAdvanced(!advanced)}
                className={`px-4 rounded-lg border transition ${
                  advanced 
                    ? 'bg-blue-50 border-blue-300 text-blue-700' 
                    : 'bg-white border-gray-300 text-gray-700 hover:bg-gray-50'
                }`}
              >
                <AdjustmentsHorizontalIcon className="h-5 w-5" />
              </button>
            </div>
          </div>

          {/* Dropdown Compacto de Filtros Activos */}
          {activeChips.length > 0 && (
            <div className="relative mb-3" ref={dropdownRef}>
              <button
                type="button"
                onClick={() => setShowFiltersDropdown(!showFiltersDropdown)}
                className="flex items-center gap-2 px-4 py-2 bg-blue-50 text-blue-700 rounded-lg text-sm font-medium hover:bg-blue-100 transition-colors w-full md:w-auto"
              >
                <FunnelIcon className="w-4 h-4" />
                {activeChips.length} {activeChips.length === 1 ? 'filtro aplicado' : 'filtros aplicados'}
                <ChevronDownIcon className={`w-4 h-4 transition-transform ${showFiltersDropdown ? 'rotate-180' : ''}`} />
              </button>

              {/* Dropdown Content */}
              {showFiltersDropdown && (
                <div className="absolute top-full left-0 mt-2 w-full md:w-96 bg-white rounded-lg shadow-xl border border-gray-200 z-50 max-h-[400px] overflow-y-auto">
                  <div className="p-4">
                    <div className="flex items-center justify-between mb-3 pb-3 border-b border-gray-200">
                      <h3 className="text-sm font-semibold text-gray-900">Filtros activos</h3>
                      <button
                        type="button"
                        onClick={() => {
                          clearAllFilters()
                          setShowFiltersDropdown(false)
                        }}
                        className="text-xs font-medium text-red-600 hover:text-red-700 hover:underline"
                      >
                        Limpiar todo
                      </button>
                    </div>

                    <div className="space-y-2">
                      {activeChips.map((chip, index) => (
                        <div
                          key={index}
                          className="flex items-center justify-between p-2 bg-gray-50 hover:bg-gray-100 rounded-lg transition-colors group"
                        >
                          <span className="text-sm text-gray-700">{chip.label}</span>
                          <button
                            type="button"
                            onClick={chip.onRemove}
                            className="p-1 text-gray-400 hover:text-red-600 hover:bg-red-50 rounded-full transition-colors"
                          >
                            <XMarkIcon className="w-4 h-4" />
                          </button>
                        </div>
                      ))}
                    </div>
                  </div>
                </div>
              )}
            </div>
          )}
      </div>

      {/* Filtros Avanzados (Colapsables) */}
      <div className={`overflow-hidden transition-all duration-300 ${
        advanced ? 'max-h-[800px] opacity-100 mt-4' : 'max-h-0 opacity-0'
      }`}>
        <div className="space-y-4 pt-4 border-t border-gray-200">
          {/* Precio */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-medium text-gray-700 mb-1">
                Precio mínimo (S/)
              </label>
              <input
                type="number"
                value={minPrice}
                onChange={(e) => setMinPrice(e.target.value)}
                placeholder="0"
                className="w-full rounded-lg border border-gray-300 bg-white py-2 px-3 text-sm focus:border-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-500/20"
              />
            </div>
            <div>
              <label className="block text-xs font-medium text-gray-700 mb-1">
                Precio máximo (S/)
              </label>
              <input
                type="number"
                value={maxPrice}
                onChange={(e) => setMaxPrice(e.target.value)}
                placeholder="10000"
                className="w-full rounded-lg border border-gray-300 bg-white py-2 px-3 text-sm focus:border-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-500/20"
              />
            </div>
          </div>

          {/* Habitaciones y Baños */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-medium text-gray-700 mb-1">
                Habitaciones
              </label>
              <select
                value={bedrooms}
                onChange={(e) => setBedrooms(e.target.value)}
                className="w-full rounded-lg border border-gray-300 bg-white py-2 px-3 text-sm focus:border-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-500/20"
              >
                <option value="">Cualquiera</option>
                <option value="1">1+</option>
                <option value="2">2+</option>
                <option value="3">3+</option>
                <option value="4">4+</option>
                <option value="5">5+</option>
              </select>
            </div>
            <div>
              <label className="block text-xs font-medium text-gray-700 mb-1">
                Baños
              </label>
              <select
                value={bathrooms}
                onChange={(e) => setBathrooms(e.target.value)}
                className="w-full rounded-lg border border-gray-300 bg-white py-2 px-3 text-sm focus:border-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-500/20"
              >
                <option value="">Cualquiera</option>
                <option value="1">1+</option>
                <option value="2">2+</option>
                <option value="3">3+</option>
                <option value="4">4+</option>
              </select>
            </div>
          </div>

          {/* Área */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-medium text-gray-700 mb-1">
                Área mínima (m²)
              </label>
              <input
                type="number"
                value={minArea}
                onChange={(e) => setMinArea(e.target.value)}
                placeholder="50"
                className="w-full rounded-lg border border-gray-300 bg-white py-2 px-3 text-sm focus:border-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-500/20"
              />
            </div>
            <div>
              <label className="block text-xs font-medium text-gray-700 mb-1">
                Área máxima (m²)
              </label>
              <input
                type="number"
                value={maxArea}
                onChange={(e) => setMaxArea(e.target.value)}
                placeholder="200"
                className="w-full rounded-lg border border-gray-300 bg-white py-2 px-3 text-sm focus:border-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-500/20"
              />
            </div>
          </div>

          {/* Checkboxes */}
          <div className="flex flex-wrap gap-4">
            <label className="flex items-center gap-2 text-sm text-gray-700 cursor-pointer">
              <input
                type="checkbox"
                checked={furnished === true}
                onChange={(e) => setFurnished(e.target.checked ? true : undefined)}
                className="rounded border-gray-300 text-blue-600 focus:ring-blue-500"
              />
              Amoblado
            </label>
            
            <label className="flex items-center gap-2 text-sm text-gray-700 cursor-pointer">
              <input
                type="checkbox"
                checked={verified === true}
                onChange={(e) => setVerified(e.target.checked ? true : undefined)}
                className="rounded border-gray-300 text-blue-600 focus:ring-blue-500"
              />
              Solo verificados
            </label>

            <label className="flex items-center gap-2 text-sm text-gray-700 cursor-pointer">
              <input
                type="checkbox"
                checked={petFriendly === true}
                onChange={(e) => setPetFriendly(e.target.checked ? true : undefined)}
                className="rounded border-gray-300 text-blue-600 focus:ring-blue-500"
              />
              🐕 Pet Friendly
            </label>
          </div>
        </div>
      </div>
    </form>
  )
}

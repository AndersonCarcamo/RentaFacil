import { useState } from 'react'
import Button from '../ui/Button'
import { 
  MagnifyingGlassIcon, 
  MapPinIcon,
  BuildingOffice2Icon,
  HomeIcon,
  ChevronLeftIcon,
  ChevronRightIcon,
  XMarkIcon,
  AdjustmentsHorizontalIcon
} from '@heroicons/react/24/outline'

type Mode = 'alquiler' | 'comprar' | 'vender' | 'proyecto'

interface SearchSidebarProps {
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
    airbnbEligible?: boolean
    amenities?: string[]
  }) => void
  isLoading?: boolean
  isCollapsed: boolean
  onToggleCollapse: () => void
}

const formatPrice = (num: number): string => {
  return num.toString().replace(/\B(?=(\d{3})+(?!\d))/g, ',')
}

export default function SearchSidebar({ 
  onSearch, 
  isLoading = false,
  isCollapsed,
  onToggleCollapse
}: SearchSidebarProps) {
  const [mode, setMode] = useState<Mode>('alquiler')
  const [location, setLocation] = useState('')
  const [propertyType, setPropertyType] = useState('')
  const [minPrice, setMinPrice] = useState('')
  const [maxPrice, setMaxPrice] = useState('')
  const [showAdvanced, setShowAdvanced] = useState(false)
  
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
  const [airbnbEligible, setAirbnbEligible] = useState<boolean | undefined>(undefined)
  const [amenities, setAmenities] = useState<string[]>([])

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
      ageYears: ageYears || undefined,
      airbnbEligible: airbnbEligible,
      amenities: amenities.length > 0 ? amenities : undefined
    })
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
    setAirbnbEligible(undefined)
    setAmenities([])
  }

  // Vista Colapsada (Solo iconos)
  if (isCollapsed) {
    return (
      <div className="w-16 bg-white border-r border-gray-200 flex flex-col items-center py-4 space-y-4">
        <button
          onClick={onToggleCollapse}
          className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
          title="Expandir filtros"
        >
          <ChevronRightIcon className="w-6 h-6 text-gray-600" />
        </button>
        
        <div className="h-px w-8 bg-gray-200" />
        
        <div className="space-y-3 flex flex-col items-center">
          <MapPinIcon className="w-6 h-6 text-gray-400" title="Ubicación" />
          <BuildingOffice2Icon className="w-6 h-6 text-gray-400" title="Tipo" />
          <span className="text-xl" title="Precio">💰</span>
          <span className="text-xl" title="Habitaciones">🛏️</span>
          <AdjustmentsHorizontalIcon className="w-6 h-6 text-gray-400" title="Más filtros" />
        </div>
      </div>
    )
  }

  // Vista Expandida
  return (
    <div className="w-80 bg-white border-r border-gray-200 flex flex-col h-full">
      {/* Header */}
      <div className="p-4 border-b border-gray-200 flex items-center justify-between">
        <h2 className="text-lg font-bold text-gray-900">Filtros</h2>
        <button
          onClick={onToggleCollapse}
          className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
          title="Colapsar filtros"
        >
          <ChevronLeftIcon className="w-5 h-5 text-gray-600" />
        </button>
      </div>

      {/* Form */}
      <form onSubmit={submit} className="flex-1 overflow-y-auto p-4 space-y-4">
        {/* Modo de Operación */}
        <div>
          <label className="block text-xs font-medium text-gray-700 mb-2">
            Operación
          </label>
          <div className="flex gap-2">
            <button
              type="button"
              onClick={() => setMode('alquiler')}
              className={`flex-1 px-3 py-2 text-xs font-semibold rounded-lg transition ${
                mode === 'alquiler'
                  ? 'bg-blue-600 text-white'
                  : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
              }`}
            >
              Alquiler
            </button>
            <button
              type="button"
              onClick={() => setMode('comprar')}
              className={`flex-1 px-3 py-2 text-xs font-semibold rounded-lg transition ${
                mode === 'comprar'
                  ? 'bg-blue-600 text-white'
                  : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
              }`}
            >
              Comprar
            </button>
          </div>
        </div>

        {/* Ubicación */}
        <div>
          <label className="block text-xs font-medium text-gray-700 mb-2">
            📍 Ubicación
          </label>
          <div className="relative">
            <MapPinIcon className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
            <input
              value={location}
              onChange={(e) => setLocation(e.target.value)}
              placeholder="Distrito, ciudad..."
              className="w-full pl-9 pr-3 py-2 text-sm border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
            />
          </div>
        </div>

        {/* Tipo de Propiedad */}
        <div>
          <label className="block text-xs font-medium text-gray-700 mb-2">
            🏠 Tipo de Propiedad
          </label>
          <select
            value={propertyType}
            onChange={(e) => setPropertyType(e.target.value)}
            className="w-full px-3 py-2 text-sm border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
          >
            <option value="">Todos los tipos</option>
            <option value="apartment">Departamento</option>
            <option value="house">Casa</option>
            <option value="room">Habitación</option>
            <option value="studio">Estudio</option>
            <option value="office">Oficina</option>
            <option value="commercial">Local Comercial</option>
            <option value="land">Terreno</option>
          </select>
        </div>

        {/* Modo de Alquiler - Solo visible en modo alquiler */}
        {mode === 'alquiler' && (
          <div>
            <label className="block text-xs font-medium text-gray-700 mb-2">
              🏡 Modo de Alquiler
            </label>
            <select
              value={rentalMode}
              onChange={(e) => setRentalMode(e.target.value)}
              className="w-full px-3 py-2 text-sm border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
            >
              <option value="">Todos los modos</option>
              <option value="traditional">Tradicional (Contrato largo)</option>
              <option value="shared">Compartido</option>
              <option value="private">Habitación privada</option>
              <option value="coliving">Coliving</option>
            </select>
          </div>
        )}

        {/* Precio */}
        <div>
          <label className="block text-xs font-medium text-gray-700 mb-2">
            💰 Precio (S/)
          </label>
          <div className="space-y-2">
            <input
              type="number"
              value={minPrice}
              onChange={(e) => setMinPrice(e.target.value)}
              placeholder="Mínimo"
              className="w-full px-3 py-2 text-sm border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
            />
            <input
              type="number"
              value={maxPrice}
              onChange={(e) => setMaxPrice(e.target.value)}
              placeholder="Máximo"
              className="w-full px-3 py-2 text-sm border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
            />
          </div>
        </div>

        {/* Habitaciones y Baños */}
        <div className="grid grid-cols-2 gap-3">
          <div>
            <label className="block text-xs font-medium text-gray-700 mb-2">
              🛏️ Habitaciones
            </label>
            <select
              value={bedrooms}
              onChange={(e) => setBedrooms(e.target.value)}
              className="w-full px-3 py-2 text-sm border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
            >
              <option value="">Todas</option>
              <option value="1">1+</option>
              <option value="2">2+</option>
              <option value="3">3+</option>
              <option value="4">4+</option>
              <option value="5">5+</option>
            </select>
          </div>
          <div>
            <label className="block text-xs font-medium text-gray-700 mb-2">
              🚿 Baños
            </label>
            <select
              value={bathrooms}
              onChange={(e) => setBathrooms(e.target.value)}
              className="w-full px-3 py-2 text-sm border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
            >
              <option value="">Todos</option>
              <option value="1">1+</option>
              <option value="2">2+</option>
              <option value="3">3+</option>
              <option value="4">4+</option>
            </select>
          </div>
        </div>

        {/* Botón Filtros Avanzados */}
        <button
          type="button"
          onClick={() => setShowAdvanced(!showAdvanced)}
          className="w-full flex items-center justify-between px-3 py-2 text-sm font-medium text-gray-700 bg-gray-50 hover:bg-gray-100 rounded-lg transition"
        >
          <span>Más filtros</span>
          <ChevronRightIcon className={`w-4 h-4 transition-transform ${showAdvanced ? 'rotate-90' : ''}`} />
        </button>

        {/* Filtros Avanzados */}
        {showAdvanced && (
          <div className="space-y-4 pt-2 border-t border-gray-200">
            {/* Área */}
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="block text-xs font-medium text-gray-700 mb-2">
                  Área mín. (m²)
                </label>
                <input
                  type="number"
                  value={minArea}
                  onChange={(e) => setMinArea(e.target.value)}
                  placeholder="50"
                  className="w-full px-3 py-2 text-sm border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                />
              </div>
              <div>
                <label className="block text-xs font-medium text-gray-700 mb-2">
                  Área máx. (m²)
                </label>
                <input
                  type="number"
                  value={maxArea}
                  onChange={(e) => setMaxArea(e.target.value)}
                  placeholder="200"
                  className="w-full px-3 py-2 text-sm border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                />
              </div>
            </div>

            {/* Años de Antigüedad */}
            <div>
              <label className="block text-xs font-medium text-gray-700 mb-2">
                Antigüedad de la Propiedad
              </label>
              <select
                value={ageYears}
                onChange={(e) => setAgeYears(e.target.value)}
                className="w-full px-3 py-2 text-sm border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
              >
                <option value="">Cualquier antigüedad</option>
                <option value="new">🆕 A estrenar (0 años)</option>
                <option value="0-5">0-5 años</option>
                <option value="5-10">5-10 años</option>
                <option value="10-20">10-20 años</option>
                <option value="20+">20+ años</option>
              </select>
            </div>

            {/* Amenidades */}
            <div>
              <label className="block text-xs font-medium text-gray-700 mb-2">
                Amenidades
              </label>
              <div className="grid grid-cols-2 gap-2">
                {[
                  { value: 'piscina', label: '🏊 Piscina' },
                  { value: 'gimnasio', label: '💪 Gimnasio' },
                  { value: 'ascensor', label: '🛗 Ascensor' },
                  { value: 'balcon', label: '🪟 Balcón' },
                  { value: 'terraza', label: '🌅 Terraza' },
                  { value: 'jardin', label: '🌳 Jardín' },
                  { value: 'garaje', label: '🚗 Garaje' },
                  { value: 'seguridad', label: '🔒 Seguridad 24h' },
                  { value: 'aire_acondicionado', label: '❄️ A/C' },
                  { value: 'calefaccion', label: '🔥 Calefacción' },
                  { value: 'lavanderia', label: '🧺 Lavandería' },
                  { value: 'wifi', label: '📶 WiFi' }
                ].map(amenity => (
                  <label key={amenity.value} className="flex items-center gap-1 text-xs text-gray-700 cursor-pointer">
                    <input
                      type="checkbox"
                      checked={amenities.includes(amenity.value)}
                      onChange={(e) => {
                        if (e.target.checked) {
                          setAmenities([...amenities, amenity.value])
                        } else {
                          setAmenities(amenities.filter(a => a !== amenity.value))
                        }
                      }}
                      className="rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                    />
                    {amenity.label}
                  </label>
                ))}
              </div>
            </div>

            {/* Tipo de Alquiler Airbnb - Destacado */}
            <div className="bg-blue-50 border border-blue-200 rounded-lg p-3">
              <label className="flex items-center gap-2 cursor-pointer">
                <input
                  type="checkbox"
                  checked={airbnbEligible === true}
                  onChange={(e) => setAirbnbEligible(e.target.checked ? true : undefined)}
                  className="rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                />
                <span className="text-sm font-medium text-blue-900">
                  🏖️ Tipo Airbnb (Corta estadía)
                </span>
              </label>
              <p className="text-xs text-blue-700 mt-1 ml-6">Propiedades disponibles para reserva inmediata</p>
            </div>

            {/* Checkboxes - Características */}
            <div className="space-y-2">
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
        )}

        {/* Botones de Acción */}
        <div className="space-y-2 pt-4 border-t border-gray-200">
          <Button 
            type="submit" 
            variant="primary" 
            className="w-full"
            loading={isLoading}
          >
            <MagnifyingGlassIcon className="w-4 h-4 mr-2" />
            Buscar Propiedades
          </Button>
          
          <button
            type="button"
            onClick={clearAllFilters}
            className="w-full px-4 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-lg hover:bg-gray-50 transition"
          >
            Limpiar Filtros
          </button>
        </div>
      </form>
    </div>
  )
}

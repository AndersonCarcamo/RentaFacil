import { useState, Fragment } from 'react'
import { Dialog, Transition } from '@headlessui/react'
import Button from './ui/Button'
import SearchAutocomplete from './SearchAutocomplete'
import { 
  MagnifyingGlassIcon, 
  MapPinIcon, 
  XMarkIcon,
  BuildingOffice2Icon, 
  CurrencyDollarIcon, 
  AdjustmentsHorizontalIcon, 
  HomeModernIcon,
  ChevronRightIcon,
  HomeIcon
} from '@heroicons/react/24/outline'

type Mode = 'alquiler' | 'comprar' | 'proyecto' | 'tipo_Airbnb'

interface MobileSearchFormProps {
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
    radius?: number
  }) => void
  className?: string
  isLoading?: boolean
  placeholder?: string
}

type FilterStep = 'propertyType' | 'price' | 'rooms' | 'area' | 'amenities'

export default function MobileSearchForm({ 
  onSearch, 
  className = '', 
  isLoading = false, 
  placeholder 
}: MobileSearchFormProps) {
  const [mode, setMode] = useState<Mode>('alquiler')
  const [location, setLocation] = useState('')
  const [isFilterOpen, setIsFilterOpen] = useState(false)
  const [currentStep, setCurrentStep] = useState<FilterStep>('propertyType')
  
  // Filtros
  const [propertyType, setPropertyType] = useState('')
  const [minPrice, setMinPrice] = useState('')
  const [maxPrice, setMaxPrice] = useState('')
  const [bedrooms, setBedrooms] = useState('')
  const [bathrooms, setBathrooms] = useState('')
  const [minArea, setMinArea] = useState('')
  const [maxArea, setMaxArea] = useState('')
  const [furnished, setFurnished] = useState<boolean | undefined>(undefined)
  const [verified, setVerified] = useState<boolean | undefined>(undefined)
  const [petFriendly, setPetFriendly] = useState<boolean | undefined>(undefined)

  const handleSearch = () => {
    // Detectar si la ubicación son coordenadas (lat,lng)
    const isCoordinates = location.trim().match(/^-?\d+\.?\d*,-?\d+\.?\d*$/)
    
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
      petFriendly: petFriendly,
      radius: isCoordinates ? 10000 : undefined // 10km en metros si es geolocalización
    })
    setIsFilterOpen(false)
  }

  const handleSkipToSearch = () => {
    handleSearch()
  }

  const goToNextStep = () => {
    const steps: FilterStep[] = ['propertyType', 'price', 'rooms', 'area', 'amenities']
    const currentIndex = steps.indexOf(currentStep)
    if (currentIndex < steps.length - 1) {
      setCurrentStep(steps[currentIndex + 1])
    }
  }

  const Tab = ({ value, label, icon: Icon }: { value: Mode; label: string; icon: React.ComponentType<any> }) => (
    <button
      type="button"
      onClick={() => setMode(value)}
      className={`flex items-center gap-1 rounded-full px-3 py-1.5 text-xs font-semibold transition whitespace-nowrap ${
        mode === value
          ? 'bg-secondary-500 text-brand-navy shadow'
          : 'text-brand-navy/70 hover:bg-brand-navy/10'
      }`}
    >
      <Icon className="h-3.5 w-3.5" /> {label}
    </button>
  )

  const renderStepContent = () => {
    switch (currentStep) {
      case 'propertyType':
        return (
          <div className="space-y-4">
            <h3 className="text-lg font-semibold text-brand-navy">¿Qué tipo de propiedad buscas?</h3>
            <div className="grid grid-cols-2 gap-3">
              {[
                { value: 'apartment', label: 'Departamento', icon: BuildingOffice2Icon },
                { value: 'house', label: 'Casa', icon: HomeIcon },
                { value: 'TipoAirbnb', label: 'Airbnb', icon: HomeModernIcon },
                { value: 'room', label: 'Habitación', icon: BuildingOffice2Icon },
                { value: 'studio', label: 'Estudio', icon: HomeIcon },
                { value: 'office', label: 'Oficina', icon: BuildingOffice2Icon },
                { value: 'commercial', label: 'Comercial', icon: BuildingOffice2Icon },
              ].map(({ value, label, icon: Icon }) => (
                <button
                  key={value}
                  type="button"
                  onClick={() => setPropertyType(value)}
                  className={`flex flex-col items-center justify-center gap-2 p-4 rounded-xl border-2 transition ${
                    propertyType === value
                      ? 'border-secondary-500 bg-secondary-50 text-brand-navy'
                      : 'border-gray-200 hover:border-gray-300 text-gray-700'
                  }`}
                >
                  <Icon className="h-8 w-8" />
                  <span className="text-sm font-medium">{label}</span>
                </button>
              ))}
            </div>
          </div>
        )

      case 'price':
        return (
          <div className="space-y-4">
            <h3 className="text-lg font-semibold text-brand-navy">Rango de precio</h3>
            <div className="space-y-3">
              <div>
                <label className="block text-sm font-medium text-brand-navy mb-1">Precio mínimo</label>
                <div className="relative">
                  <span className="absolute left-3 top-1/2 -translate-y-1/2 text-brand-navy/60">S/</span>
                  <input
                    type="number"
                    value={minPrice}
                    onChange={(e) => setMinPrice(e.target.value)}
                    placeholder="0"
                    className="w-full rounded-lg border border-brand-navy/20 bg-white py-3 pl-10 pr-3 text-brand-navy focus:border-brand-navy/40 focus:outline-none focus:ring-2 focus:ring-secondary-500/60"
                  />
                </div>
              </div>
              <div>
                <label className="block text-sm font-medium text-brand-navy mb-1">Precio máximo</label>
                <div className="relative">
                  <span className="absolute left-3 top-1/2 -translate-y-1/2 text-brand-navy/60">S/</span>
                  <input
                    type="number"
                    value={maxPrice}
                    onChange={(e) => setMaxPrice(e.target.value)}
                    placeholder="5000"
                    className="w-full rounded-lg border border-brand-navy/20 bg-white py-3 pl-10 pr-3 text-brand-navy focus:border-brand-navy/40 focus:outline-none focus:ring-2 focus:ring-secondary-500/60"
                  />
                </div>
              </div>
            </div>
          </div>
        )

      case 'rooms':
        return (
          <div className="space-y-4">
            <h3 className="text-lg font-semibold text-brand-navy">Habitaciones y baños</h3>
            <div className="space-y-3">
              <div>
                <label className="block text-sm font-medium text-brand-navy mb-2">Habitaciones</label>
                <div className="grid grid-cols-4 gap-2">
                  {['1', '2', '3', '4+'].map((num) => (
                    <button
                      key={num}
                      type="button"
                      onClick={() => setBedrooms(num.replace('+', ''))}
                      className={`py-3 rounded-lg border-2 font-medium transition ${
                        bedrooms === num.replace('+', '')
                          ? 'border-secondary-500 bg-secondary-50 text-brand-navy'
                          : 'border-gray-200 hover:border-gray-300 text-gray-700'
                      }`}
                    >
                      {num}
                    </button>
                  ))}
                </div>
              </div>
              <div>
                <label className="block text-sm font-medium text-brand-navy mb-2">Baños</label>
                <div className="grid grid-cols-4 gap-2">
                  {['1', '2', '3', '4+'].map((num) => (
                    <button
                      key={num}
                      type="button"
                      onClick={() => setBathrooms(num.replace('+', ''))}
                      className={`py-3 rounded-lg border-2 font-medium transition ${
                        bathrooms === num.replace('+', '')
                          ? 'border-secondary-500 bg-secondary-50 text-brand-navy'
                          : 'border-gray-200 hover:border-gray-300 text-gray-700'
                      }`}
                    >
                      {num}
                    </button>
                  ))}
                </div>
              </div>
            </div>
          </div>
        )

      case 'area':
        return (
          <div className="space-y-4">
            <h3 className="text-lg font-semibold text-brand-navy">Área (m²)</h3>
            <div className="space-y-3">
              <div>
                <label className="block text-sm font-medium text-brand-navy mb-1">Área mínima</label>
                <input
                  type="number"
                  value={minArea}
                  onChange={(e) => setMinArea(e.target.value)}
                  placeholder="0"
                  className="w-full rounded-lg border border-brand-navy/20 bg-white py-3 px-3 text-brand-navy focus:border-brand-navy/40 focus:outline-none focus:ring-2 focus:ring-secondary-500/60"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-brand-navy mb-1">Área máxima</label>
                <input
                  type="number"
                  value={maxArea}
                  onChange={(e) => setMaxArea(e.target.value)}
                  placeholder="500"
                  className="w-full rounded-lg border border-brand-navy/20 bg-white py-3 px-3 text-brand-navy focus:border-brand-navy/40 focus:outline-none focus:ring-2 focus:ring-secondary-500/60"
                />
              </div>
            </div>
          </div>
        )

      case 'amenities':
        return (
          <div className="space-y-4">
            <h3 className="text-lg font-semibold text-brand-navy">Comodidades</h3>
            <div className="space-y-3">
              <label className="flex items-center justify-between p-4 rounded-lg border border-gray-200 cursor-pointer hover:bg-gray-50">
                <span className="text-sm font-medium text-brand-navy">Amoblado</span>
                <input
                  type="checkbox"
                  checked={furnished === true}
                  onChange={(e) => setFurnished(e.target.checked ? true : undefined)}
                  className="h-5 w-5 rounded border-brand-navy/20 text-secondary-500 focus:ring-secondary-500/60"
                />
              </label>
              <label className="flex items-center justify-between p-4 rounded-lg border border-gray-200 cursor-pointer hover:bg-gray-50">
                <span className="text-sm font-medium text-brand-navy">Solo verificados</span>
                <input
                  type="checkbox"
                  checked={verified === true}
                  onChange={(e) => setVerified(e.target.checked ? true : undefined)}
                  className="h-5 w-5 rounded border-brand-navy/20 text-secondary-500 focus:ring-secondary-500/60"
                />
              </label>
              <label className="flex items-center justify-between p-4 rounded-lg border border-gray-200 cursor-pointer hover:bg-gray-50">
                <span className="text-sm font-medium text-brand-navy">🐕 Pet Friendly</span>
                <input
                  type="checkbox"
                  checked={petFriendly === true}
                  onChange={(e) => setPetFriendly(e.target.checked ? true : undefined)}
                  className="h-5 w-5 rounded border-brand-navy/20 text-secondary-500 focus:ring-secondary-500/60"
                />
              </label>
            </div>
          </div>
        )
    }
  }

  const steps: FilterStep[] = ['propertyType', 'price', 'rooms', 'area', 'amenities']
  const currentStepIndex = steps.indexOf(currentStep)
  const isLastStep = currentStepIndex === steps.length - 1

  return (
    <>
      {/* Formulario compacto para móvil */}
      <div className={`w-full rounded-2xl bg-white/80 p-3 backdrop-blur shadow-soft ring-1 ring-black/5 space-y-3 ${className}`}>
        {/* Tabs - Scroll horizontal */}
        <div className="flex items-center gap-2 overflow-x-auto pb-1 scrollbar-hide">
          <Tab value="alquiler" label="Alquiler" icon={BuildingOffice2Icon} />
          <Tab value="comprar" label="Comprar" icon={CurrencyDollarIcon} />
          <Tab value="proyecto" label="Proyecto" icon={AdjustmentsHorizontalIcon} />
          <Tab value="tipo_Airbnb" label="Tipo Airbnb" icon={HomeModernIcon} />
        </div>

        {/* Barra de búsqueda con icono de geolocalización y búsqueda */}
        <div className="flex items-center gap-2">
          <div className="relative flex-1">
            <MapPinIcon className="pointer-events-none absolute left-3 top-1/2 h-5 w-5 -translate-y-1/2 text-brand-navy/50 z-10" />
            <SearchAutocomplete
              value={location}
              onChange={setLocation}
              placeholder={placeholder || "¿Dónde quieres buscar?"}
            />
          </div>
          <button
            type="button"
            onClick={() => {
              if (navigator.geolocation) {
                navigator.geolocation.getCurrentPosition(
                  (position) => {
                    const { latitude, longitude } = position.coords
                    setIsFilterOpen(true)
                    setCurrentStep('propertyType')
                    setLocation(`${latitude},${longitude}`)
                  },
                  (error) => {
                    console.error('Error obteniendo ubicación:', error)
                    alert('No se pudo obtener tu ubicación. Por favor, verifica los permisos del navegador.')
                  }
                )
              } else {
                alert('Tu navegador no soporta geolocalización')
              }
            }}
            disabled={isLoading}
            className="flex items-center justify-center h-10 w-10 rounded-lg bg-secondary-500 text-brand-navy shadow-sm hover:bg-secondary-600 transition disabled:opacity-50"
            title="Usar mi ubicación"
          >
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" />
            </svg>
          </button>
          <button
            type="button"
            onClick={() => {
              setIsFilterOpen(true)
              setCurrentStep('propertyType')
            }}
            disabled={isLoading}
            className="flex items-center justify-center h-10 w-10 rounded-lg bg-brand-navy text-white shadow-sm hover:bg-brand-navy/90 transition disabled:opacity-50"
          >
            <MagnifyingGlassIcon className="h-5 w-5" />
          </button>
        </div>
      </div>

      {/* Modal de filtros tipo wizard */}
      <Transition show={isFilterOpen} as={Fragment}>
        <Dialog onClose={() => setIsFilterOpen(false)} className="relative z-50">
          {/* Overlay */}
          <Transition.Child
            as={Fragment}
            enter="ease-out duration-300"
            enterFrom="opacity-0"
            enterTo="opacity-100"
            leave="ease-in duration-200"
            leaveFrom="opacity-100"
            leaveTo="opacity-0"
          >
            <div className="fixed inset-0 bg-black/30" aria-hidden="true" />
          </Transition.Child>

          {/* Panel deslizante desde abajo */}
          <Transition.Child
            as={Fragment}
            enter="ease-out duration-300"
            enterFrom="translate-y-full"
            enterTo="translate-y-0"
            leave="ease-in duration-200"
            leaveFrom="translate-y-0"
            leaveTo="translate-y-full"
          >
            <Dialog.Panel className="fixed inset-x-0 bottom-0 flex flex-col bg-white rounded-t-3xl shadow-2xl" style={{ height: '75vh' }}>
              {/* Header del modal */}
              <div className="flex items-center justify-between px-4 py-4 border-b border-gray-200">
                <div className="flex items-center gap-2">
                  <button
                    type="button"
                    onClick={() => setIsFilterOpen(false)}
                    className="p-1 rounded-lg hover:bg-gray-100 transition"
                  >
                    <XMarkIcon className="h-6 w-6 text-gray-600" />
                  </button>
                  <Dialog.Title className="text-lg font-semibold text-brand-navy">
                    Filtros de búsqueda
                  </Dialog.Title>
                </div>
                <button
                  type="button"
                  onClick={handleSkipToSearch}
                  className="text-sm font-semibold text-secondary-600 hover:text-secondary-700"
                >
                  Omitir y buscar
                </button>
              </div>

              {/* Progress indicator */}
              <div className="flex items-center gap-1 px-4 py-3">
                {steps.map((step, index) => (
                  <div
                    key={step}
                    className={`h-1 flex-1 rounded-full transition-colors ${
                      index <= currentStepIndex ? 'bg-secondary-500' : 'bg-gray-200'
                    }`}
                  />
                ))}
              </div>

              {/* Contenido del paso actual */}
              <div className="flex-1 overflow-y-auto px-4 py-6">
                {renderStepContent()}
              </div>

              {/* Footer con acciones */}
              <div className="px-4 py-4 border-t border-gray-200 space-y-2">
                {isLastStep ? (
                  <Button
                    type="button"
                    variant="primary"
                    size="lg"
                    onClick={handleSearch}
                    loading={isLoading}
                    className="w-full"
                    rightIcon={<MagnifyingGlassIcon className="h-5 w-5" />}
                  >
                    Buscar propiedades
                  </Button>
                ) : (
                  <>
                    <Button
                      type="button"
                      variant="primary"
                      size="lg"
                      onClick={goToNextStep}
                      className="w-full"
                      rightIcon={<ChevronRightIcon className="h-5 w-5" />}
                    >
                      Siguiente
                    </Button>
                    <button
                      type="button"
                      onClick={handleSkipToSearch}
                      className="w-full py-2 text-sm font-medium text-gray-600 hover:text-brand-navy transition"
                    >
                      Omitir y buscar ahora
                    </button>
                  </>
                )}
              </div>
            </Dialog.Panel>
          </Transition.Child>
        </Dialog>
      </Transition>
    </>
  )
}

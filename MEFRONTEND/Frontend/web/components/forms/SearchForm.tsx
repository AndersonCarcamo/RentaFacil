import { useState, useEffect, useRef } from 'react'
import Button from '../ui/Button'
import MobileFiltersModal, { FilterValues } from '../search/MobileFiltersModal'
import { 
	MagnifyingGlassIcon, 
	MapPinIcon, 
	CurrencyDollarIcon, 
	AdjustmentsHorizontalIcon, 
	BuildingOffice2Icon, 
	HomeIcon, 
	KeyIcon, 
	TagIcon,
	CalendarDaysIcon,
	ClockIcon
} from '@heroicons/react/24/outline'
import { MapPinIcon as MapPinIconSolid } from '@heroicons/react/24/solid'

type Mode = 'alquiler' | 'comprar' | 'vender' | 'proyecto' | 'tipo_Airbnb'

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
  }) => void
  onLocationSearch?: (params: {
    latitude: number
    longitude: number
    radius?: number
    mode: Mode
    propertyType?: string
  }) => void
  className?: string
  isLoading?: boolean
  placeholder?: string
}export default function SearchForm({ onSearch, onLocationSearch, className = '', isLoading = false, placeholder }: SearchFormProps) {
	const [mode, setMode] = useState<Mode>('alquiler')
	const [location, setLocation] = useState('')
	const [minPrice, setMinPrice] = useState('')
	const [maxPrice, setMaxPrice] = useState('')
	const [advanced, setAdvanced] = useState(false)
	const [isGettingLocation, setIsGettingLocation] = useState(false)
	
	// Sugerencias de búsqueda
	const [showSuggestions, setShowSuggestions] = useState(false)
	const [recentSearches, setRecentSearches] = useState<string[]>([])
	const [filteredSuggestions, setFilteredSuggestions] = useState<string[]>([])
	const searchInputRef = useRef<HTMLInputElement>(null)
	const suggestionsRef = useRef<HTMLDivElement>(null)
	
	// Modal de filtros móvil
	const [showMobileFilters, setShowMobileFilters] = useState(false)
	
	// Filtros avanzados
	const [propertyType, setPropertyType] = useState('')
	const [bedrooms, setBedrooms] = useState('')
	const [bathrooms, setBathrooms] = useState('')
	const [minArea, setMinArea] = useState('')
	const [maxArea, setMaxArea] = useState('')
	const [furnished, setFurnished] = useState<boolean | undefined>(undefined)
	const [verified, setVerified] = useState<boolean | undefined>(undefined)
	const [rentalMode, setRentalMode] = useState('')
	const [petFriendly, setPetFriendly] = useState<boolean | undefined>(undefined)

	// Base de datos de ubicaciones para autocompletar
	const allLocations = [
		// Lima Centro
		'Lima Centro', 'Cercado de Lima', 'Breña', 'La Victoria', 'Rímac',
		// Lima Moderna
		'Miraflores', 'San Isidro', 'Barranco', 'Surco', 'Santiago de Surco',
		'La Molina', 'San Borja', 'Jesús María', 'Lince', 'Magdalena del Mar',
		'Pueblo Libre', 'San Miguel',
		// Lima Norte
		'Los Olivos', 'Independencia', 'San Martín de Porres', 'Comas',
		'Puente Piedra', 'Carabayllo', 'Santa Rosa', 'Ancón',
		// Lima Este
		'Ate', 'Santa Anita', 'El Agustino', 'San Luis', 'Chaclacayo',
		'Lurigancho', 'San Juan de Lurigancho',
		// Lima Sur
		'Chorrillos', 'Villa El Salvador', 'Villa María del Triunfo',
		'San Juan de Miraflores', 'Lurín', 'Pachacámac', 'Punta Hermosa',
		'Punta Negra', 'San Bartolo', 'Santa María del Mar',
		// Callao
		'Callao', 'Bellavista', 'Carmen de la Legua', 'La Perla', 'La Punta',
		'Ventanilla',
		// Zonas específicas populares
		'Miraflores - Malecón', 'San Isidro - Golf', 'Barranco - Boulevard',
		'Surco - Higuereta', 'La Molina - Rinconada', 'San Borja - Centro Empresarial'
	]

	// Cargar búsquedas recientes del localStorage
	useEffect(() => {
		if (typeof window !== 'undefined') {
			const saved = localStorage.getItem('recentSearches')
			if (saved) {
				try {
					setRecentSearches(JSON.parse(saved))
				} catch (err) {
					console.error('Error parsing recent searches:', err)
				}
			}
		}
	}, [])

	// Filtrar sugerencias basadas en lo que escribe el usuario
	useEffect(() => {
		if (location.trim().length < 2) {
			setFilteredSuggestions([])
			return
		}

		const searchTerm = location.toLowerCase()
		const filtered = allLocations.filter(loc => 
			loc.toLowerCase().includes(searchTerm)
		)
		
		// Limitar a 8 sugerencias y ordenar por relevancia
		const sorted = filtered.sort((a, b) => {
			const aLower = a.toLowerCase()
			const bLower = b.toLowerCase()
			
			// Priorizar coincidencias al inicio
			if (aLower.startsWith(searchTerm) && !bLower.startsWith(searchTerm)) return -1
			if (!aLower.startsWith(searchTerm) && bLower.startsWith(searchTerm)) return 1
			
			// Luego por longitud (más corto = más relevante)
			return a.length - b.length
		})
		
		setFilteredSuggestions(sorted.slice(0, 8))
	}, [location])

	// Cerrar sugerencias al hacer click fuera
	useEffect(() => {
		const handleClickOutside = (event: MouseEvent) => {
			if (
				suggestionsRef.current && 
				!suggestionsRef.current.contains(event.target as Node) &&
				searchInputRef.current &&
				!searchInputRef.current.contains(event.target as Node)
			) {
				setShowSuggestions(false)
			}
		}

		document.addEventListener('mousedown', handleClickOutside)
		return () => document.removeEventListener('mousedown', handleClickOutside)
	}, [])

	// Guardar búsqueda reciente
	const saveRecentSearch = (searchLocation: string) => {
		if (!searchLocation.trim()) return
		
		const trimmed = searchLocation.trim()
		const updated = [trimmed, ...recentSearches.filter(s => s !== trimmed)].slice(0, 5)
		
		setRecentSearches(updated)
		if (typeof window !== 'undefined') {
			localStorage.setItem('recentSearches', JSON.stringify(updated))
		}
	}

	// Limpiar búsquedas recientes
	const clearRecentSearches = () => {
		setRecentSearches([])
		if (typeof window !== 'undefined') {
			localStorage.removeItem('recentSearches')
		}
	}

	// Seleccionar sugerencia
	const selectSuggestion = (suggestion: string) => {
		setLocation(suggestion)
		setShowSuggestions(false)
		searchInputRef.current?.focus()
	}

	// Manejar aplicación de filtros móviles
	const handleMobileFiltersApply = (filters: FilterValues) => {
		setMinPrice(filters.minPrice || '')
		setMaxPrice(filters.maxPrice || '')
		setBedrooms(filters.bedrooms || '')
		setBathrooms(filters.bathrooms || '')
		setMinArea(filters.minArea || '')
		setMaxArea(filters.maxArea || '')
		setFurnished(filters.furnished)
		setVerified(filters.verified)
		setRentalMode(filters.rentalMode || '')
		setPetFriendly(filters.petFriendly)
		
		// Re-ejecutar búsqueda con los nuevos filtros
		onSearch?.({
			mode,
			location: location.trim(),
			minPrice: filters.minPrice ? Number(filters.minPrice) : undefined,
			maxPrice: filters.maxPrice ? Number(filters.maxPrice) : undefined,
			propertyType: propertyType || undefined,
			bedrooms: filters.bedrooms ? Number(filters.bedrooms) : undefined,
			bathrooms: filters.bathrooms ? Number(filters.bathrooms) : undefined,
			minArea: filters.minArea ? Number(filters.minArea) : undefined,
			maxArea: filters.maxArea ? Number(filters.maxArea) : undefined,
			furnished: filters.furnished,
			verified: filters.verified,
			rentalMode: filters.rentalMode || undefined,
			petFriendly: filters.petFriendly
		})
	}

	// Función para obtener ubicación del usuario
	const getMyLocation = async () => {
		if (!navigator.geolocation) {
			alert('❌ Tu navegador no soporta geolocalización')
			return
		}

		// Verificar si estamos en un contexto seguro
		const isSecureContext = window.isSecureContext || window.location.protocol === 'https:' || window.location.hostname === 'localhost'
		
		if (!isSecureContext && window.location.protocol === 'http:') {
			const message = `⚠️ Geolocalización bloqueada por seguridad\n\n` +
				`Para usar esta función en desarrollo:\n\n` +
				`1. En Chrome, ve a: chrome://flags/#unsafely-treat-insecure-origin-as-secure\n` +
				`2. Agrega: http://localhost:3000\n` +
				`3. Reinicia Chrome\n\n` +
				`O mejor aún, usa HTTPS en producción.`
			
			alert(message)
			return
		}

		setIsGettingLocation(true)

		console.log('🔍 Intentando obtener ubicación...')

		// Verificar permisos antes de pedir ubicación
		if (navigator.permissions) {
			try {
				const permission = await navigator.permissions.query({ name: 'geolocation' })
				console.log('📍 Estado de permisos de ubicación:', permission.state)
				
				if (permission.state === 'denied') {
					setIsGettingLocation(false)
					const message = `🔒 Permisos bloqueados - Sigue estos pasos:\n\n` +
						`1. Haz click en el ICONO junto a la URL (🔒 o ℹ️)\n` +
						`2. Busca "Ubicación" o "Location"\n` +
						`3. Selecciona "Permitir" o "Allow"\n` +
						`4. IMPORTANTE: Recarga la página completamente (Ctrl+Shift+R o Cmd+Shift+R)\n` +
						`5. Intenta de nuevo\n\n` +
						`Si sigue sin funcionar, cierra y reabre el navegador.`
					
					alert(message)
					console.error('❌ Permisos de ubicación denegados')
					return
				}
			} catch (err) {
				console.log('⚠️ No se pudo verificar permisos:', err)
			}
		}

		navigator.geolocation.getCurrentPosition(
			async (position) => {
				console.log('✅ Ubicación obtenida:', position.coords)
				const { latitude, longitude, accuracy } = position.coords
				
				setIsGettingLocation(false)
				
				// Calcular radio de búsqueda basado en precisión
				// Si la precisión es baja, buscar en radio mayor
				let searchRadius = 5 // km por defecto
				if (accuracy > 1000) {
					searchRadius = 10 // 10km si precisión > 1km
				} else if (accuracy > 500) {
					searchRadius = 7 // 7km si precisión > 500m
				}
				
				console.log('🔍 Buscando propiedades en radio de', searchRadius, 'km')
				console.log('� Coordenadas:', { latitude, longitude })
				
				// Si existe onLocationSearch, ejecutar búsqueda por coordenadas
				if (onLocationSearch) {
					onLocationSearch({
						latitude,
						longitude,
						radius: searchRadius,
						mode,
						propertyType: propertyType || undefined
					})
				} else {
					// Fallback: Obtener dirección para mostrar
					try {
						const response = await fetch(
							`https://nominatim.openstreetmap.org/reverse?lat=${latitude}&lon=${longitude}&format=json&addressdetails=1`,
							{
								headers: {
									'Accept-Language': 'es',
									'User-Agent': 'RentaFacil/1.0'
								}
							}
						)
						
						if (response.ok) {
							const data = await response.json()
							console.log('📍 Dirección encontrada:', data)
							const address = data.address
							
							const locationParts = [
								address.suburb || address.neighbourhood || address.quarter,
								address.city_district || address.city || address.town,
								address.state || address.province
							].filter(Boolean)
							
							const locationString = locationParts.join(', ')
							const finalLocation = locationString || `${latitude.toFixed(4)}, ${longitude.toFixed(4)}`
							
							// Ejecutar búsqueda tradicional con la dirección
							onSearch?.({
								mode,
								location: finalLocation,
								propertyType: propertyType || undefined
							})
						}
					} catch (error) {
						console.error('❌ Error al obtener dirección:', error)
					}
				}
			},
			(error) => {
				console.error('❌ Error de geolocalización:', error)
				setIsGettingLocation(false)
				let message = ''
				
				switch (error.code) {
					case error.PERMISSION_DENIED:
						console.error('🔒 PERMISSION_DENIED - Usuario rechazó o permisos bloqueados')
						message = `🔒 Permisos bloqueados o rechazados\n\n` +
							`SOLUCIÓN (paso a paso):\n\n` +
							`1. Haz click en el ICONO junto a la URL:\n` +
							`   • Chrome: 🔒 o ℹ️ a la IZQUIERDA de la URL\n` +
							`   • Firefox: 🔒 a la izquierda\n\n` +
							`2. Busca "Ubicación" o "Location"\n\n` +
							`3. Cámbialo a "Permitir" o "Allow"\n\n` +
							`4. RECARGA COMPLETAMENTE:\n` +
							`   • Windows: Ctrl + Shift + R\n` +
							`   • Mac: Cmd + Shift + R\n\n` +
							`5. Si sigue fallando:\n` +
							`   • Cierra TODO el navegador\n` +
							`   • Abre de nuevo\n` +
							`   • Intenta otra vez\n\n` +
							`Estado actual en consola (F12) para debug.`
						break
					case error.POSITION_UNAVAILABLE:
						console.error('📍 POSITION_UNAVAILABLE - GPS no disponible')
						message = '❌ No se pudo determinar tu ubicación.\n\nVerifica que:\n• El GPS/Wi-Fi esté activado\n• Los servicios de ubicación del sistema estén habilitados'
						break
					case error.TIMEOUT:
						console.error('⏱️ TIMEOUT - Tardó demasiado')
						message = '⏱️ Tiempo de espera agotado.\n\nIntenta nuevamente en un lugar con mejor señal.'
						break
					default:
						console.error('❓ Error desconocido:', error.message)
						message = '❌ Error desconocido al obtener ubicación.\n\nRevisa la consola (F12) para más detalles.'
				}
				
				alert(message)
			},
			{
				enableHighAccuracy: true,
				timeout: 15000, // Aumentado a 15 segundos
				maximumAge: 0
			}
		)
	}

	const submit = (e: React.FormEvent) => {
		e.preventDefault()
		
		// Guardar búsqueda reciente antes de buscar
		if (location.trim()) {
			saveRecentSearch(location)
		}
		
		// Cerrar sugerencias
		setShowSuggestions(false)
		
		// En móvil: Solo abrir el wizard (NO ejecutar búsqueda aún)
		if (typeof window !== 'undefined' && window.innerWidth < 768) {
			setShowMobileFilters(true)
			return // No ejecutar búsqueda todavía
		}
		
		// En desktop: Ejecutar búsqueda inmediatamente
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
			petFriendly: petFriendly
		})
	}

	const Tab = ({ value, label, icon: Icon }: { value: Mode; label: string; icon: React.ComponentType<any> }) => (
		<button
			type="button"
			onClick={() => setMode(value)}
			className={`flex items-center gap-1 rounded-full px-4 py-2 text-xs font-semibold transition ${
				mode === value
					? 'bg-secondary-500 text-brand-navy shadow'
					: 'text-brand-navy/70 hover:bg-brand-navy/10'
			}`}
		>
			<Icon className="h-4 w-4" /> {label}
		</button>
	)

	return (
		<>
			{/* Modal de Filtros Móvil */}
			<MobileFiltersModal
				isOpen={showMobileFilters}
				onClose={() => setShowMobileFilters(false)}
				onApply={handleMobileFiltersApply}
				initialFilters={{
					minPrice,
					maxPrice,
					bedrooms,
					bathrooms,
					minArea,
					maxArea,
					furnished,
					verified,
					rentalMode,
					petFriendly
				}}
				propertyType={propertyType}
				autoStart={true}
			/>

			{/* Formulario de Búsqueda */}
			<form
				onSubmit={submit}
				className={`w-full rounded-2xl bg-white/80 p-4 backdrop-blur shadow-soft ring-1 ring-black/5 space-y-4 ${className}`}
			>
				{/* Tabs de Modo - Siempre visible */}
				<div className="flex flex-wrap items-center gap-2">
					<Tab value="alquiler" label="Alquiler" icon={BuildingOffice2Icon} />
					<Tab value="comprar" label="Comprar" icon={CurrencyDollarIcon} />
					<Tab value="vender" label="Vender" icon={TagIcon} />
					<Tab value="proyecto" label="Proyecto" icon={HomeIcon} />
					<Tab value="tipo_Airbnb" label="Tipo Airbnb" icon={CalendarDaysIcon} />
				</div>

				{/* Tipo de Propiedad - Siempre visible */}
				<div className="flex items-center gap-3">
					<span className="text-sm font-medium text-brand-navy whitespace-nowrap">Tipo de Propiedad</span>
					<select
						value={propertyType}
						onChange={(e) => setPropertyType(e.target.value)}
						className="flex-1 max-w-xs rounded-lg border border-brand-navy/20 bg-white/70 py-2 px-3 text-sm text-brand-navy focus:border-brand-navy/40 focus:outline-none focus:ring-2 focus:ring-secondary-500/60"
					>
						<option value="">Todos</option>
						<option value="apartment">Departamento</option>
						<option value="house">Casa</option>
						<option value="TipoAirbnb">Airbnb</option>
						<option value="room">Habitación</option>
						<option value="studio">Estudio</option>
						<option value="office">Oficina</option>
						<option value="commercial">Comercial</option>
					</select>
				</div>
				
			{/* Campo de Ubicación - Siempre visible */}
		<div className="grid grid-cols-1 gap-4 md:grid-cols-4">
			<div className="md:col-span-4">
				<label className="flex flex-col gap-1 text-xs font-medium text-brand-navy">
					Ubicación
					<div className="relative">
						<MapPinIcon className="pointer-events-none absolute left-3 top-1/2 h-5 w-5 -translate-y-1/2 text-brand-navy/50" />
						<input
							ref={searchInputRef}
							value={location}
							onChange={(e) => setLocation(e.target.value)}
							onFocus={() => setShowSuggestions(true)}
							placeholder={placeholder || "Distrito, ciudad o dirección"}
							className="w-full rounded-lg border border-brand-navy/20 bg-white/70 py-2 pl-10 pr-24 text-sm text-brand-navy placeholder:text-brand-navy/40 focus:border-brand-navy/40 focus:outline-none focus:ring-2 focus:ring-secondary-500/60"
						/>
						<div className="absolute right-1 top-1/2 -translate-y-1/2 flex items-center gap-1">
							<button
								type="button"
								onClick={getMyLocation}
								disabled={isGettingLocation}
								className="p-1.5 rounded-md hover:bg-brand-navy/10 text-brand-navy/70 hover:text-secondary-600 transition-colors disabled:opacity-50 disabled:cursor-not-allowed group"
								title="Buscar propiedades cercanas a mi ubicación"
								aria-label="Buscar propiedades cercanas a mi ubicación actual"
							>
								{isGettingLocation ? (
									<svg className="animate-spin h-5 w-5" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
										<circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
										<path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
									</svg>
								) : (
									<MapPinIconSolid className="h-5 w-5" />
								)}
								{/* Tooltip mejorado */}
								<span className="absolute bottom-full right-0 mb-2 hidden group-hover:block w-48 p-2 bg-brand-navy text-white text-xs rounded-lg shadow-lg z-10">
									🎯 Buscar propiedades cercanas a mi ubicación actual
									<span className="absolute top-full right-4 -mt-1 border-4 border-transparent border-t-brand-navy"></span>
								</span>
							</button>
							
							{/* Botón de búsqueda en móvil */}
							<button
								type="submit"
								disabled={isLoading}
								className="md:hidden bg-secondary-500 hover:bg-secondary-600 text-brand-navy rounded-md p-1.5 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
								aria-label="Buscar"
							>
								{isLoading ? (
									<svg className="animate-spin h-5 w-5" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
										<circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
										<path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
									</svg>
								) : (
									<MagnifyingGlassIcon className="h-5 w-5" />
								)}
							</button>
						</div>						{/* Dropdown de Sugerencias */}
						{showSuggestions && (recentSearches.length > 0 || filteredSuggestions.length > 0) && (
							<div
								ref={suggestionsRef}
								className="absolute z-50 w-full mt-1 bg-white rounded-lg shadow-lg border border-brand-navy/20 overflow-hidden animate-fade-in max-h-[40vh] md:max-h-[70vh] overflow-y-auto"
							>
									{/* Búsquedas Recientes */}
									{recentSearches.length > 0 && location.trim().length === 0 && (
										<div className="border-b border-brand-navy/10">
											<div className="flex items-center justify-between px-4 py-2 bg-brand-navy/5">
												<div className="flex items-center gap-2 text-xs font-semibold text-brand-navy/70">
													<ClockIcon className="h-4 w-4" />
													Búsquedas Recientes
												</div>
												<button
													type="button"
													onClick={clearRecentSearches}
													className="text-xs text-brand-navy/50 hover:text-red-500 transition-colors"
												>
													Limpiar
												</button>
											</div>
											<div className="py-1">
												{recentSearches.map((search, idx) => (
													<button
														key={idx}
														type="button"
														onClick={() => selectSuggestion(search)}
														className="w-full px-4 py-2.5 text-left text-sm text-brand-navy hover:bg-secondary-50 transition-colors flex items-center gap-3"
													>
														<ClockIcon className="h-4 w-4 text-brand-navy/40 flex-shrink-0" />
														<span className="truncate">{search}</span>
													</button>
												))}
											</div>
										</div>
									)}

									{/* Sugerencias Filtradas */}
									{filteredSuggestions.length > 0 && location.trim().length >= 2 && (
										<div>
											<div className="px-4 py-2 bg-brand-navy/5">
												<div className="flex items-center gap-2 text-xs font-semibold text-brand-navy/70">
													<MapPinIcon className="h-4 w-4" />
													Ubicaciones Sugeridas
												</div>
											</div>
											<div className="py-1 max-h-64 overflow-y-auto">
												{filteredSuggestions.map((suggestion, idx) => {
													// Resaltar el texto que coincide
													const searchTerm = location.toLowerCase()
													const lowerSuggestion = suggestion.toLowerCase()
													const matchIndex = lowerSuggestion.indexOf(searchTerm)
													
													let displayText = suggestion
													if (matchIndex !== -1) {
														const before = suggestion.slice(0, matchIndex)
														const match = suggestion.slice(matchIndex, matchIndex + location.length)
														const after = suggestion.slice(matchIndex + location.length)
														
														return (
															<button
																key={idx}
																type="button"
																onClick={() => selectSuggestion(suggestion)}
																className="w-full px-4 py-2.5 text-left text-sm text-brand-navy hover:bg-secondary-50 transition-colors flex items-center gap-3"
															>
																<MapPinIcon className="h-4 w-4 text-secondary-500 flex-shrink-0" />
																<span className="truncate">
																	{before}
																	<strong className="font-semibold text-secondary-600">{match}</strong>
																	{after}
																</span>
															</button>
														)
													}
													
													return (
														<button
															key={idx}
															type="button"
															onClick={() => selectSuggestion(suggestion)}
															className="w-full px-4 py-2.5 text-left text-sm text-brand-navy hover:bg-secondary-50 transition-colors flex items-center gap-3"
														>
															<MapPinIcon className="h-4 w-4 text-secondary-500 flex-shrink-0" />
															<span className="truncate">{displayText}</span>
														</button>
													)
												})}
											</div>
										</div>
									)}

									{/* Mensaje cuando no hay resultados */}
									{location.trim().length >= 2 && filteredSuggestions.length === 0 && (
										<div className="px-4 py-6 text-center text-sm text-brand-navy/50">
											<MapPinIcon className="h-6 w-6 mx-auto mb-2 opacity-30" />
											<p>No se encontraron ubicaciones con "{location}"</p>
											<p className="text-xs mt-1">Puedes buscar de todas formas</p>
										</div>
									)}
								</div>
							)}
						</div>
					</label>
				</div>
			</div>
			<div className={`overflow-hidden transition-all duration-500 ease-out ${
				advanced 
					? 'max-h-[500px] opacity-100 mt-4' 
					: 'max-h-0 opacity-0 mt-0'
			}`}>
				<div className={`space-y-4 transition-all duration-400 ease-out ${
					advanced ? 'transform translate-y-0 scale-100' : 'transform -translate-y-2 scale-95'
				}`}>
					<div className={`grid grid-cols-1 gap-4 md:grid-cols-3 transition-opacity duration-500 delay-100 ${
						advanced ? 'opacity-100' : 'opacity-0'
					}`}>

						{/* Habitaciones */}
						<div>
							<label className="flex flex-col gap-1 text-xs font-medium text-brand-navy">
								Habitaciones
								<select
									value={bedrooms}
									onChange={(e) => setBedrooms(e.target.value)}
									className="w-full rounded-lg border border-brand-navy/20 bg-white/70 py-2 px-3 text-sm text-brand-navy focus:border-brand-navy/40 focus:outline-none focus:ring-2 focus:ring-secondary-500/60"
								>
									<option value="">Cualquiera</option>
									<option value="1">1+</option>
									<option value="2">2+</option>
									<option value="3">3+</option>
									<option value="4">4+</option>
									<option value="5">5+</option>
								</select>
							</label>
						</div>
						<div>
							<label className="flex flex-col gap-1 text-xs font-medium text-brand-navy">
								Precio mín.
								<input
									value={minPrice}
									onChange={(e) => setMinPrice(e.target.value.replace(/[^0-9]/g, ''))}
									placeholder="0"
									className="w-full rounded-lg border border-brand-navy/20 bg-white/70 py-2 px-3 text-sm text-brand-navy placeholder:text-brand-navy/40 focus:border-brand-navy/40 focus:outline-none focus:ring-2 focus:ring-secondary-500/60"
								/>
							</label>
						</div>
						<div>
							<label className="flex flex-col gap-1 text-xs font-medium text-brand-navy">
								Precio máx.
								<input
									value={maxPrice}
									onChange={(e) => setMaxPrice(e.target.value.replace(/[^0-9]/g, ''))}
									placeholder="5000"
									className="w-full rounded-lg border border-brand-navy/20 bg-white/70 py-2 px-3 text-sm text-brand-navy placeholder:text-brand-navy/40 focus:border-brand-navy/40 focus:outline-none focus:ring-2 focus:ring-secondary-500/60"
								/>
							</label>
						</div>

						{/* Baños */}
						<div>
							<label className="flex flex-col gap-1 text-xs font-medium text-brand-navy">
								Baños
								<select
									value={bathrooms}
									onChange={(e) => setBathrooms(e.target.value)}
									className="w-full rounded-lg border border-brand-navy/20 bg-white/70 py-2 px-3 text-sm text-brand-navy focus:border-brand-navy/40 focus:outline-none focus:ring-2 focus:ring-secondary-500/60"
								>
									<option value="">Cualquiera</option>
									<option value="1">1+</option>
									<option value="2">2+</option>
									<option value="3">3+</option>
									<option value="4">4+</option>
								</select>
							</label>
						</div>
					</div>

					<div className={`grid grid-cols-1 gap-4 md:grid-cols-3 transition-opacity duration-500 delay-200 ${
						advanced ? 'opacity-100' : 'opacity-0'
					}`}>
						{/* Área Mínima */}
						<div>
							<label className="flex flex-col gap-1 text-xs font-medium text-brand-navy">
								Área mín. (m²)
								<input
									value={minArea}
									onChange={(e) => setMinArea(e.target.value.replace(/[^0-9]/g, ''))}
									placeholder="50"
									className="w-full rounded-lg border border-brand-navy/20 bg-white/70 py-2 px-3 text-sm text-brand-navy placeholder:text-brand-navy/40 focus:border-brand-navy/40 focus:outline-none focus:ring-2 focus:ring-secondary-500/60"
								/>
							</label>
						</div>

						{/* Área Máxima */}
						<div>
							<label className="flex flex-col gap-1 text-xs font-medium text-brand-navy">
								Área máx. (m²)
								<input
									value={maxArea}
									onChange={(e) => setMaxArea(e.target.value.replace(/[^0-9]/g, ''))}
									placeholder="200"
									className="w-full rounded-lg border border-brand-navy/20 bg-white/70 py-2 px-3 text-sm text-brand-navy placeholder:text-brand-navy/40 focus:border-brand-navy/40 focus:outline-none focus:ring-2 focus:ring-secondary-500/60"
								/>
							</label>
						</div>

						{/* Modalidad de Alquiler */}
						<div>
							<label className="flex flex-col gap-1 text-xs font-medium text-brand-navy">
								Modalidad
								<select
									value={rentalMode}
									onChange={(e) => setRentalMode(e.target.value)}
									className="w-full rounded-lg border border-brand-navy/20 bg-white/70 py-2 px-3 text-sm text-brand-navy focus:border-brand-navy/40 focus:outline-none focus:ring-2 focus:ring-secondary-500/60"
								>
									<option value="">Todas</option>
									<option value="traditional">Tradicional</option>
									<option value="airbnb">Airbnb</option>
									<option value="shared">Compartido</option>
									<option value="coliving">Coliving</option>
								</select>
							</label>
						</div>
					</div>

					{/* Filtros Booleanos */}
					<div className={`flex flex-wrap gap-4 transition-opacity duration-500 delay-300 ${
						advanced ? 'opacity-100' : 'opacity-0'
					}`}>
						<label className="flex items-center gap-2 text-xs font-medium text-brand-navy cursor-pointer">
							<input
								type="checkbox"
								checked={furnished === true}
								onChange={(e) => setFurnished(e.target.checked ? true : undefined)}
								className="rounded border-brand-navy/20 text-secondary-500 focus:ring-secondary-500/60"
							/>
							Amoblado
						</label>
						
						<label className="flex items-center gap-2 text-xs font-medium text-brand-navy cursor-pointer">
							<input
								type="checkbox"
								checked={verified === true}
								onChange={(e) => setVerified(e.target.checked ? true : undefined)}
								className="rounded border-brand-navy/20 text-secondary-500 focus:ring-secondary-500/60"
							/>
							Solo verificados
						</label>

						<label className="flex items-center gap-2 text-xs font-medium text-brand-navy cursor-pointer">
							<input
								type="checkbox"
								checked={petFriendly === true}
								onChange={(e) => setPetFriendly(e.target.checked ? true : undefined)}
								className="rounded border-brand-navy/20 text-secondary-500 focus:ring-secondary-500/60"
							/>
							🐕 Pet Friendly
						</label>
					</div>
				</div>
			</div>

			{/* Botones de acción */}
			<div className="flex items-center justify-between gap-4">
				{/* Desktop: Botón de filtros avanzados */}
				<button
					type="button"
					onClick={() => setAdvanced(a => !a)}
					className="hidden md:flex items-center gap-2 text-xs font-semibold text-brand-navy hover:underline transition-all duration-200 hover:text-secondary-600"
				>
					<span>{advanced ? 'Ocultar filtros' : 'Más filtros'}</span>
					<AdjustmentsHorizontalIcon className={`h-4 w-4 transition-transform duration-300 ${
						advanced ? 'rotate-180' : 'rotate-0'
					}`} />
				</button>

				{/* Mobile: Espacio vacío (los filtros se abren automáticamente después de buscar) */}
				<div className="md:hidden" />

				<Button 
					type="submit" 
					variant="primary" 
					size="md" 
					loading={isLoading} 
					rightIcon={<MagnifyingGlassIcon className="h-5 w-5" />}
					className="hidden md:flex"
				>
					Buscar
				</Button>
			</div>
		</form>
	</>
	)
}

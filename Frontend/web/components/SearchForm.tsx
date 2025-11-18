import { useState } from 'react'
import Button from './ui/Button'
import MobileSearchForm from './MobileSearchForm'
import SearchAutocomplete from './SearchAutocomplete'
import { VoiceSearchButton } from './search/VoiceSearchButton'
import { MagnifyingGlassIcon, MapPinIcon, CurrencyDollarIcon, AdjustmentsHorizontalIcon, BuildingOffice2Icon, HomeIcon, KeyIcon, HomeModernIcon } from '@heroicons/react/24/outline'

type Mode = 'alquiler' | 'comprar' | 'proyecto' | 'tipo_Airbnb'

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
    radius?: number
  }) => void
  className?: string
  isLoading?: boolean
  placeholder?: string
}

export default function SearchForm({ onSearch, className = '', isLoading = false, placeholder }: SearchFormProps) {
	const [mode, setMode] = useState<Mode>('alquiler')
	const [location, setLocation] = useState('')
	const [minPrice, setMinPrice] = useState('')
	const [maxPrice, setMaxPrice] = useState('')
	const [advanced, setAdvanced] = useState(false)
	
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
			{/* Versión móvil - visible solo en pantallas pequeñas */}
			<div className="block md:hidden">
				<MobileSearchForm 
					onSearch={onSearch}
					className={className}
					isLoading={isLoading}
					placeholder={placeholder}
				/>
			</div>

			{/* Versión desktop - oculta en móvil */}
			<form
				onSubmit={submit}
				className={`hidden md:block w-full rounded-2xl bg-white/80 p-3 sm:p-4 backdrop-blur shadow-soft ring-1 ring-black/5 space-y-3 sm:space-y-4 ${className}`}
			>
			{/* Tabs - Scroll horizontal en móvil */}
			<div className="flex items-center gap-2 overflow-x-auto pb-1 scrollbar-hide">
				<Tab value="alquiler" label="Alquiler" icon={BuildingOffice2Icon} />
				<Tab value="comprar" label="Comprar" icon={CurrencyDollarIcon} />
				<Tab value="proyecto" label="Proyecto" icon={AdjustmentsHorizontalIcon} />
				<Tab value="tipo_Airbnb" label="Tipo Airbnb" icon={HomeModernIcon} />
			</div>
			
			{/* Tipo de Propiedad - Stack en móvil, inline en desktop */}
			<div className="flex flex-col sm:flex-row sm:items-center gap-2 sm:gap-3">
				<span className="text-xs sm:text-sm font-medium text-brand-navy whitespace-nowrap">Tipo de Propiedad</span>
				<select
					value={propertyType}
					onChange={(e) => setPropertyType(e.target.value)}
					className="w-full sm:flex-1 sm:max-w-xs rounded-lg border border-brand-navy/20 bg-white/70 py-2 px-3 text-sm text-brand-navy focus:border-brand-navy/40 focus:outline-none focus:ring-2 focus:ring-secondary-500/60"
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
			
			<div className="grid grid-cols-1 gap-4 md:grid-cols-4">
				<div className="md:col-span-4">
					<label className="flex flex-col gap-1 text-xs font-medium text-brand-navy">
						Ubicación
							<div className="relative flex gap-2">
							<div className="relative flex-1">
								<MapPinIcon className="pointer-events-none absolute left-3 top-1/2 h-5 w-5 -translate-y-1/2 text-brand-navy/50 z-10" />
								<SearchAutocomplete
									value={location}
									onChange={setLocation}
									placeholder={placeholder || "Distrito, ciudad o dirección"}
								/>
							</div>
							
							{/* Botón de búsqueda por voz */}
							<VoiceSearchButton variant="icon" />
							
							<button
								type="button"
								onClick={() => {
									if (navigator.geolocation) {
										navigator.geolocation.getCurrentPosition(
											(position) => {
												const { latitude, longitude } = position.coords
												// Llamar a onSearch con las coordenadas
												onSearch?.({
													mode,
													location: `${latitude},${longitude}`,
													radius: 10000, // 10km en metros
												} as any)
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
								className="flex items-center gap-1 rounded-lg border border-secondary-500/60 bg-white/70 px-3 py-2 text-xs font-medium text-brand-navy hover:bg-secondary-500/20 transition whitespace-nowrap"
								title="Usar mi ubicación actual"
							>
								<svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
									<path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
									<path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" />
								</svg>
								Mi ubicación
							</button>
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
						
						{/* Precios - Grid de 2 columnas en móvil */}
						<div className="grid grid-cols-2 gap-3 md:col-span-2 md:grid-cols-2">
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
			<div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3 sm:gap-4">
				<button
					type="button"
					onClick={() => setAdvanced(a => !a)}
					className="flex items-center justify-center gap-2 text-xs font-semibold text-brand-navy hover:underline transition-all duration-200 hover:text-secondary-600 py-2 sm:py-0"
				>
					<span>{advanced ? 'Ocultar filtros' : 'Más filtros'}</span>
					<AdjustmentsHorizontalIcon className={`h-4 w-4 transition-transform duration-300 ${
						advanced ? 'rotate-180' : 'rotate-0'
					}`} />
				</button>
				<Button 
					type="submit" 
					variant="primary" 
					size="md" 
					loading={isLoading} 
					rightIcon={<MagnifyingGlassIcon className="h-5 w-5" />}
					className="w-full sm:w-auto"
				>
					Buscar
				</Button>
			</div>
		</form>
		</>
	)
}

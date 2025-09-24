import { useState } from 'react'
import Button from './ui/Button'
import { MagnifyingGlassIcon, MapPinIcon, CurrencyDollarIcon, AdjustmentsHorizontalIcon, BuildingOffice2Icon, HomeIcon, KeyIcon } from '@heroicons/react/24/outline'

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
  }) => void
  className?: string
  isLoading?: boolean
  placeholder?: string
}export default function SearchForm({ onSearch, className = '', isLoading = false, placeholder }: SearchFormProps) {
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
		<form
			onSubmit={submit}
			className={`w-full rounded-2xl bg-white/80 p-4 backdrop-blur shadow-soft ring-1 ring-black/5 space-y-4 ${className}`}
		>
			<div className="flex flex-wrap items-center gap-2">
				<Tab value="alquiler" label="Alquiler" icon={BuildingOffice2Icon} />
				<Tab value="comprar" label="Comprar" icon={CurrencyDollarIcon} />
				<Tab value="vender" label="Vender" icon={CurrencyDollarIcon} />
				<Tab value="proyecto" label="Proyecto" icon={AdjustmentsHorizontalIcon} />
			</div>
			<div className="grid grid-cols-1 gap-4 md:grid-cols-4">
				{/* Tipo de Propiedad */}
				<div>
					<label className="flex flex-row gap-5 text-xs font-medium text-brand-navy">
						Tipo de Propiedad
						<select
							value={propertyType}
							onChange={(e) => setPropertyType(e.target.value)}
							className="w-full rounded-lg border border-brand-navy/20 bg-white/70 py-2 px-3 text-sm text-brand-navy focus:border-brand-navy/40 focus:outline-none focus:ring-2 focus:ring-secondary-500/60"
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
					</label>
				</div>
				<div className="md:col-span-4">
					<label className="flex flex-col gap-1 text-xs font-medium text-brand-navy">
						Ubicación
						<div className="relative">
							<MapPinIcon className="pointer-events-none absolute left-3 top-1/2 h-5 w-5 -translate-y-1/2 text-brand-navy/50" />
							<input
								value={location}
								onChange={(e) => setLocation(e.target.value)}
								placeholder={placeholder || "Distrito, ciudad o dirección"}
								className="w-full rounded-lg border border-brand-navy/20 bg-white/70 py-2 pl-10 pr-3 text-sm text-brand-navy placeholder:text-brand-navy/40 focus:border-brand-navy/40 focus:outline-none focus:ring-2 focus:ring-secondary-500/60"
							/>
						</div>
					</label>
				</div>
			</div>
			{advanced && (
				<div className="space-y-4">
					<div className="grid grid-cols-1 gap-4 md:grid-cols-3">

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

					<div className="grid grid-cols-1 gap-4 md:grid-cols-3">
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
					<div className="flex flex-wrap gap-4">
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
			)}
			<div className="flex items-center justify-between gap-4">
				<button
					type="button"
						onClick={() => setAdvanced(a => !a)}
					className="text-xs font-semibold text-brand-navy hover:underline"
				>
					{advanced ? 'Ocultar filtros' : 'Más filtros'}
				</button>
				        <Button type="submit" variant="primary" size="md" loading={isLoading} rightIcon={<MagnifyingGlassIcon className="h-5 w-5" />}>Buscar</Button>
			</div>
		</form>
	)
}

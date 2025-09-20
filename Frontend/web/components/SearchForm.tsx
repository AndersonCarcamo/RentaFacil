import { useState } from 'react'
import Button from './ui/Button'
import { MagnifyingGlassIcon, MapPinIcon, CurrencyDollarIcon, AdjustmentsHorizontalIcon, BuildingOffice2Icon } from '@heroicons/react/24/outline'

type Mode = 'alquiler' | 'comprar' | 'proyecto'

interface SearchFormProps {
  onSearch?: (params: { mode: Mode; location: string; minPrice?: number; maxPrice?: number }) => void
  className?: string
  isLoading?: boolean
  placeholder?: string
}export default function SearchForm({ onSearch, className = '', isLoading = false, placeholder }: SearchFormProps) {
	const [mode, setMode] = useState<Mode>('alquiler')
	const [location, setLocation] = useState('')
	const [minPrice, setMinPrice] = useState('')
	const [maxPrice, setMaxPrice] = useState('')
	const [advanced, setAdvanced] = useState(false)

	const submit = (e: React.FormEvent) => {
		e.preventDefault()
		onSearch?.({
			mode,
			location: location.trim(),
			minPrice: minPrice ? Number(minPrice) : undefined,
			maxPrice: maxPrice ? Number(maxPrice) : undefined
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
				<Tab value="proyecto" label="Proyecto" icon={AdjustmentsHorizontalIcon} />
			</div>
			<div className="grid grid-cols-1 gap-4 md:grid-cols-4">
				<div className="md:col-span-2">
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
			{advanced && (
				<div className="grid grid-cols-1 gap-4 md:grid-cols-3">
					<div className="text-xs text-brand-navy/70 col-span-full">
						(Más filtros avanzados se agregarán aquí…)
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

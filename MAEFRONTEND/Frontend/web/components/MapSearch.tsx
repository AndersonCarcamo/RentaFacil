import { useState } from 'react'

interface MapSearchProps {
	onLocationSelect?: (q: string) => void
}

const popularLocations = [
	{ name: 'Miraflores', x: 160, y: 90 },
	{ name: 'San Isidro', x: 190, y: 70 },
	{ name: 'Barranco', x: 140, y: 130 },
	{ name: 'Surco', x: 210, y: 140 },
	{ name: 'La Molina', x: 260, y: 130 },
	{ name: 'Pueblo Libre', x: 170, y: 110 },
]

export default function MapSearch({ onLocationSelect }: MapSearchProps) {
	const [selected, setSelected] = useState<string | null>(null)

	const handleLocationClick = (loc: { name: string }) => {
		setSelected(loc.name)
		onLocationSelect?.(loc.name)
	}

	return (
		<div className="w-full">
			<div className="relative mx-auto max-w-2xl rounded-xl border border-gray-200 bg-white shadow-soft p-4">
				<svg viewBox="0 0 400 300" className="w-full h-64 rounded-lg bg-gradient-to-b from-brand-navy/5 to-brand-navy/10">
					<defs>
						<linearGradient id="areaGradient" x1="0" y1="0" x2="0" y2="1">
							<stop offset="0%" stopColor="#2CA7E1" stopOpacity={0.25} />
							<stop offset="100%" stopColor="#F5C842" stopOpacity={0.15} />
						</linearGradient>
					</defs>
					<path
						d="M50 50 Q200 30 350 80 Q380 150 320 220 Q200 280 80 250 Q20 180 50 50"
						fill="url(#areaGradient)"
						stroke="#2CA7E1"
						strokeWidth={2}
					/>
					{popularLocations.map((location, index) => {
						const isSelected = selected === location.name
						const { x, y } = location
						return (
							<g key={location.name}>
								<circle
									cx={x}
									cy={y}
									r={isSelected ? 9 : 7}
									fill={isSelected ? '#F5C842' : '#2CA7E1'}
									stroke={isSelected ? '#0C2D55' : 'white'}
									strokeWidth={isSelected ? 3 : 2}
									className="cursor-pointer transition-all"
									onClick={() => handleLocationClick(location)}
								/>
								<text
									x={x + 12}
									y={y + 4}
									className="text-[10px] font-medium select-none"
									fill="#0C2D55"
								>
									{location.name}
								</text>
							</g>
						)
					})}
				</svg>
				<div className="mt-4 flex flex-wrap gap-2 justify-center">
					{popularLocations.map((loc) => {
						const isSelected = loc.name === selected
						return (
							<button
								key={loc.name}
								onClick={() => handleLocationClick(loc)}
								className={
									'px-3 py-1.5 rounded-full text-xs font-medium transition-colors border ' +
									(isSelected
										? 'bg-secondary-500 text-brand-navy border-secondary-500'
										: 'bg-white text-gray-700 border-gray-200 hover:border-secondary-500 hover:text-brand-navy')
								}
							>
								{loc.name}
							</button>
						)
					})}
				</div>
				<div className="mt-6 text-center">
					<button
						onClick={() => selected && onLocationSelect?.(selected)}
						disabled={!selected}
						className="inline-flex items-center gap-2 rounded-md bg-secondary-500 px-5 py-2.5 text-sm font-semibold text-brand-navy shadow-sm disabled:opacity-50 disabled:cursor-not-allowed hover:bg-secondary-500/90"
					>
						{selected ? `Buscar en ${selected}` : 'Selecciona una zona'}
					</button>
				</div>
			</div>
		</div>
	)
}

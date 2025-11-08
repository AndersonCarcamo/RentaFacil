import Image from 'next/image'
import { CheckBadgeIcon, StarIcon, EyeIcon } from '@heroicons/react/24/solid'
import { HeartIcon as HeartIconOutline } from '@heroicons/react/24/outline'
import { HeartIcon as HeartIconSolid } from '@heroicons/react/24/solid'
import { Property } from '@/types'
import { useState } from 'react'

// Función para formateo consistente de números
const formatPrice = (price: number): string => {
  return price.toString().replace(/\B(?=(\d{3})+(?!\d))/g, ',')
}

interface PropertyCardProps {
	property: Property
	className?: string
	onFavoriteToggle?: (id: string, next: boolean) => void
	onClick?: (id: string) => void
}

export default function PropertyCard({ property, className = '', onFavoriteToggle, onClick }: PropertyCardProps) {
	const [favorite, setFavorite] = useState(property.isFavorite)

	const toggleFav = (e: React.MouseEvent) => {
		e.preventDefault()
		e.stopPropagation()
		const next = !favorite
		setFavorite(next)
		onFavoriteToggle?.(property.id, next)
	}

	const handleClick = () => {
		onClick?.(property.id)
	}

	return (
		<article 
			className={`group relative overflow-hidden rounded-xl border border-gray-200 bg-white shadow-soft transition hover:shadow-medium cursor-pointer ${className}`}
			onClick={handleClick}
		>
			<div className="relative aspect-[4/3] w-full overflow-hidden">
				<Image
					src={property.images[0] || '/images/placeholder.jpg'}
					alt={property.title}
					fill
					className="object-cover transition-transform duration-500 group-hover:scale-105"
					sizes="(max-width: 768px) 100vw, (max-width: 1200px) 33vw, 400px"
				/>
				<div className="absolute inset-0 bg-gradient-to-t from-black/40 via-black/10 to-transparent" />

				{/* Badges top */}
				<div className="absolute top-3 left-3 flex flex-wrap gap-2">
					{property.isVerified && (
						<span className="inline-flex items-center gap-1 rounded-md bg-secondary-500 px-2 py-1 text-[10px] font-semibold text-brand-navy shadow">
							<CheckBadgeIcon className="h-3.5 w-3.5" /> Verificado
						</span>
					)}
					{property.rating >= 4.8 && (
						<span className="inline-flex items-center gap-1 rounded-md bg-primary-500/90 px-2 py-1 text-[10px] font-medium text-white backdrop-blur">
							<StarIcon className="h-3.5 w-3.5" /> {property.rating.toFixed(2)}
						</span>
					)}
				</div>

				{/* Favorite button */}
				<button
					onClick={toggleFav}
					className="absolute top-2 right-2 inline-flex h-9 w-9 items-center justify-center rounded-full bg-white/90 text-gray-600 backdrop-blur hover:text-red-500 hover:bg-white transition"
				>
					{favorite ? (
						<HeartIconSolid className="h-5 w-5 text-red-500" />
					) : (
						<HeartIconOutline className="h-5 w-5" />
					)}
					<span className="sr-only">Favorito</span>
				</button>
			</div>

			<div className="flex flex-col gap-3 p-4">
				<header>
					<h3 className="line-clamp-2 text-sm font-semibold text-gray-900 min-h-[2.5rem]">{property.title}</h3>
					<p className="mt-1 text-xs text-gray-500 line-clamp-2 min-h-[2rem]">{property.description}</p>
				</header>

				<div className="flex items-center justify-between">
					<div className="text-brand-navy font-semibold text-lg">
						{property.currency === 'PEN' ? 'S/' : '$'}{formatPrice(property.price)}
						<span className="ml-1 text-xs font-medium text-gray-500">/mes</span>
					</div>
					<div className="flex items-center gap-2 text-[11px] text-gray-500">
						<span>{property.bedrooms} hab</span>
						<span className="h-1 w-1 rounded-full bg-gray-300" />
						<span>{property.bathrooms} bañ</span>
						<span className="h-1 w-1 rounded-full bg-gray-300" />
						<span>{property.area} m²</span>
					</div>
				</div>

				<div className="flex items-center justify-between text-xs">
					<div className="truncate max-w-[70%] text-gray-600 flex items-center gap-1">
						<span className="inline-block h-2 w-2 rounded-full bg-primary-500" />
						{property.location}
					</div>
					<div className="flex items-center gap-3 text-gray-400">
						<div className="flex items-center gap-1">
							<StarIcon className="h-4 w-4 text-yellow-400" />
							<span className="text-gray-600 font-medium">{property.rating.toFixed(2)}</span>
						</div>
						<div className="flex items-center gap-1">
							<EyeIcon className="h-4 w-4" />
							<span>{property.views}</span>
						</div>
					</div>
				</div>
			</div>
		</article>
	)
}

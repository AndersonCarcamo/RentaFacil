import Image from 'next/image'
import { HeartIcon, CheckBadgeIcon, StarIcon, EyeIcon } from '@heroicons/react/24/solid'
import { Property } from '@/types'
import { useState } from 'react'

// Función para formateo consistente de números
const formatPrice = (price: number): string => {
  return price.toString().replace(/\B(?=(\d{3})+(?!\d))/g, ',')
}

interface PropertyCardHorizontalProps {
	property: Property
	className?: string
	onFavoriteToggle?: (id: string, next: boolean) => void
	onClick?: (id: string) => void
}

export default function PropertyCardHorizontal({ 
	property, 
	className = '', 
	onFavoriteToggle, 
	onClick 
}: PropertyCardHorizontalProps) {
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
			{/* Banner de oferta limitada para Airbnb top performers */}
			{property.rental_term === 'daily' && property.rating >= 4.7 && (
				<div className="absolute top-0 left-0 right-0 bg-gradient-to-r from-red-600 via-pink-600 to-red-600 text-white text-center py-1 text-[10px] font-bold uppercase tracking-wider z-10 shadow-lg">
					⏰ Oferta Limitada - Solo por hoy
				</div>
			)}
			
			<div className={`flex flex-col sm:flex-row h-auto sm:h-48 ${property.rental_term === 'daily' && property.rating >= 4.7 ? 'mt-6' : ''}`}>
				{/* Imagen - Arriba en móvil, Izquierda en desktop */}
				<div className="relative w-full h-48 sm:w-80 sm:h-auto flex-shrink-0 overflow-hidden">
					<Image
						src={property.images[0] || '/images/placeholder.jpg'}
						alt={property.title}
						fill
						className="object-cover transition-transform duration-500 group-hover:scale-105"
						sizes="(max-width: 640px) 100vw, 320px"
					/>
					<div className="absolute inset-0 bg-gradient-to-r from-black/20 via-transparent to-transparent" />

					{/* Badge de "HOT DEAL" o "NUEVO" en esquina superior derecha */}
					{property.rental_term === 'daily' && property.rating >= 4.6 && (
						<div className="absolute top-0 right-0">
							<div className="bg-gradient-to-br from-yellow-400 to-orange-500 text-white px-3 py-1 text-[10px] font-black uppercase tracking-wide shadow-lg transform rotate-0 rounded-bl-lg flex items-center gap-1">
								🔥 Hot Deal
							</div>
						</div>
					)}

					{/* Badges top-left */}
					<div className="absolute top-2 left-2 flex flex-col gap-1.5">
						{/* Ofertas especiales para Airbnb (primeras 3 propiedades con rental_term = 'daily') */}
						{property.rental_term === 'daily' && property.rating >= 4.5 && (
							<span className="inline-flex items-center gap-1 rounded-md bg-gradient-to-r from-red-500 to-pink-500 px-2.5 py-1 text-[11px] font-bold text-white shadow-lg animate-pulse">
								🔥 -20% Primera Reserva
							</span>
						)}
						{property.rental_term === 'daily' && property.rating >= 4.0 && property.rating < 4.5 && (
							<span className="inline-flex items-center gap-1 rounded-md bg-gradient-to-r from-orange-500 to-yellow-500 px-2.5 py-1 text-[11px] font-bold text-white shadow-lg">
								⚡ Descuento Especial
							</span>
						)}
						{property.rental_term === 'daily' && property.bedrooms >= 2 && (
							<span className="inline-flex items-center gap-1 rounded-md bg-purple-600/95 px-2 py-1 text-[10px] font-semibold text-white backdrop-blur shadow">
								✨ Reserva 3 noches, paga 2
							</span>
						)}
						
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
						{property.furnished && (
							<span className="inline-flex items-center gap-1 rounded-md bg-blue-500/90 px-2 py-1 text-[10px] font-medium text-white backdrop-blur">
								🛋️ Amoblado
							</span>
						)}
						{property.petFriendly && (
							<span className="inline-flex items-center gap-1 rounded-md bg-green-500/90 px-2 py-1 text-[10px] font-medium text-white backdrop-blur">
								🐕 Pet Friendly
							</span>
						)}
					</div>

					{/* Favorite button */}
					<button
						onClick={toggleFav}
						className="absolute top-2 right-2 inline-flex h-8 w-8 items-center justify-center rounded-full bg-white/90 text-gray-600 backdrop-blur hover:text-red-500 hover:bg-white transition"
					>
						<HeartIcon className={`h-4 w-4 ${favorite ? 'fill-red-500 text-red-500' : 'fill-none'}`} />
						<span className="sr-only">Favorito</span>
					</button>
				</div>

				{/* Contenido - Lado Derecho */}
				<div className="flex flex-1 flex-col justify-between p-5">
					{/* Header */}
					<div>
						<h3 className="line-clamp-1 text-lg font-semibold text-gray-900">
							{property.title}
						</h3>
						<p className="mt-1.5 text-sm text-gray-500 line-clamp-2">
							{property.description}
						</p>
					</div>

					{/* Middle Section - Info Grid */}
					<div className="flex items-center justify-between gap-4">
						{/* Características */}
						<div className="flex items-center gap-3 text-sm text-gray-600">
							<span className="flex items-center gap-1">
								<svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
									<path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 12l2-2m0 0l7-7 7 7M5 10v10a1 1 0 001 1h3m10-11l2 2m-2-2v10a1 1 0 01-1 1h-3m-6 0a1 1 0 001-1v-4a1 1 0 011-1h2a1 1 0 011 1v4a1 1 0 001 1m-6 0h6" />
								</svg>
								{property.bedrooms} hab
							</span>
							<span className="h-1 w-1 rounded-full bg-gray-300" />
							<span className="flex items-center gap-1">
								<svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
									<path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 14v3m4-3v3m4-3v3M3 21h18M3 10h18M3 7l9-4 9 4M4 10h16v11H4V10z" />
								</svg>
								{property.bathrooms} baños
							</span>
							<span className="h-1 w-1 rounded-full bg-gray-300" />
							<span className="flex items-center gap-1">
								<svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
									<path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 8V4m0 0h4M4 4l5 5m11-1V4m0 0h-4m4 0l-5 5M4 16v4m0 0h4m-4 0l5-5m11 5l-5-5m5 5v-4m0 4h-4" />
								</svg>
								{property.area} m²
							</span>
						</div>

						{/* Precio */}
						<div className="text-right">
							{/* Mostrar precio con descuento para Airbnb */}
							{property.rental_term === 'daily' && property.rating >= 4.5 ? (
								<>
									<div className="text-gray-400 line-through text-sm font-medium">
										{property.currency === 'PEN' ? 'S/' : '$'}{formatPrice(Math.round(property.price * 1.25))}
									</div>
									<div className="text-red-600 font-bold text-xl flex items-center justify-end gap-1">
										{property.currency === 'PEN' ? 'S/' : '$'}{formatPrice(property.price)}
										<span className="text-xs bg-red-100 text-red-700 px-1.5 py-0.5 rounded font-bold">-20%</span>
									</div>
									<span className="text-xs font-medium text-gray-500">/noche</span>
								</>
							) : property.rental_term === 'daily' ? (
								<>
									<div className="text-brand-navy font-bold text-xl">
										{property.currency === 'PEN' ? 'S/' : '$'}{formatPrice(property.price)}
									</div>
									<span className="text-xs font-medium text-gray-500">/noche</span>
								</>
							) : (
								<>
									<div className="text-brand-navy font-bold text-xl">
										{property.currency === 'PEN' ? 'S/' : '$'}{formatPrice(property.price)}
									</div>
									<span className="text-xs font-medium text-gray-500">/mes</span>
								</>
							)}
						</div>
					</div>

					{/* Footer */}
					<div className="flex flex-col gap-2">
						<div className="flex items-center justify-between text-xs">
							{/* Ubicación */}
							<div className="truncate max-w-[60%] text-gray-600 flex items-center gap-1.5">
								<svg className="w-4 h-4 text-primary-500 flex-shrink-0" fill="currentColor" viewBox="0 0 24 24">
									<path fillRule="evenodd" d="M11.54 22.351l.07.04.028.016a.76.76 0 00.723 0l.028-.015.071-.041a16.975 16.975 0 001.144-.742 19.58 19.58 0 002.683-2.282c1.944-1.99 3.963-4.98 3.963-8.827a8.25 8.25 0 00-16.5 0c0 3.846 2.02 6.837 3.963 8.827a19.58 19.58 0 002.682 2.282 16.975 16.975 0 001.145.742zM12 13.5a3 3 0 100-6 3 3 0 000 6z" clipRule="evenodd" />
								</svg>
								<span className="font-medium">{property.location}</span>
							</div>

							{/* Rating y Views */}
							<div className="flex items-center gap-3 text-gray-500">
								<div className="flex items-center gap-1">
									<StarIcon className="h-4 w-4 text-yellow-400" />
									<span className="text-gray-700 font-semibold">{property.rating.toFixed(1)}</span>
									<span className="text-gray-400">({property.reviews})</span>
								</div>
								<div className="flex items-center gap-1">
									<EyeIcon className="h-4 w-4" />
									<span className="font-medium">{property.views}</span>
								</div>
							</div>
						</div>
						
						{/* Mensajes de urgencia para Airbnb */}
						{property.rental_term === 'daily' && property.rating >= 4.5 && (
							<div className="flex items-center gap-2 text-[11px] bg-red-50 border border-red-200 rounded-md px-2 py-1.5">
								<span className="text-red-600 font-semibold flex items-center gap-1">
									⚠️ Solo quedan 2 disponibles
								</span>
								<span className="text-gray-500">•</span>
								<span className="text-orange-600 font-medium">
									{Math.floor(Math.random() * 15) + 8} personas viendo
								</span>
							</div>
						)}
						{property.rental_term === 'daily' && property.rating >= 4.0 && property.rating < 4.5 && (
							<div className="flex items-center gap-1 text-[11px] text-green-700 bg-green-50 border border-green-200 rounded-md px-2 py-1.5">
								<svg className="w-3.5 h-3.5" fill="currentColor" viewBox="0 0 20 20">
									<path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
								</svg>
								<span className="font-semibold">Cancelación gratis hasta 24h antes</span>
							</div>
						)}
					</div>
				</div>
			</div>
		</article>
	)
}

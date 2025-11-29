import React from 'react'
import { Property } from '../types'
import { 
  MapPinIcon, 
  HomeIcon,
  StarIcon,
  CheckBadgeIcon 
} from '@heroicons/react/24/solid'

interface PropertyCardMiniProps {
  property: Property
  onClick: (id: string) => void
  isHighlighted?: boolean
}

const PropertyCardMini: React.FC<PropertyCardMiniProps> = ({ 
  property, 
  onClick,
  isHighlighted = false 
}) => {
  return (
    <div
      onClick={() => onClick(property.id)}
      className={`
        flex gap-3 bg-white rounded-xl p-3 shadow-md 
        active:scale-[0.98] transition-all duration-150
        cursor-pointer
        ${isHighlighted ? 'ring-2 ring-blue-500 shadow-lg' : ''}
      `}
    >
      {/* Imagen */}
      <div className="w-24 h-24 flex-shrink-0 relative rounded-lg overflow-hidden bg-gray-200">
        {property.images && property.images.length > 0 ? (
          <img
            src={property.images[0]}
            alt={property.title}
            className="w-full h-full object-cover"
            onError={(e) => {
              e.currentTarget.src = '/images/properties/property-placeholder.svg'
            }}
          />
        ) : (
          <div className="w-full h-full flex items-center justify-center bg-gray-100">
            <HomeIcon className="w-10 h-10 text-gray-300" />
          </div>
        )}
        
        {/* Badge de verificado */}
        {property.isVerified && (
          <div className="absolute top-1 right-1 bg-yellow-400 rounded-full p-1">
            <CheckBadgeIcon className="w-4 h-4 text-white" />
          </div>
        )}
      </div>

      {/* Info */}
      <div className="flex-1 min-w-0 flex flex-col justify-between">
        {/* Título */}
        <div>
          <h3 className="font-semibold text-sm text-gray-900 line-clamp-1 mb-1">
            {property.title}
          </h3>
          
          {/* Ubicación */}
          <div className="flex items-center gap-1 text-xs text-gray-600 mb-2">
            <MapPinIcon className="w-3 h-3 flex-shrink-0" />
            <span className="line-clamp-1">{property.location}</span>
          </div>

          {/* Características */}
          <div className="flex items-center gap-3 text-xs text-gray-600 mb-2">
            {property.bedrooms > 0 && (
              <span className="flex items-center gap-1">
                🛏️ {property.bedrooms}
              </span>
            )}
            {property.bathrooms > 0 && (
              <span className="flex items-center gap-1">
                🚿 {property.bathrooms}
              </span>
            )}
            {property.area > 0 && (
              <span className="flex items-center gap-1">
                📐 {property.area}m²
              </span>
            )}
          </div>
        </div>

        {/* Precio y Rating */}
        <div className="flex items-center justify-between">
          <div className="flex flex-col">
            <span className="text-base font-bold text-gray-900">
              {property.currency} {property.price.toLocaleString()}
            </span>
            <span className="text-xs text-gray-500">/mes</span>
          </div>

          {/* Rating */}
          {property.rating > 0 && (
            <div className="flex items-center gap-1 bg-gray-50 px-2 py-1 rounded-full">
              <StarIcon className="w-3 h-3 text-yellow-400" />
              <span className="text-xs font-medium text-gray-700">
                {property.rating.toFixed(1)}
              </span>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}

export default PropertyCardMini

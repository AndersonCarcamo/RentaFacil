import React, { useEffect, useRef, useState } from 'react'
import { PropertyResponse } from '../lib/api/properties'

interface MapViewProps {
  listings: PropertyResponse[]
  onMarkerClick?: (propertyId: string) => void
  hoveredPropertyId?: string | null
  onMarkerHover?: (propertyId: string | null) => void
}

const MapView: React.FC<MapViewProps> = ({ 
  listings, 
  onMarkerClick,
  hoveredPropertyId,
  onMarkerHover 
}) => {
  const mapRef = useRef<HTMLDivElement>(null)
  const mapInstanceRef = useRef<any>(null)
  const markersRef = useRef<Map<string, any>>(new Map()) // Cambiado a Map para acceso por ID
  const userLocationMarkerRef = useRef<any>(null)
  const userLocationCircleRef = useRef<any>(null)
  const [isMapReady, setIsMapReady] = useState(false)
  const [isLocating, setIsLocating] = useState(false)

  useEffect(() => {
    // Cargar Leaflet solo en el cliente
    if (typeof window === 'undefined') return

    const loadLeaflet = async () => {
      const L = await import('leaflet')
      // El CSS de Leaflet se importa en _app.tsx o en el HTML global

      // Fix para iconos de Leaflet
      delete (L.Icon.Default.prototype as any)._getIconUrl
      L.Icon.Default.mergeOptions({
        iconRetinaUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-icon-2x.png',
        iconUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-icon.png',
        shadowUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-shadow.png',
      })

      if (mapRef.current && !mapInstanceRef.current) {
        // Crear mapa centrado en Lima, Perú
        const map = L.map(mapRef.current, {
          center: [-12.0464, -77.0428], // Lima centro
          zoom: 12,
          zoomControl: true,
        })

        // Agregar capa de tiles de OpenStreetMap
        L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
          attribution: '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors',
          maxZoom: 18,
        }).addTo(map)

        mapInstanceRef.current = map
        setIsMapReady(true)
      }
    }

    loadLeaflet()

    return () => {
      // Limpiar mapa al desmontar
      if (mapInstanceRef.current) {
        mapInstanceRef.current.remove()
        mapInstanceRef.current = null
      }
    }
  }, [])

  useEffect(() => {
    if (!isMapReady || !mapInstanceRef.current) return

    const loadMarkers = async () => {
      const L = await import('leaflet')

      // Limpiar marcadores anteriores
      markersRef.current.forEach(marker => marker.remove())
      markersRef.current.clear()

      // Crear icono personalizado para propiedades
      const createPropertyIcon = (isHovered: boolean = false) => L.divIcon({
        className: 'custom-marker',
        html: `
          <div class="relative transition-transform duration-200 ${isHovered ? 'scale-125' : ''}">
            <div class="absolute -top-10 -left-5 ${isHovered ? 'bg-yellow-500' : 'bg-blue-500'} text-white px-3 py-1.5 rounded-full shadow-lg text-sm font-semibold whitespace-nowrap transition-colors duration-200">
              <svg class="w-4 h-4 inline mr-1" fill="currentColor" viewBox="0 0 20 20">
                <path d="M10.707 2.293a1 1 0 00-1.414 0l-7 7a1 1 0 001.414 1.414L4 10.414V17a1 1 0 001 1h2a1 1 0 001-1v-2a1 1 0 011-1h2a1 1 0 011 1v2a1 1 0 001 1h2a1 1 0 001-1v-6.586l.293.293a1 1 0 001.414-1.414l-7-7z"/>
              </svg>
            </div>
          </div>
        `,
        iconSize: [30, 30],
        iconAnchor: [15, 30],
      })

      // Agregar marcador para cada propiedad con coordenadas
      const validListings = listings.filter(listing => 
        listing.latitude && listing.longitude
      )

      if (validListings.length === 0) {
        console.log('No hay propiedades con coordenadas válidas')
        return
      }

      const bounds = L.latLngBounds([])

      validListings.forEach(listing => {
        const lat = Number(listing.latitude)
        const lng = Number(listing.longitude)

        if (isNaN(lat) || isNaN(lng)) return

        const marker = L.marker([lat, lng], { icon: createPropertyIcon(false) })
          .addTo(mapInstanceRef.current)

        // Eventos de hover
        marker.on('mouseover', () => {
          if (onMarkerHover) {
            onMarkerHover(listing.id)
          }
        })

        marker.on('mouseout', () => {
          if (onMarkerHover) {
            onMarkerHover(null)
          }
        })

        // Popup con información de la propiedad
        const popupContent = `
          <div class="p-2 min-w-[200px]">
            <h3 class="font-semibold text-sm text-gray-900 mb-1">${listing.title || 'Propiedad'}</h3>
            <p class="text-xs text-gray-600 mb-2">${listing.district || ''}, ${listing.department || ''}</p>
            <p class="text-sm font-bold text-blue-600 mb-2">
              ${listing.currency} ${listing.price?.toLocaleString() || '0'}
            </p>
            <div class="flex gap-2 text-xs text-gray-600 mb-2">
              ${listing.bedrooms ? `<span>🛏️ ${listing.bedrooms}</span>` : ''}
              ${listing.bathrooms ? `<span>🚿 ${listing.bathrooms}</span>` : ''}
              ${listing.area_built ? `<span>📐 ${listing.area_built}m²</span>` : ''}
            </div>
            <button 
              onclick="window.dispatchEvent(new CustomEvent('propertyClick', { detail: '${listing.id}' }))"
              class="w-full bg-blue-500 hover:bg-blue-600 text-white text-xs font-medium py-1.5 px-3 rounded transition-colors"
            >
              Ver detalles
            </button>
          </div>
        `

        marker.bindPopup(popupContent, {
          maxWidth: 250,
          className: 'property-popup'
        })

        // Guardar marcador con ID de propiedad
        markersRef.current.set(listing.id, marker)
        bounds.extend([lat, lng])
      })

      // Ajustar vista del mapa a todos los marcadores
      if (validListings.length > 0) {
        mapInstanceRef.current.fitBounds(bounds, { padding: [50, 50] })
      }
    }

    loadMarkers()

    // Event listener para clicks en botones de popup
    const handlePropertyClick = (event: any) => {
      if (onMarkerClick) {
        onMarkerClick(event.detail)
      }
    }

    window.addEventListener('propertyClick', handlePropertyClick)

    return () => {
      window.removeEventListener('propertyClick', handlePropertyClick)
    }
  }, [isMapReady, listings, onMarkerClick])

  // Efecto para cambiar estilo de marcador cuando se hace hover desde la lista
  useEffect(() => {
    if (!isMapReady) return

    const updateMarkerStyles = async () => {
      const L = await import('leaflet')

      markersRef.current.forEach((marker, id) => {
        const isHovered = id === hoveredPropertyId
        const newIcon = L.divIcon({
          className: 'custom-marker',
          html: `
            <div class="relative transition-transform duration-200 ${isHovered ? 'scale-125' : ''}">
              <div class="absolute -top-10 -left-5 ${isHovered ? 'bg-yellow-500 shadow-2xl' : 'bg-blue-500'} text-white px-3 py-1.5 rounded-full shadow-lg text-sm font-semibold whitespace-nowrap transition-all duration-200">
                <svg class="w-4 h-4 inline mr-1" fill="currentColor" viewBox="0 0 20 20">
                  <path d="M10.707 2.293a1 1 0 00-1.414 0l-7 7a1 1 0 001.414 1.414L4 10.414V17a1 1 0 001 1h2a1 1 0 001-1v-2a1 1 0 011-1h2a1 1 0 011 1v2a1 1 0 001 1h2a1 1 0 001-1v-6.586l.293.293a1 1 0 001.414-1.414l-7-7z"/>
                </svg>
              </div>
            </div>
          `,
          iconSize: [30, 30],
          iconAnchor: [15, 30],
        })
        marker.setIcon(newIcon)
      })
    }

    updateMarkerStyles()
  }, [hoveredPropertyId, isMapReady])

  // Función de geolocalización
  const handleGeolocation = async () => {
    if (!mapInstanceRef.current) return

    setIsLocating(true)

    try {
      const L = await import('leaflet')

      if (!navigator.geolocation) {
        alert('Tu navegador no soporta geolocalización')
        setIsLocating(false)
        return
      }

      navigator.geolocation.getCurrentPosition(
        async (position) => {
          const { latitude, longitude } = position.coords
          
          // Limpiar marcador y círculo previos
          if (userLocationMarkerRef.current) {
            userLocationMarkerRef.current.remove()
          }
          if (userLocationCircleRef.current) {
            userLocationCircleRef.current.remove()
          }

          // Crear icono personalizado para ubicación del usuario
          const userIcon = L.divIcon({
            className: 'user-location-marker',
            html: `
              <div class="relative">
                <div class="absolute -top-6 -left-6 w-12 h-12 bg-blue-500 rounded-full flex items-center justify-center shadow-lg animate-pulse">
                  <svg class="w-6 h-6 text-white" fill="currentColor" viewBox="0 0 20 20">
                    <path fill-rule="evenodd" d="M5.05 4.05a7 7 0 119.9 9.9L10 18.9l-4.95-4.95a7 7 0 010-9.9zM10 11a2 2 0 100-4 2 2 0 000 4z" clip-rule="evenodd"/>
                  </svg>
                </div>
              </div>
            `,
            iconSize: [48, 48],
            iconAnchor: [24, 24],
          })

          // Agregar marcador de ubicación del usuario
          const userMarker = L.marker([latitude, longitude], { icon: userIcon })
            .addTo(mapInstanceRef.current)
            .bindPopup(`
              <div class="text-center p-2">
                <p class="font-semibold text-sm">📍 Tu ubicación actual</p>
                <p class="text-xs text-gray-600 mt-1">Radio de búsqueda: 10 km</p>
              </div>
            `)
            .openPopup()

          // Agregar círculo de radio (10km)
          const circle = L.circle([latitude, longitude], {
            color: '#3b82f6',
            fillColor: '#3b82f6',
            fillOpacity: 0.1,
            radius: 10000, // 10 km en metros
          }).addTo(mapInstanceRef.current)

          userLocationMarkerRef.current = userMarker
          userLocationCircleRef.current = circle

          // Centrar mapa en ubicación del usuario
          mapInstanceRef.current.setView([latitude, longitude], 13, {
            animate: true,
            duration: 1,
          })

          setIsLocating(false)
        },
        (error) => {
          console.error('Error getting location:', error)
          let message = 'No se pudo obtener tu ubicación. '
          
          switch (error.code) {
            case error.PERMISSION_DENIED:
              message += 'Permiso denegado. Activa los permisos de ubicación en tu navegador.'
              break
            case error.POSITION_UNAVAILABLE:
              message += 'Información de ubicación no disponible.'
              break
            case error.TIMEOUT:
              message += 'La solicitud expiró.'
              break
          }
          
          alert(message)
          setIsLocating(false)
        },
        {
          enableHighAccuracy: true,
          timeout: 10000,
          maximumAge: 0,
        }
      )
    } catch (error) {
      console.error('Geolocation error:', error)
      alert('Error al obtener ubicación')
      setIsLocating(false)
    }
  }

  return (
    <>
      <div className="relative w-full h-full">
        <div 
          ref={mapRef} 
          className="w-full h-full rounded-lg overflow-hidden"
          style={{ minHeight: '400px' }}
        />
        
        {/* Botón de Geolocalización */}
        <button
          onClick={handleGeolocation}
          disabled={isLocating}
          className="absolute top-4 right-4 z-[130] bg-white hover:bg-gray-50 disabled:bg-gray-100 text-gray-700 p-3 rounded-lg shadow-lg border border-gray-200 transition-all duration-200 hover:scale-105 disabled:cursor-not-allowed"
          title="Usar mi ubicación"
        >
          {isLocating ? (
            <svg className="w-5 h-5 animate-spin" fill="none" viewBox="0 0 24 24">
              <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
              <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
            </svg>
          ) : (
            <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 20 20">
              <path fillRule="evenodd" d="M5.05 4.05a7 7 0 119.9 9.9L10 18.9l-4.95-4.95a7 7 0 010-9.9zM10 11a2 2 0 100-4 2 2 0 000 4z" clipRule="evenodd" />
            </svg>
          )}
        </button>
      </div>
      
      <style jsx global>{`
        .custom-marker {
          background: transparent;
          border: none;
        }
        .user-location-marker {
          background: transparent;
          border: none;
        }
        .property-popup .leaflet-popup-content-wrapper {
          border-radius: 12px;
          box-shadow: 0 10px 25px rgba(0, 0, 0, 0.15);
        }
        .property-popup .leaflet-popup-content {
          margin: 0;
        }
        .property-popup .leaflet-popup-tip {
          background: white;
        }
      `}</style>
    </>
  )
}

export default MapView

import React, { useEffect, useRef, useState } from 'react'
import { PropertyResponse } from '../lib/api/properties'

interface MapFullscreenProps {
  listings: PropertyResponse[]
  onMarkerClick?: (propertyId: string) => void
  hoveredPropertyId?: string | null
  centerOnProperty?: string | null
  className?: string
  hideControls?: boolean // Para ocultar controles cuando bottom sheet está full
}

const MapFullscreen: React.FC<MapFullscreenProps> = ({ 
  listings, 
  onMarkerClick,
  hoveredPropertyId,
  centerOnProperty,
  className = '',
  hideControls = false
}) => {
  const mapRef = useRef<HTMLDivElement>(null)
  const mapInstanceRef = useRef<any>(null)
  const markersRef = useRef<Map<string, any>>(new Map())
  const userLocationMarkerRef = useRef<any>(null)
  const userLocationCircleRef = useRef<any>(null)
  const [isMapReady, setIsMapReady] = useState(false)
  const [isLocating, setIsLocating] = useState(false)

  // Inicializar mapa
  useEffect(() => {
    if (typeof window === 'undefined') return

    const loadLeaflet = async () => {
      const L = await import('leaflet')

      // Fix para iconos de Leaflet
      delete (L.Icon.Default.prototype as any)._getIconUrl
      L.Icon.Default.mergeOptions({
        iconRetinaUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-icon-2x.png',
        iconUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-icon.png',
        shadowUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-shadow.png',
      })

      if (mapRef.current && !mapInstanceRef.current) {
        const map = L.map(mapRef.current, {
          center: [-12.0464, -77.0428],
          zoom: 12,
          zoomControl: false, // Deshabilitado por defecto, se agrega después
          attributionControl: false, // Ocultar attribution en móvil
        })

        L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
          maxZoom: 18,
        }).addTo(map)

        // Agregar control de zoom en posición custom (top-left)
        L.control.zoom({
          position: 'topleft'
        }).addTo(map)

        mapInstanceRef.current = map
        setIsMapReady(true)
      }
    }

    loadLeaflet()

    return () => {
      if (mapInstanceRef.current) {
        mapInstanceRef.current.remove()
        mapInstanceRef.current = null
      }
    }
  }, [])

  // Ocultar/mostrar controles de zoom según hideControls
  useEffect(() => {
    if (!mapInstanceRef.current) return

    const zoomControl = document.querySelector('.leaflet-control-zoom')
    if (zoomControl) {
      (zoomControl as HTMLElement).style.display = hideControls ? 'none' : 'block'
    }
  }, [hideControls])

  // Cargar marcadores
  useEffect(() => {
    if (!isMapReady || !mapInstanceRef.current) return

    const loadMarkers = async () => {
      const L = await import('leaflet')

      markersRef.current.forEach(marker => marker.remove())
      markersRef.current.clear()

      const createPropertyIcon = (isHovered: boolean = false) => L.divIcon({
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

      const validListings = listings.filter(listing => 
        listing.latitude && listing.longitude
      )

      if (validListings.length === 0) return

      const bounds = L.latLngBounds([])

      validListings.forEach(listing => {
        const lat = Number(listing.latitude)
        const lng = Number(listing.longitude)

        if (isNaN(lat) || isNaN(lng)) return

        const marker = L.marker([lat, lng], { icon: createPropertyIcon(false) })
          .addTo(mapInstanceRef.current)

        marker.on('click', () => {
          if (onMarkerClick) {
            onMarkerClick(listing.id)
          }
        })

        const popupContent = `
          <div class="p-2 min-w-[180px]">
            <h3 class="font-semibold text-xs text-gray-900 mb-1">${listing.title || 'Propiedad'}</h3>
            <p class="text-xs font-bold text-blue-600">
              ${listing.currency} ${listing.price?.toLocaleString() || '0'} /mes
            </p>
          </div>
        `

        marker.bindPopup(popupContent, {
          maxWidth: 200,
          className: 'property-popup'
        })

        markersRef.current.set(listing.id, marker)
        bounds.extend([lat, lng])
      })

      if (validListings.length > 0) {
        mapInstanceRef.current.fitBounds(bounds, { padding: [50, 50] })
      }
    }

    loadMarkers()
  }, [isMapReady, listings, onMarkerClick])

  // Actualizar estilos en hover
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

  // Centrar en propiedad específica
  useEffect(() => {
    if (!isMapReady || !centerOnProperty) return

    const marker = markersRef.current.get(centerOnProperty)
    if (marker) {
      const latLng = marker.getLatLng()
      mapInstanceRef.current.setView(latLng, 15, {
        animate: true,
        duration: 0.5,
      })
      marker.openPopup()
    }
  }, [centerOnProperty, isMapReady])

  // Geolocalización
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
          
          if (userLocationMarkerRef.current) {
            userLocationMarkerRef.current.remove()
          }
          if (userLocationCircleRef.current) {
            userLocationCircleRef.current.remove()
          }

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

          const userMarker = L.marker([latitude, longitude], { icon: userIcon })
            .addTo(mapInstanceRef.current)
            .bindPopup(`
              <div class="text-center p-2">
                <p class="font-semibold text-sm">📍 Tu ubicación actual</p>
                <p class="text-xs text-gray-600 mt-1">Radio: 10 km</p>
              </div>
            `)
            .openPopup()

          const circle = L.circle([latitude, longitude], {
            color: '#3b82f6',
            fillColor: '#3b82f6',
            fillOpacity: 0.1,
            radius: 10000,
          }).addTo(mapInstanceRef.current)

          userLocationMarkerRef.current = userMarker
          userLocationCircleRef.current = circle

          mapInstanceRef.current.setView([latitude, longitude], 13, {
            animate: true,
            duration: 1,
          })

          setIsLocating(false)
        },
        (error) => {
          console.error('Error getting location:', error)
          alert('No se pudo obtener tu ubicación')
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
    <div className={`relative w-full h-full ${className}`}>
      <div ref={mapRef} className="w-full h-full" />
      
      {/* Botón de Geolocalización - Se oculta cuando hideControls es true */}
      {!hideControls && (
        <button
          onClick={handleGeolocation}
          disabled={isLocating}
          className="absolute top-4 right-4 z-[1000] bg-white hover:bg-gray-50 disabled:bg-gray-100 text-gray-700 p-3 rounded-full shadow-lg border border-gray-200 transition-all duration-200 active:scale-95 disabled:cursor-not-allowed"
          aria-label="Usar mi ubicación"
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
      )}

      <style jsx global>{`
        .custom-marker,
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
    </div>
  )
}

export default MapFullscreen

import React, { useEffect, useState } from 'react';
import { MapContainer, TileLayer, Marker, Popup } from 'react-leaflet';
import { PropertyResponse } from '../../lib/api/properties';
import { propertyIcon, propertyIconVerified } from '../../lib/utils/mapIcons';
import 'leaflet/dist/leaflet.css';

interface DesktopMapViewProps {
  listings: PropertyResponse[];
  onMarkerClick?: (listingId: string) => void;
  center?: [number, number];
  zoom?: number;
}

/**
 * Componente de mapa específico para la vista Desktop
 * Usa importaciones directas de react-leaflet (sin dynamic imports)
 * para mejor compatibilidad con el layout de desktop
 */
const DesktopMapView: React.FC<DesktopMapViewProps> = ({ 
  listings, 
  onMarkerClick,
  center = [-12.0464, -77.0428],
  zoom = 12 
}) => {
  const [mapCenter, setMapCenter] = useState<[number, number]>(center);
  const [mapZoom, setMapZoom] = useState(zoom);
  const [mounted, setMounted] = useState(false);

  // Esperar a que el componente esté montado en el cliente
  useEffect(() => {
    setMounted(true);
  }, []);

  // Calcular centro del mapa basado en las propiedades
  useEffect(() => {
    if (listings && listings.length > 0) {
      const listingsWithCoords = listings.filter(
        (listing) => listing.latitude && listing.longitude
      );

      if (listingsWithCoords.length > 0) {
        const avgLat =
          listingsWithCoords.reduce((sum, l) => sum + Number(l.latitude), 0) /
          listingsWithCoords.length;
        const avgLng =
          listingsWithCoords.reduce((sum, l) => sum + Number(l.longitude), 0) /
          listingsWithCoords.length;
        
        setMapCenter([avgLat, avgLng]);
        
        // Ajustar zoom según dispersión de puntos
        const latDiff = Math.abs(
          Math.max(...listingsWithCoords.map((l) => Number(l.latitude))) -
          Math.min(...listingsWithCoords.map((l) => Number(l.latitude)))
        );
        const lngDiff = Math.abs(
          Math.max(...listingsWithCoords.map((l) => Number(l.longitude))) -
          Math.min(...listingsWithCoords.map((l) => Number(l.longitude)))
        );
        
        const maxDiff = Math.max(latDiff, lngDiff);
        if (maxDiff > 0.5) setMapZoom(10);
        else if (maxDiff > 0.2) setMapZoom(11);
        else if (maxDiff > 0.1) setMapZoom(12);
        else if (maxDiff > 0.05) setMapZoom(13);
        else setMapZoom(14);
      }
    }
  }, [listings]);

  // No renderizar hasta que esté montado
  if (!mounted) {
    return (
      <div className="h-full bg-gray-100 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
          <p className="text-gray-600">Cargando mapa...</p>
        </div>
      </div>
    );
  }

  const listingsWithCoords = listings.filter(
    (listing) => listing.latitude && listing.longitude
  );

  if (listingsWithCoords.length === 0) {
    return (
      <div className="h-full bg-gray-100 flex items-center justify-center">
        <div className="text-center">
          <div className="w-16 h-16 mx-auto mb-4 bg-blue-100 rounded-full flex items-center justify-center">
            <svg className="w-8 h-8 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" />
            </svg>
          </div>
          <h3 className="text-lg font-semibold text-gray-700 mb-2">Sin ubicaciones</h3>
          <p className="text-gray-500 text-sm">No hay propiedades con coordenadas disponibles</p>
        </div>
      </div>
    );
  }

  return (
    <div className="h-full w-full">
      <MapContainer
        center={mapCenter}
        zoom={mapZoom}
        scrollWheelZoom={true}
        style={{ height: '100%', width: '100%' }}
        className="z-0"
      >
        <TileLayer
          attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>'
          url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
        />
        
        {listingsWithCoords.map((listing) => {
          const position: [number, number] = [
            Number(listing.latitude),
            Number(listing.longitude),
          ];

          const icon = listing.verification_status === 'verified' 
            ? propertyIconVerified 
            : propertyIcon;

          return (
            <Marker
              key={listing.id}
              position={position}
              icon={icon}
              eventHandlers={{
                click: () => onMarkerClick && onMarkerClick(listing.id),
              }}
            >
              <Popup>
                <div className="p-2 max-w-xs">
                  <h3 className="font-bold text-sm mb-1 line-clamp-2">{listing.title}</h3>
                  <p className="text-xs text-gray-600 mb-2">
                    {listing.district}{listing.district && listing.department && ', '}{listing.department}
                  </p>
                  <div className="flex items-baseline gap-1 mb-2">
                    <span className="text-lg font-bold text-blue-600">
                      {listing.currency === 'USD' ? '$' : 'S/'}
                      {Number(listing.price).toLocaleString('es-PE')}
                    </span>
                    <span className="text-xs text-gray-500">
                      {listing.operation === 'rent' ? '/ mes' : ''}
                    </span>
                  </div>
                  <div className="flex gap-3 text-xs text-gray-600">
                    {listing.bedrooms && <span>🛏️ {listing.bedrooms}</span>}
                    {listing.bathrooms && <span>🚿 {listing.bathrooms}</span>}
                    {listing.area_built && <span>📐 {listing.area_built}m²</span>}
                  </div>
                  <button
                    onClick={() => onMarkerClick && onMarkerClick(listing.id)}
                    className="mt-3 w-full bg-blue-600 hover:bg-blue-700 text-white text-xs font-medium py-1.5 px-3 rounded transition-colors"
                  >
                    Ver detalles
                  </button>
                </div>
              </Popup>
            </Marker>
          );
        })}
      </MapContainer>
    </div>
  );
};

export default DesktopMapView;

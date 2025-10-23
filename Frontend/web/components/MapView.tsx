import React, { useEffect, useState } from 'react';
import dynamic from 'next/dynamic';
import { PropertyResponse } from '../lib/api/properties';
import { propertyIcon, propertyIconVerified } from '../lib/utils/mapIcons';

// Importar Leaflet dinámicamente para evitar errores de SSR
const MapContainer = dynamic(
  () => import('react-leaflet').then((mod) => mod.MapContainer),
  { ssr: false }
);

const TileLayer = dynamic(
  () => import('react-leaflet').then((mod) => mod.TileLayer),
  { ssr: false }
);

const Marker = dynamic(
  () => import('react-leaflet').then((mod) => mod.Marker),
  { ssr: false }
);

const Popup = dynamic(
  () => import('react-leaflet').then((mod) => mod.Popup),
  { ssr: false }
);

interface MapViewProps {
  listings: PropertyResponse[];
  onMarkerClick?: (listingId: string) => void;
  center?: [number, number];
  zoom?: number;
}

const MapView: React.FC<MapViewProps> = ({ 
  listings, 
  onMarkerClick,
  center = [-12.0464, -77.0428], // Centro por defecto: Lima, Perú
  zoom = 12 
}) => {
  const [isClient, setIsClient] = useState(false);
  const [mapCenter, setMapCenter] = useState<[number, number]>(center);
  const [mapZoom, setMapZoom] = useState(zoom);

  useEffect(() => {
    setIsClient(true);
  }, []);

  useEffect(() => {
    // Calcular el centro del mapa basado en los listings con coordenadas
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
        
        // Ajustar zoom según la dispersión de los puntos
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

  // No renderizar en el servidor
  if (!isClient) {
    return (
      <div className="h-full bg-gray-100 rounded-lg flex items-center justify-center">
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
      <div className="h-full bg-gray-100 rounded-lg flex items-center justify-center">
        <div className="text-center">
          <div className="w-16 h-16 mx-auto mb-4 bg-blue-100 rounded-full flex items-center justify-center">
            <svg
              className="w-8 h-8 text-blue-600"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z"
              />
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M15 11a3 3 0 11-6 0 3 3 0 016 0z"
              />
            </svg>
          </div>
          <h3 className="text-lg font-semibold text-gray-700 mb-2">Sin ubicaciones</h3>
          <p className="text-gray-500 text-sm max-w-xs mx-auto">
            No hay propiedades con coordenadas geográficas disponibles
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="h-full w-full rounded-lg overflow-hidden">
      <MapContainer
        center={mapCenter}
        zoom={mapZoom}
        scrollWheelZoom={true}
        style={{ height: '100%', width: '100%' }}
        className="z-0"
      >
        <TileLayer
          attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
          url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
        />
        
        {listingsWithCoords.map((listing) => {
          const position: [number, number] = [
            Number(listing.latitude),
            Number(listing.longitude),
          ];

          // Seleccionar icono según verificación
          const icon = listing.verification_status === 'verified' 
            ? propertyIconVerified 
            : propertyIcon;

          return (
            <Marker
              key={listing.id}
              position={position}
              icon={icon}
              eventHandlers={{
                click: () => {
                  if (onMarkerClick) {
                    onMarkerClick(listing.id);
                  }
                },
              }}
            >
              <Popup>
                <div className="p-2 max-w-xs">
                  <h3 className="font-bold text-sm mb-1 line-clamp-2">
                    {listing.title}
                  </h3>
                  <p className="text-xs text-gray-600 mb-2">
                    {listing.district && listing.district}{listing.district && listing.department && ', '}
                    {listing.department && listing.department}
                  </p>
                  <div className="flex items-baseline gap-1 mb-2">
                    <span className="text-lg font-bold text-blue-600">
                      {listing.currency === 'USD' ? '$' : 'S/'}
                      {Number(listing.price).toLocaleString('es-PE', {
                        minimumFractionDigits: 0,
                        maximumFractionDigits: 0,
                      })}
                    </span>
                    <span className="text-xs text-gray-500">
                      {listing.operation === 'rent' ? '/ mes' : ''}
                    </span>
                  </div>
                  <div className="flex gap-3 text-xs text-gray-600">
                    {listing.bedrooms && (
                      <span className="flex items-center gap-1">
                        🛏️ {listing.bedrooms}
                      </span>
                    )}
                    {listing.bathrooms && (
                      <span className="flex items-center gap-1">
                        🚿 {listing.bathrooms}
                      </span>
                    )}
                    {listing.area_built && (
                      <span className="flex items-center gap-1">
                        📐 {listing.area_built}m²
                      </span>
                    )}
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

export default MapView;

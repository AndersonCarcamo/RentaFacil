import React, { useEffect, useState } from 'react';
import dynamic from 'next/dynamic';

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

interface PropertyMapProps {
  latitude: number;
  longitude: number;
  address?: string;
}

const PropertyMap: React.FC<PropertyMapProps> = ({ latitude, longitude, address }) => {
  const [isClient, setIsClient] = useState(false);

  useEffect(() => {
    setIsClient(true);
  }, []);

  // No renderizar en el servidor
  if (!isClient) {
    return (
      <div className="h-full bg-gray-100 rounded-lg flex items-center justify-center">
        <p className="text-gray-600 text-sm">Cargando mapa...</p>
      </div>
    );
  }

  const position: [number, number] = [latitude, longitude];

  return (
    <div className="h-full w-full">
      <MapContainer
        center={position}
        zoom={15}
        scrollWheelZoom={false}
        style={{ height: '100%', width: '100%', borderRadius: '0.5rem' }}
        className="z-0"
      >
        <TileLayer
          attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
          url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
        />
        <Marker position={position}>
          {address && (
            <Popup>
              <div className="text-sm">
                <p className="font-semibold mb-1">Ubicación de la propiedad</p>
                <p className="text-gray-600">{address}</p>
              </div>
            </Popup>
          )}
        </Marker>
      </MapContainer>
    </div>
  );
};

export default PropertyMap;

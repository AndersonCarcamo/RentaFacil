'use client';

import { useEffect, useRef } from 'react';
import L from 'leaflet';
import 'leaflet/dist/leaflet.css';

// Fix para los iconos de Leaflet en Next.js
delete (L.Icon.Default.prototype as any)._getIconUrl;
L.Icon.Default.mergeOptions({
  iconRetinaUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon-2x.png',
  iconUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon.png',
  shadowUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-shadow.png',
});

interface MapPickerProps {
  latitude: number | null;
  longitude: number | null;
  onLocationChange: (latitude: number, longitude: number) => void;
  className?: string;
  height?: string;
}

/**
 * Componente de mapa interactivo para seleccionar ubicación
 * Permite al usuario hacer clic en el mapa para establecer coordenadas
 */
export default function MapPicker({
  latitude,
  longitude,
  onLocationChange,
  className = '',
  height = '400px',
}: MapPickerProps) {
  const mapRef = useRef<L.Map | null>(null);
  const markerRef = useRef<L.Marker | null>(null);
  const containerRef = useRef<HTMLDivElement>(null);

  // Coordenadas por defecto: Centro de Lima
  const defaultLat = latitude || -12.0464;
  const defaultLng = longitude || -77.0428;

  useEffect(() => {
    if (!containerRef.current) return;

    // Limpiar mapa existente
    if (mapRef.current) {
      mapRef.current.remove();
      mapRef.current = null;
    }

    // Crear mapa
    const map = L.map(containerRef.current).setView([defaultLat, defaultLng], 13);

    // Añadir capa de OpenStreetMap
    L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
      attribution: '© OpenStreetMap contributors',
      maxZoom: 19,
    }).addTo(map);

    // Añadir marcador inicial si hay coordenadas
    if (latitude && longitude) {
      const marker = L.marker([latitude, longitude], {
        draggable: true,
      }).addTo(map);

      marker.on('dragend', () => {
        const position = marker.getLatLng();
        onLocationChange(position.lat, position.lng);
      });

      markerRef.current = marker;
    }

    // Click en el mapa para añadir/mover marcador
    map.on('click', (e: L.LeafletMouseEvent) => {
      const { lat, lng } = e.latlng;

      if (markerRef.current) {
        // Mover marcador existente
        markerRef.current.setLatLng([lat, lng]);
      } else {
        // Crear nuevo marcador
        const marker = L.marker([lat, lng], {
          draggable: true,
        }).addTo(map);

        marker.on('dragend', () => {
          const position = marker.getLatLng();
          onLocationChange(position.lat, position.lng);
        });

        markerRef.current = marker;
      }

      onLocationChange(lat, lng);
    });

    mapRef.current = map;

    // Cleanup
    return () => {
      if (mapRef.current) {
        mapRef.current.remove();
        mapRef.current = null;
      }
    };
  }, []); // Solo ejecutar una vez al montar

  // Actualizar posición del marcador cuando cambian las coordenadas externas
  useEffect(() => {
    if (!mapRef.current || !latitude || !longitude) return;

    if (markerRef.current) {
      markerRef.current.setLatLng([latitude, longitude]);
      mapRef.current.setView([latitude, longitude], 15);
    } else {
      const marker = L.marker([latitude, longitude], {
        draggable: true,
      }).addTo(mapRef.current);

      marker.on('dragend', () => {
        const position = marker.getLatLng();
        onLocationChange(position.lat, position.lng);
      });

      markerRef.current = marker;
      mapRef.current.setView([latitude, longitude], 15);
    }
  }, [latitude, longitude]);

  return (
    <div className={className}>
      <div
        ref={containerRef}
        style={{ height, width: '100%' }}
        className="rounded-lg border border-gray-300 shadow-sm"
      />
      <div className="mt-2 flex items-center gap-2 text-xs text-gray-600">
        <span className="inline-flex h-5 w-5 items-center justify-center rounded-full bg-blue-100 text-blue-600">
          💡
        </span>
        <span>
          Haz clic en el mapa o arrastra el marcador para ajustar la ubicación exacta
        </span>
      </div>
    </div>
  );
}

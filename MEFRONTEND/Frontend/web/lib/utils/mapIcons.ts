import L from 'leaflet';

// Solo ejecutar en el cliente (evitar SSR)
if (typeof window !== 'undefined') {
  // Fix para los iconos por defecto de Leaflet en Next.js
  delete (L.Icon.Default.prototype as any)._getIconUrl;

  L.Icon.Default.mergeOptions({
    iconRetinaUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon-2x.png',
    iconUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon.png',
    shadowUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-shadow.png',
  });
}

// Icono personalizado para propiedades
export const propertyIcon = new L.Icon({
  iconUrl: 'data:image/svg+xml;base64,' + btoa(`
    <svg width="32" height="42" viewBox="0 0 32 42" xmlns="http://www.w3.org/2000/svg">
      <path d="M16 0C7.163 0 0 7.163 0 16c0 8.837 16 26 16 26s16-17.163 16-26C32 7.163 24.837 0 16 0z" 
            fill="#2563eb" stroke="#1e40af" stroke-width="2"/>
      <circle cx="16" cy="16" r="6" fill="white"/>
    </svg>
  `),
  iconSize: [32, 42],
  iconAnchor: [16, 42],
  popupAnchor: [0, -42],
  shadowUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-shadow.png',
  shadowSize: [41, 41],
  shadowAnchor: [12, 41],
});

// Icono para propiedad seleccionada
export const propertyIconSelected = new L.Icon({
  iconUrl: 'data:image/svg+xml;base64,' + btoa(`
    <svg width="38" height="50" viewBox="0 0 38 50" xmlns="http://www.w3.org/2000/svg">
      <path d="M19 0C8.507 0 0 8.507 0 19c0 10.493 19 31 19 31s19-20.507 19-31C38 8.507 29.493 0 19 0z" 
            fill="#dc2626" stroke="#991b1b" stroke-width="2"/>
      <circle cx="19" cy="19" r="7" fill="white"/>
    </svg>
  `),
  iconSize: [38, 50],
  iconAnchor: [19, 50],
  popupAnchor: [0, -50],
  shadowUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-shadow.png',
  shadowSize: [41, 41],
  shadowAnchor: [12, 41],
});

// Icono para propiedad verificada
export const propertyIconVerified = new L.Icon({
  iconUrl: 'data:image/svg+xml;base64,' + btoa(`
    <svg width="32" height="42" viewBox="0 0 32 42" xmlns="http://www.w3.org/2000/svg">
      <path d="M16 0C7.163 0 0 7.163 0 16c0 8.837 16 26 16 26s16-17.163 16-26C32 7.163 24.837 0 16 0z" 
            fill="#16a34a" stroke="#15803d" stroke-width="2"/>
      <path d="M12 16l3 3 6-6" stroke="white" stroke-width="2" fill="none" stroke-linecap="round" stroke-linejoin="round"/>
    </svg>
  `),
  iconSize: [32, 42],
  iconAnchor: [16, 42],
  popupAnchor: [0, -42],
  shadowUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-shadow.png',
  shadowSize: [41, 41],
  shadowAnchor: [12, 41],
});

// Icono para cluster de propiedades
export const createClusterIcon = (count: number) => {
  const size = count < 10 ? 40 : count < 100 ? 50 : 60;
  
  return new L.DivIcon({
    html: `
      <div style="
        background: linear-gradient(135deg, #2563eb 0%, #1e40af 100%);
        color: white;
        width: ${size}px;
        height: ${size}px;
        border-radius: 50%;
        display: flex;
        align-items: center;
        justify-content: center;
        font-weight: bold;
        font-size: ${count < 100 ? '16px' : '14px'};
        box-shadow: 0 4px 6px rgba(0, 0, 0, 0.3);
        border: 3px solid white;
      ">
        ${count}
      </div>
    `,
    className: 'custom-cluster-icon',
    iconSize: [size, size],
  });
};

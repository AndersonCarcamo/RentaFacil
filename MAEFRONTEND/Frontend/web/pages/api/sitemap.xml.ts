import { NextApiRequest, NextApiResponse } from 'next';

const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000';
const SITE_URL = process.env.NEXT_PUBLIC_SITE_URL || 'http://localhost:3000';

interface Listing {
  id: number;
  updated_at: string;
}

// Búsquedas populares para incluir en el sitemap
const popularSearches = [
  // Alquiler de departamentos
  { operation: 'alquiler', propertyType: 'departamento', location: 'surco' },
  { operation: 'alquiler', propertyType: 'departamento', location: 'san-isidro' },
  { operation: 'alquiler', propertyType: 'departamento', location: 'miraflores' },
  { operation: 'alquiler', propertyType: 'departamento', location: 'san-borja' },
  { operation: 'alquiler', propertyType: 'departamento', location: 'la-molina' },
  { operation: 'alquiler', propertyType: 'departamento', location: 'barranco' },
  { operation: 'alquiler', propertyType: 'departamento', location: 'jesus-maria' },
  { operation: 'alquiler', propertyType: 'departamento', location: 'lince' },
  { operation: 'alquiler', propertyType: 'departamento', location: 'magdalena' },
  { operation: 'alquiler', propertyType: 'departamento', location: 'pueblo-libre' },
  
  // Alquiler de casas
  { operation: 'alquiler', propertyType: 'casa', location: 'surco' },
  { operation: 'alquiler', propertyType: 'casa', location: 'la-molina' },
  { operation: 'alquiler', propertyType: 'casa', location: 'san-borja' },
  
  // Venta de departamentos
  { operation: 'venta', propertyType: 'departamento', location: 'surco' },
  { operation: 'venta', propertyType: 'departamento', location: 'san-isidro' },
  { operation: 'venta', propertyType: 'departamento', location: 'miraflores' },
  { operation: 'venta', propertyType: 'departamento', location: 'san-borja' },
  { operation: 'venta', propertyType: 'departamento', location: 'la-molina' },
  
  // Venta de casas
  { operation: 'venta', propertyType: 'casa', location: 'surco' },
  { operation: 'venta', propertyType: 'casa', location: 'la-molina' },
  { operation: 'venta', propertyType: 'casa', location: 'san-borja' },
  
  // Alquiler temporal
  { operation: 'alquiler-temporal', propertyType: 'departamento', location: 'miraflores' },
  { operation: 'alquiler-temporal', propertyType: 'departamento', location: 'barranco' },
  { operation: 'alquiler-temporal', propertyType: 'departamento', location: 'san-isidro' },
  
  // Oficinas
  { operation: 'alquiler', propertyType: 'oficina', location: 'san-isidro' },
  { operation: 'alquiler', propertyType: 'oficina', location: 'miraflores' },
  { operation: 'alquiler', propertyType: 'oficina', location: 'surco' },
];

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  try {
    // 1. Fetch all published listings
    let listings: Listing[] = [];
    try {
      const response = await fetch(`${API_URL}/v1/listings/search?status=published&limit=10000`);
      if (response.ok) {
        const data = await response.json();
        listings = data.data || [];
      }
    } catch (error) {
      console.error('Error fetching listings for sitemap:', error);
      // Continuar con sitemap parcial si falla la API
    }

    const currentDate = new Date().toISOString();

    // 2. Build XML sitemap
    const sitemap = `<?xml version="1.0" encoding="UTF-8"?>
<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9"
        xmlns:news="http://www.google.com/schemas/sitemap-news/0.9"
        xmlns:xhtml="http://www.w3.org/1999/xhtml"
        xmlns:image="http://www.google.com/schemas/sitemap-image/1.1">
  
  <!-- Homepage -->
  <url>
    <loc>${SITE_URL}</loc>
    <lastmod>${currentDate}</lastmod>
    <changefreq>daily</changefreq>
    <priority>1.0</priority>
  </url>
  
  <!-- Search page -->
  <url>
    <loc>${SITE_URL}/search</loc>
    <lastmod>${currentDate}</lastmod>
    <changefreq>hourly</changefreq>
    <priority>0.9</priority>
  </url>
  
  <!-- Popular search pages -->
${popularSearches.map(search => `  <url>
    <loc>${SITE_URL}/${search.operation}/${search.propertyType}/${search.location}</loc>
    <lastmod>${currentDate}</lastmod>
    <changefreq>daily</changefreq>
    <priority>0.8</priority>
  </url>`).join('\n')}
  
  <!-- Individual property pages -->
${listings.map(listing => `  <url>
    <loc>${SITE_URL}/property/${listing.id}</loc>
    <lastmod>${listing.updated_at || currentDate}</lastmod>
    <changefreq>weekly</changefreq>
    <priority>0.7</priority>
  </url>`).join('\n')}

</urlset>`;

    // 3. Set headers for XML
    res.setHeader('Content-Type', 'application/xml');
    res.setHeader('Cache-Control', 'public, s-maxage=3600, stale-while-revalidate=86400');
    res.status(200).send(sitemap);
  } catch (error) {
    console.error('Error generating sitemap:', error);
    res.status(500).send('Error generating sitemap');
  }
}

import React, { useEffect } from 'react';
import Head from 'next/head';
import { GetStaticPaths, GetStaticProps } from 'next';
import { useRouter } from 'next/router';
import SearchPage from '../../search';

interface SearchSEOPageProps {
  operation: string;
  propertyType: string;
  location: string;
  metadata: {
    title: string;
    description: string;
    canonical: string;
    h1: string;
    keywords: string;
  };
}

export default function SearchSEOPage({ operation, propertyType, location, metadata }: SearchSEOPageProps) {
  const router = useRouter();

  // Mapear operación a formato de API
  const operationMap: { [key: string]: string } = {
    'alquiler': 'rent',
    'venta': 'sale',
    'alquiler-temporal': 'temp_rent'
  };

  // Mapear tipo de propiedad a formato de API
  const propertyTypeMap: { [key: string]: string } = {
    'departamento': 'apartment',
    'departamentos': 'apartment',
    'apartment': 'apartment',
    'casa': 'house',
    'casas': 'house',
    'house': 'house',
    'oficina': 'office',
    'oficinas': 'office',
    'office': 'office',
    'habitacion': 'room',
    'habitaciones': 'room',
    'room': 'room',
    'studio': 'studio',
    'studios': 'studio',
    'local-comercial': 'commercial',
    'terreno': 'land',
    'terrenos': 'land',
    'TipoAirbnb': 'room' // ✨ Mapeo especial para Tipo Airbnb
  };

  const apiOperation = operationMap[operation] || 'rent';
  const apiPropertyType = propertyTypeMap[propertyType] || propertyType;
  const locationFormatted = location.split('-').map((w: string) => 
    w.charAt(0).toUpperCase() + w.slice(1)
  ).join(' ');

  // Filtros iniciales para SearchPage
  const initialFilters = {
    operation: apiOperation,
    property_type: apiPropertyType,
    location: locationFormatted
  };

  // Datos estructurados para búsqueda
  const structuredData = {
    "@context": "https://schema.org",
    "@type": "WebPage",
    "name": metadata.title,
    "description": metadata.description,
    "url": metadata.canonical,
    "mainEntity": {
      "@type": "ItemList",
      "name": metadata.h1,
      "description": metadata.description,
      "numberOfItems": 0,  // Se actualizará dinámicamente
      "itemListElement": []
    }
  };

  // Breadcrumb Schema
  const breadcrumbSchema = {
    "@context": "https://schema.org",
    "@type": "BreadcrumbList",
    "itemListElement": [
      {
        "@type": "ListItem",
        "position": 1,
        "name": "Inicio",
        "item": process.env.NEXT_PUBLIC_SITE_URL || 'https://rentafacil.com'
      },
      {
        "@type": "ListItem",
        "position": 2,
        "name": operation === 'alquiler' ? 'Alquiler' : operation === 'venta' ? 'Venta' : 'Alquiler Temporal',
        "item": `${process.env.NEXT_PUBLIC_SITE_URL || 'https://rentafacil.com'}/${operation}`
      },
      {
        "@type": "ListItem",
        "position": 3,
        "name": locationFormatted,
        "item": metadata.canonical
      }
    ]
  };

  return (
    <>
      <Head>
        {/* Meta tags básicos SEO */}
        <title>{metadata.title}</title>
        <meta name="description" content={metadata.description} />
        <link rel="canonical" href={metadata.canonical} />
        <meta name="keywords" content={metadata.keywords} />
        
        {/* Open Graph para redes sociales */}
        <meta property="og:title" content={metadata.title} />
        <meta property="og:description" content={metadata.description} />
        <meta property="og:type" content="website" />
        <meta property="og:url" content={metadata.canonical} />
        <meta property="og:site_name" content="RentaFácil" />
        <meta property="og:locale" content="es_PE" />
        
        {/* Twitter Card */}
        <meta name="twitter:card" content="summary_large_image" />
        <meta name="twitter:title" content={metadata.title} />
        <meta name="twitter:description" content={metadata.description} />
        
        {/* Datos estructurados JSON-LD */}
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{ __html: JSON.stringify(structuredData) }}
        />
        
        {/* Breadcrumb Schema */}
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{ __html: JSON.stringify(breadcrumbSchema) }}
        />
        
        {/* Meta tags adicionales */}
        <meta name="robots" content="index, follow" />
        <meta name="author" content="RentaFácil" />
        <meta name="geo.region" content="PE-LIM" />
        <meta name="geo.placename" content={locationFormatted} />
        
        {/* Alternativas de idioma (si tienes versión en inglés) */}
        <link rel="alternate" hrefLang="es-pe" href={metadata.canonical} />
      </Head>

      {/* H1 oculto para SEO (el SearchPage ya tiene su propio header) */}
      <h1 className="sr-only">{metadata.h1}</h1>

      {/* Reutilizar componente de búsqueda actual con filtros pre-cargados */}
      <SearchPage initialFilters={initialFilters} />
    </>
  );
}

// Pre-renderizar las búsquedas más populares (SSG)
export const getStaticPaths: GetStaticPaths = async () => {
  // Top 50 búsquedas más populares en Lima, Perú
  const popularSearches = [
    // Búsquedas desde el header (genéricas por ciudad)
    { operation: 'alquiler', propertyType: 'apartment', location: 'lima' },
    { operation: 'alquiler', propertyType: 'house', location: 'lima' },
    { operation: 'alquiler', propertyType: 'room', location: 'lima' },
    { operation: 'alquiler-temporal', propertyType: 'apartment', location: 'lima' },
    
    // Alquiler de departamentos por distrito
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
    { operation: 'alquiler', propertyType: 'casa', location: 'ate' },
    { operation: 'alquiler', propertyType: 'casa', location: 'los-olivos' },
    
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

  const paths = popularSearches.map(search => ({
    params: search
  }));

  return {
    paths,
    fallback: 'blocking' // Genera páginas bajo demanda para búsquedas menos comunes
  };
};

export const getStaticProps: GetStaticProps = async ({ params }) => {
  const { operation, propertyType, location } = params as any;
  
  // Generar metadata SEO optimizada
  const operationText = 
    operation === 'alquiler' ? 'Alquiler de' : 
    operation === 'venta' ? 'Venta de' : 
    operation === 'alquiler-temporal' ? 'Alquiler Temporal de' :
    'Alquiler de';
  
  const propertyText = 
    propertyType === 'departamento' || propertyType === 'departamentos' ? 'Departamentos' :
    propertyType === 'casa' || propertyType === 'casas' ? 'Casas' :
    propertyType === 'oficina' || propertyType === 'oficinas' ? 'Oficinas' :
    propertyType === 'habitacion' || propertyType === 'habitaciones' ? 'Habitaciones' :
    propertyType === 'studio' || propertyType === 'studios' ? 'Studios' :
    propertyType.charAt(0).toUpperCase() + propertyType.slice(1);
  
  const locationText = location.split('-').map((w: string) => 
    w.charAt(0).toUpperCase() + w.slice(1)
  ).join(' ');

  const h1 = `${operationText} ${propertyText} en ${locationText}`;
  const title = `${h1} 2025 - RentaFácil`;
  const description = `Encuentra los mejores ${propertyText.toLowerCase()} en ${operation} en ${locationText}. Propiedades verificadas, fotos reales, contacto directo con propietarios. ¡Publica gratis!`;
  
  // Keywords optimizados
  const keywords = `${propertyText.toLowerCase()} ${operation} ${locationText.toLowerCase()}, inmuebles ${locationText.toLowerCase()}, propiedades ${locationText.toLowerCase()}, ${operation} ${locationText.toLowerCase()}, ${propertyText.toLowerCase()} ${locationText.toLowerCase()}`;

  const siteUrl = process.env.NEXT_PUBLIC_SITE_URL || 'http://localhost:3000';
  const metadata = {
    title,
    description,
    canonical: `${siteUrl}/${operation}/${propertyType}/${location}`,
    h1,
    keywords
  };

  return {
    props: {
      operation,
      propertyType,
      location,
      metadata
    },
    revalidate: 3600 // Re-generar cada hora (ISR - Incremental Static Regeneration)
  };
};

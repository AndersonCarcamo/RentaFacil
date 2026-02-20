import React, { useEffect, useState, useRef } from 'react';
import { useRouter } from 'next/router';
import Head from 'next/head';
import { GetServerSideProps } from 'next';
import PropertyModal from '../../components/property/PropertyModal';
import { PropertyResponse } from '../../lib/api/properties';
import { analyticsService } from '../../services/analyticsService';

interface PropertyPageProps {
  property: PropertyResponse | null;
  error?: string;
}

const PropertyPage: React.FC<PropertyPageProps> = ({ property, error }) => {
  const router = useRouter();
  const [isModalOpen, setIsModalOpen] = useState(true);
  const hasTrackedView = useRef(false);
  
  // Obtener el slug desde la URL
  const { slug } = router.query;

  useEffect(() => {
    if (!isModalOpen) {
      // Cuando se cierra el modal, volver a la búsqueda
      router.push('/search');
    }
  }, [isModalOpen, router]);

  // Registrar vista al cargar la propiedad (con throttle de 5 segundos)
  useEffect(() => {
    if (property?.id) {
      const now = Date.now();
      const lastViewKey = `last_view_${property.id}`;
      const lastViewTime = sessionStorage.getItem(lastViewKey);
      
      // Solo prevenir si fue vista hace menos de 5 segundos (protege contra doble mount)
      if (!lastViewTime || now - parseInt(lastViewTime) > 5000) {
        sessionStorage.setItem(lastViewKey, now.toString());
        analyticsService.trackView(property.id);
      }
    }
  }, [property?.id]);

  if (error || !property) {
    return (
      <>
        <Head>
          <title>Propiedad no encontrada - EasyRent</title>
        </Head>
        <div className="min-h-screen flex items-center justify-center bg-gray-50">
          <div className="text-center">
            <h1 className="text-4xl font-bold text-gray-900 mb-4">
              Propiedad no encontrada
            </h1>
            <p className="text-gray-600 mb-8">
              {error || 'La propiedad que buscas no existe o ya no está disponible.'}
            </p>
            <button
              onClick={() => router.push('/search')}
              className="px-6 py-3 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 transition-colors"
            >
              Volver a búsqueda
            </button>
          </div>
        </div>
      </>
    );
  }

  // Meta tags para SEO y redes sociales
  const pageTitle = `${property.title} - ${property.district}, ${property.department}`;
  const pageDescription = property.description 
    ? property.description.substring(0, 160) + '...'
    : `${property.property_type} en ${property.operation === 'rent' ? 'alquiler' : 'venta'} en ${property.district}. ${property.bedrooms || 0} dorm, ${property.bathrooms || 0} baños, ${property.area_built || property.area_total || 0}m². ${property.currency} ${property.price.toLocaleString()}`;
  
  // Obtener la primera imagen para Open Graph
  const ogImage = property.images && property.images.length > 0
    ? (property.images[0].medium_url || property.images[0].original_url || property.images[0].url)
    : `${process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000'}/images/og-default.jpg`;

  // Usar el slug de la URL para garantizar consistencia
  const canonicalUrl = `${process.env.NEXT_PUBLIC_SITE_URL || 'https://easyrent.pe'}/propiedad/${slug}`;

  return (
    <>
      <Head>
        {/* Meta tags básicos */}
        <title>{pageTitle}</title>
        <meta name="description" content={pageDescription} />
        <link rel="canonical" href={canonicalUrl} />

        {/* Open Graph para Facebook */}
        <meta property="og:type" content="website" />
        <meta property="og:url" content={canonicalUrl} />
        <meta property="og:title" content={pageTitle} />
        <meta property="og:description" content={pageDescription} />
        <meta property="og:image" content={ogImage} />
        <meta property="og:site_name" content="EasyRent" />
        <meta property="og:locale" content="es_PE" />

        {/* Twitter Cards */}
        <meta name="twitter:card" content="summary_large_image" />
        <meta name="twitter:url" content={canonicalUrl} />
        <meta name="twitter:title" content={pageTitle} />
        <meta name="twitter:description" content={pageDescription} />
        <meta name="twitter:image" content={ogImage} />

        {/* Datos estructurados JSON-LD para Google */}
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{
            __html: JSON.stringify({
              "@context": "https://schema.org",
              "@type": property.operation === 'rent' ? "Apartment" : "RealEstateListing",
              "name": property.title,
              "description": property.description,
              "url": canonicalUrl,
              "image": ogImage,
              "address": {
                "@type": "PostalAddress",
                "addressLocality": property.district,
                "addressRegion": property.department,
                "addressCountry": "PE"
              },
              "geo": property.latitude && property.longitude ? {
                "@type": "GeoCoordinates",
                "latitude": property.latitude,
                "longitude": property.longitude
              } : undefined,
              "numberOfRooms": property.bedrooms,
              "numberOfBathroomsTotal": property.bathrooms,
              "floorSize": {
                "@type": "QuantitativeValue",
                "value": property.area_built || property.area_total,
                "unitCode": "MTK"
              },
              "offers": {
                "@type": "Offer",
                "price": property.price,
                "priceCurrency": property.currency,
                "availability": property.status === 'published' ? "https://schema.org/InStock" : "https://schema.org/OutOfStock"
              }
            })
          }}
        />
      </Head>

      {/* Mostrar modal con los datos de la propiedad */}
      <PropertyModal
        propertyId={property.id}
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        propertyData={property}
      />
    </>
  );
};

export const getServerSideProps: GetServerSideProps = async (context) => {
  const { slug } = context.params as { slug: string };
  const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000';

  try {
    // Primero intentar obtener por slug
    let response = await fetch(`${API_BASE_URL}/v1/listings/by-slug/${slug}`, {
      headers: {
        'Accept': 'application/json',
      },
    });

    // Si no existe endpoint de slug, intentar obtener por ID
    if (!response.ok && slug.length === 36) { // UUID format
      response = await fetch(`${API_BASE_URL}/v1/listings/${slug}`, {
        headers: {
          'Accept': 'application/json',
        },
      });
    }

    if (!response.ok) {
      return {
        props: {
          property: null,
          error: 'Propiedad no encontrada'
        }
      };
    }

    const property: PropertyResponse = await response.json();

    return {
      props: {
        property
      }
    };
  } catch (error) {
    console.error('Error fetching property:', error);
    return {
      props: {
        property: null,
        error: 'Error al cargar la propiedad'
      }
    };
  }
};

export default PropertyPage;

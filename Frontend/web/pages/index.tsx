import { NextPage } from 'next'
import Head from 'next/head'
import Link from 'next/link'
import Image from 'next/image'
import { useState, useEffect } from 'react'
import { 
  MagnifyingGlassIcon, 
  HomeIcon, 
  BuildingOfficeIcon,
  MapPinIcon,
  StarIcon,
  ArrowRightIcon,
  CheckCircleIcon,
  HeartIcon,
  EyeIcon,
  ShieldCheckIcon,
  ChatBubbleLeftRightIcon,
  BoltIcon
} from '@heroicons/react/24/outline'

// Componentes
import Layout from '@/components/Layout'
import SearchForm from '@/components/SearchForm'
import PropertyCard from '@/components/PropertyCard'
import { Button } from '@/components/ui/Button'

// API and Hooks
import { fetchProperties, PropertyResponse } from '@/lib/api/properties'

// Types
import { Property } from '@/types'

// Función para formateo consistente de números
const formatNumber = (num: number): string => {
  return num.toString().replace(/\B(?=(\d{3})+(?!\d))/g, ',')
}

// Función para convertir PropertyResponse a Property (para compatibilidad)
const convertToProperty = (apiProperty: PropertyResponse): Property => {
  return {
    id: apiProperty.id,
    title: apiProperty.title,
    description: apiProperty.description || 'Propiedad disponible',
    price: Number(apiProperty.price),
    currency: apiProperty.currency,
    location: `${apiProperty.district || ''}, ${apiProperty.department || ''}`.replace(/^,\s*/, ''),
    bedrooms: apiProperty.bedrooms || 0,
    bathrooms: apiProperty.bathrooms || 0,
    area: Number(apiProperty.area_built || apiProperty.area_total || 0),
    images: ['/images/properties/property-placeholder.svg'], // Placeholder hasta que tengamos media API
    amenities: [
      ...(apiProperty.furnished ? ['Amoblado'] : ['Sin amoblar']),
      ...(apiProperty.parking_spots ? [`${apiProperty.parking_spots} estacionamiento(s)`] : []),
      ...(apiProperty.pet_friendly ? ['Pet Friendly'] : []),
      ...(apiProperty.is_airbnb_available ? ['Apto Airbnb'] : [])
    ].slice(0, 3), // Máximo 3 amenities
    rating: parseFloat((4.5 + (Math.random() * 0.5)).toFixed(2)), // Rating simulado entre 4.5-5.0 con 2 decimales
    reviews: Math.floor(Math.random() * 50) + 10, // Reviews simuladas 10-60
    isVerified: apiProperty.verification_status === 'verified',
    isFavorite: false,
    views: apiProperty.views_count
  }
}

const HomePage: NextPage = () => {
  const [searchQuery, setSearchQuery] = useState('')
  const [isLoading, setIsLoading] = useState(false)
  const [featuredProperties, setFeaturedProperties] = useState<Property[]>([])
  const [propertiesLoading, setPropertiesLoading] = useState(true)
  const [currentSlide, setCurrentSlide] = useState(0)
  
  // Estadísticas para mostrar
  const [stats, setStats] = useState({
    totalProperties: 0,
    happyClients: 0,
    yearsExperience: 0
  })

  // Cargar propiedades destacadas desde el backend
  useEffect(() => {
    const loadFeaturedProperties = async () => {
      try {
        console.log('🏠 Iniciando carga de propiedades destacadas...')
        setPropertiesLoading(true)
        
        // Obtener propiedades publicadas sin filtros complejos
        const apiProperties = await fetchProperties({
          page: 1,
          limit: 6 // Mostrar 6 propiedades destacadas
        })
        
        console.log('🏠 API Properties recibidas:', apiProperties.length)
        console.log('🏠 Muestra de propiedades:', apiProperties.slice(0, 2))
        
        // Convertir a formato compatible con el componente existente
        const properties = apiProperties.map(convertToProperty)
        console.log('🏠 Properties convertidas:', properties.length)
        
        // Ordenar por puntuación de mayor a menor
        const sortedProperties = properties.sort((a, b) => b.rating - a.rating)
        console.log('⭐ Properties ordenadas por rating:', sortedProperties.map(p => ({ id: p.id, rating: p.rating })))
        
        setFeaturedProperties(sortedProperties)
        console.log('✅ Propiedades cargadas exitosamente!')
        
      } catch (error) {
        console.error('❌ Error cargando propiedades destacadas:', error)
        console.error('❌ Error detalles:', {
          message: error instanceof Error ? error.message : 'Unknown error',
          name: error instanceof Error ? error.name : 'Unknown',
          stack: error instanceof Error ? error.stack : undefined
        })
        // En caso de error, mostrar array vacío
        setFeaturedProperties([])
      } finally {
        setPropertiesLoading(false)
        console.log('🏠 Finalizando carga de propiedades...')
      }
    }

    console.log('🏠 useEffect: Montando componente, iniciando carga...')
    loadFeaturedProperties()
  }, [])

  // Animación de números estadísticas
  useEffect(() => {
    const animateStats = () => {
      const targetStats = {
        totalProperties: 2500,
        happyClients: 15000,
        yearsExperience: 8
      }
      
      const duration = 2000 // 2 segundos
      const steps = 60
      const interval = duration / steps
      
      let currentStep = 0
      
      const timer = setInterval(() => {
        currentStep++
        const progress = currentStep / steps
        
        setStats({
          totalProperties: Math.floor(targetStats.totalProperties * progress),
          happyClients: Math.floor(targetStats.happyClients * progress),
          yearsExperience: Math.floor(targetStats.yearsExperience * progress)
        })
        
        if (currentStep >= steps) {
          clearInterval(timer)
          setStats(targetStats)
        }
      }, interval)
    }
    
    // Iniciar animación después de un pequeño delay
    setTimeout(animateStats, 500)
  }, [])

  // Carrusel automático
  useEffect(() => {
    const totalSlides = 4
    const interval = setInterval(() => {
      setCurrentSlide(prev => (prev + 1) % totalSlides)
    }, 3000) // Cambiar cada 3 segundos

    return () => clearInterval(interval)
  }, [])

  const goToSlide = (slideIndex: number) => {
    setCurrentSlide(slideIndex)
  }

  const handleSearch = async (params: { 
    mode: string; 
    location: string; 
    minPrice?: number; 
    maxPrice?: number;
    propertyType?: string;
    bedrooms?: number;
    bathrooms?: number;
    minArea?: number;
    maxArea?: number;
    furnished?: boolean;
    verified?: boolean;
    rentalMode?: string;
    petFriendly?: boolean;
  }) => {
    setIsLoading(true)
    setSearchQuery(params.location)
    
    // Simular búsqueda
    await new Promise(resolve => setTimeout(resolve, 1000))
    
    // Construir parámetros de URL
    const searchParams = new URLSearchParams({
      mode: params.mode,
      location: params.location,
      ...(params.minPrice && { minPrice: params.minPrice.toString() }),
      ...(params.maxPrice && { maxPrice: params.maxPrice.toString() }),
      ...(params.propertyType && { propertyType: params.propertyType }),
      ...(params.bedrooms && { bedrooms: params.bedrooms.toString() }),
      ...(params.bathrooms && { bathrooms: params.bathrooms.toString() }),
      ...(params.minArea && { minArea: params.minArea.toString() }),
      ...(params.maxArea && { maxArea: params.maxArea.toString() }),
      ...(params.furnished !== undefined && { furnished: params.furnished.toString() }),
      ...(params.verified !== undefined && { verified: params.verified.toString() }),
      ...(params.rentalMode && { rentalMode: params.rentalMode }),
      ...(params.petFriendly !== undefined && { petFriendly: params.petFriendly.toString() }),
    })
    
    // Redirigir a página de resultados
    window.location.href = `/search?${searchParams.toString()}`
    
    setIsLoading(false)
  }

  return (
    <Layout>
      <Head>
        {/* SEO optimizado para página de inicio */}
        <title>RentaFacil - Alquiler de Propiedades en Perú | Departamentos y Casas</title>
        <meta 
          name="description" 
          content="Encuentra el alquiler perfecto en Perú. Miles de departamentos, casas y propiedades verificadas. Búsqueda fácil, precios justos y atención personalizada." 
        />
        <meta name="keywords" content="alquiler, departamentos, casas, propiedades, Lima, Perú, inmobiliaria, airbnb, roomate, cuartos" />
        
        {/* Open Graph */}
        <meta property="og:title" content="RentaFacil - Alquiler de Propiedades en Perú" />
        <meta property="og:description" content="La plataforma líder para alquilar propiedades en Perú. Encuentra tu hogar ideal hoy." />
        <meta property="og:image" content="https://rentafacil.com/og-image.jpg" />
        <meta property="og:url" content="https://rentafacil.com" />
        
        {/* Twitter */}
        <meta name="twitter:title" content="RentaFacil - Alquiler de Propiedades en Perú" />
        <meta name="twitter:description" content="Encuentra el alquiler perfecto en Perú. Miles de propiedades verificadas." />
        <meta name="twitter:image" content="https://rentafacil.com/twitter-card.jpg" />
        
        {/* Canonical URL */}
        <link rel="canonical" href="https://rentafacil.com" />
        
        {/* Structured Data para SEO */}
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{
            __html: JSON.stringify({
              "@context": "https://schema.org",
              "@type": "WebSite",
              "name": "RentaFacil",
              "description": "Plataforma de alquiler de propiedades en Perú",
              "url": "https://rentafacil.com",
              "potentialAction": {
                "@type": "SearchAction",
                "target": "https://rentafacil.com/search?q={search_term_string}",
                "query-input": "required name=search_term_string"
              }
            })
          }}
        />
      </Head>

      <main id="main-content">
        {/* <section className="h-screen grid grid-rows-2 overflow-hidden">
          <div className="relative bg-gradient-to-br from-primary-600 via-primary-700 to-primary-800 text-white overflow-hidden flex items-center justify-center">
            <div className="absolute inset-0 bg-black/20" />
            <div 
              className="absolute inset-0 opacity-20"
              style={{
                backgroundImage: `url("data:image/svg+xml,%3Csvg width='120' height='120' viewBox='0 0 120 120' xmlns='http://www.w3.org/2000/svg'%3E%3Cdefs%3E%3Cg id='house'%3E%3Cpath d='M6 20L12 14L18 20V26H6V20Z' fill='none' stroke='%23ffffff' stroke-width='1.5' stroke-opacity='0.3'/%3E%3Crect x='8.5' y='22' width='2' height='3' fill='none' stroke='%23ffffff' stroke-width='1.2' stroke-opacity='0.25'/%3E%3Crect x='13' y='18' width='2' height='2' fill='none' stroke='%23ffffff' stroke-width='1' stroke-opacity='0.2'/%3E%3C/g%3E%3Cg id='building'%3E%3Crect x='2' y='12' width='10' height='14' fill='none' stroke='%23ffffff' stroke-width='1.5' stroke-opacity='0.25'/%3E%3Crect x='4' y='15' width='2' height='2' fill='none' stroke='%23ffffff' stroke-width='1' stroke-opacity='0.2'/%3E%3Crect x='7' y='15' width='2' height='2' fill='none' stroke='%23ffffff' stroke-width='1' stroke-opacity='0.2'/%3E%3Crect x='4' y='18' width='2' height='2' fill='none' stroke='%23ffffff' stroke-width='1' stroke-opacity='0.2'/%3E%3Crect x='7' y='18' width='2' height='2' fill='none' stroke='%23ffffff' stroke-width='1' stroke-opacity='0.2'/%3E%3Crect x='4' y='21' width='2' height='2' fill='none' stroke='%23ffffff' stroke-width='1' stroke-opacity='0.2'/%3E%3Crect x='7' y='21' width='2' height='2' fill='none' stroke='%23ffffff' stroke-width='1' stroke-opacity='0.2'/%3E%3C/g%3E%3Cg id='key'%3E%3Ccircle cx='4' cy='18' r='2' fill='none' stroke='%23ffffff' stroke-width='1.4' stroke-opacity='0.25'/%3E%3Cpath d='M6 18H12M9.5 16V20M10.5 16.5V19.5' stroke='%23ffffff' stroke-width='1.2' stroke-opacity='0.25' fill='none'/%3E%3C/g%3E%3Cg id='apartment'%3E%3Crect x='1' y='10' width='14' height='16' fill='none' stroke='%23ffffff' stroke-width='1.5' stroke-opacity='0.2'/%3E%3Crect x='3' y='13' width='2.5' height='2.5' fill='none' stroke='%23ffffff' stroke-width='1' stroke-opacity='0.15'/%3E%3Crect x='7' y='13' width='2.5' height='2.5' fill='none' stroke='%23ffffff' stroke-width='1' stroke-opacity='0.15'/%3E%3Crect x='11' y='13' width='2.5' height='2.5' fill='none' stroke='%23ffffff' stroke-width='1' stroke-opacity='0.15'/%3E%3Crect x='3' y='17' width='2.5' height='2.5' fill='none' stroke='%23ffffff' stroke-width='1' stroke-opacity='0.15'/%3E%3Crect x='7' y='17' width='2.5' height='2.5' fill='none' stroke='%23ffffff' stroke-width='1' stroke-opacity='0.15'/%3E%3Crect x='11' y='17' width='2.5' height='2.5' fill='none' stroke='%23ffffff' stroke-width='1' stroke-opacity='0.15'/%3E%3Crect x='3' y='21' width='2.5' height='2.5' fill='none' stroke='%23ffffff' stroke-width='1' stroke-opacity='0.15'/%3E%3Crect x='7' y='21' width='2.5' height='2.5' fill='none' stroke='%23ffffff' stroke-width='1' stroke-opacity='0.15'/%3E%3Crect x='11' y='21' width='2.5' height='2.5' fill='none' stroke='%23ffffff' stroke-width='1' stroke-opacity='0.15'/%3E%3C/g%3E%3Cg id='door'%3E%3Crect x='2' y='14' width='5' height='12' rx='2.5' fill='none' stroke='%23ffffff' stroke-width='1.4' stroke-opacity='0.25'/%3E%3Ccircle cx='5.5' cy='20' r='0.4' fill='%23ffffff' fill-opacity='0.2'/%3E%3C/g%3E%3C/defs%3E%3Cuse href='%23house' x='8' y='8'/%3E%3Cuse href='%23building' x='40' y='20'/%3E%3Cuse href='%23key' x='75' y='6' transform='rotate(45 79 24)'/%3E%3Cuse href='%23apartment' x='20' y='50'/%3E%3Cuse href='%23door' x='80' y='38' transform='rotate(-15 82.5 50)'/%3E%3Cuse href='%23key' x='12' y='80' transform='rotate(-30 16 98)'/%3E%3Cuse href='%23building' x='90' y='70'/%3E%3Cuse href='%23house' x='60' y='80'/%3E%3Cuse href='%23key' x='50' y='25' transform='rotate(60 54 43)'/%3E%3Cuse href='%23door' x='4' y='40'/%3E%3Cuse href='%23apartment' x='85' y='5'/%3E%3Cuse href='%23building' x='65' y='12'/%3E%3C/svg%3E")`,
                backgroundSize: '120px 120px'
              }}
            />
            
            <div className="relative z-10 w-full max-w-4xl mx-auto px-6">
              <div className="bg-white/10 backdrop-blur-sm rounded-2xl p-6 md:p-8 shadow-2xl border border-white/20">
                <SearchForm
                  onSearch={handleSearch}
                  isLoading={isLoading}
                  placeholder="¿Dónde quieres vivir? Ej: San Isidro, Miraflores..."
                  className="bg-white text-gray-900"
                />
              </div>
            </div>
          </div>

          <div className="bg-gradient-to-br from-gray-50 via-white to-gray-100 flex items-center justify-center px-6 relative overflow-hidden">
            <div className="absolute inset-0">
              <div className="absolute top-20 right-20 w-32 h-32 bg-primary-100 rounded-full blur-3xl opacity-30"></div>
              <div className="absolute bottom-32 left-16 w-40 h-40 bg-secondary-100 rounded-full blur-3xl opacity-20"></div>
            </div>

            <div className="relative z-10 w-full max-w-7xl mx-auto grid grid-cols-1 lg:grid-cols-2 gap-12 items-center">
              <div className="text-center lg:text-left">
                <div className="mb-8">
                  <div className="text-5xl md:text-7xl font-bold mb-4" style={{ 
                    textShadow: '0px 1px 0px rgba(0,0,0,0.08), 0px 2px 4px rgba(0,0,0,0.1)',
                    transform: 'scale(1.1)',
                    transformOrigin: 'left'
                  }}>
                    <span className="text-secondary-500">RENTA</span><span className="text-primary-500"> FÁCIL</span>
                  </div>
                  
                  <div className="w-24 h-1 bg-gradient-to-r from-secondary-500 to-primary-500 lg:mx-0 mx-auto rounded-full mb-6"></div>
                </div>

                <h1 className="text-2xl md:text-4xl font-bold mb-6 text-gray-900 leading-tight">
                  Encuentra tu hogar ideal en{' '}
                  <span className="text-gray-800 underline decoration-primary-500 underline-offset-4 decoration-2">
                    Perú
                  </span>
                </h1>
                
                <p className="text-lg md:text-xl text-gray-700 mb-8 leading-relaxed">
                  La plataforma que conecta inquilinos y propietarios de manera{' '}
                  <span className="text-gray-900 font-semibold">segura</span> y{' '}
                  <span className="text-gray-900 font-semibold">transparente</span>
                </p>

                <div className="flex flex-col sm:flex-row gap-4 lg:justify-start justify-center">
                  <button className="bg-gradient-to-r from-primary-500 to-primary-600 hover:from-primary-600 hover:to-primary-700 text-white px-8 py-3 rounded-xl font-semibold shadow-xl hover:shadow-2xl transform hover:scale-105 transition-all duration-300">
                    Explorar Propiedades
                  </button>
                  
                  <button className="bg-white border-2 border-primary-200 hover:border-primary-300 text-gray-800 px-8 py-3 rounded-xl font-semibold shadow-lg hover:shadow-xl transform hover:scale-105 transition-all duration-300 hover:bg-primary-50">
                    Publicar Propiedad
                  </button>
                </div>
              </div>

              <div className="relative">
                <div className="bg-white/70 backdrop-blur-sm rounded-2xl p-8 shadow-2xl border border-white/50">
                  <div className="overflow-hidden relative h-64">
                    <div 
                      className="flex transition-transform duration-500 ease-in-out h-full"
                      style={{ transform: `translateX(-${currentSlide * 100}%)` }}
                    >
                      <div className="w-full flex-shrink-0 text-center flex flex-col justify-center">
                        <MagnifyingGlassIcon className="w-16 h-16 mx-auto mb-6 text-gray-800" />
                        <h3 className="text-2xl font-bold text-gray-800 mb-4">Búsqueda Inteligente</h3>
                        <p className="text-gray-600 leading-relaxed">
                          Filtros avanzados para encontrar exactamente lo que buscas. 
                          Por ubicación, precio, características y más.
                        </p>
                      </div>

                      <div className="w-full flex-shrink-0 text-center flex flex-col justify-center">
                        <ShieldCheckIcon className="w-16 h-16 mx-auto mb-6 text-gray-800" />
                        <h3 className="text-2xl font-bold text-gray-800 mb-4">Verificación Segura</h3>
                        <p className="text-gray-600 leading-relaxed">
                          Todas las propiedades y usuarios son verificados 
                          para garantizar tu seguridad y tranquilidad.
                        </p>
                      </div>

                      <div className="w-full flex-shrink-0 text-center flex flex-col justify-center">
                        <ChatBubbleLeftRightIcon className="w-16 h-16 mx-auto mb-6 text-gray-800" />
                        <h3 className="text-2xl font-bold text-gray-800 mb-4">Comunicación Directa</h3>
                        <p className="text-gray-600 leading-relaxed">
                          Contacta directamente con propietarios 
                          sin intermediarios ni comisiones ocultas.
                        </p>
                      </div>

                      <div className="w-full flex-shrink-0 text-center flex flex-col justify-center">
                        <BoltIcon className="w-16 h-16 mx-auto mb-6 text-gray-800" />
                        <h3 className="text-2xl font-bold text-gray-800 mb-4">Proceso Rápido</h3>
                        <p className="text-gray-600 leading-relaxed">
                          Desde la búsqueda hasta el contrato, 
                          todo el proceso simplificado en una plataforma.
                        </p>
                      </div>
                    </div>
                  </div>

                  <div className="flex justify-center mt-6 space-x-2">
                    {[0, 1, 2, 3].map((index) => (
                      <div
                        key={index}
                        className={`w-3 h-3 rounded-full cursor-pointer transition-all duration-300 ${
                          currentSlide === index 
                            ? 'bg-primary-500' 
                            : 'bg-gray-300 hover:bg-gray-400'
                        }`}
                        onClick={() => goToSlide(index)}
                      />
                    ))}
                  </div>
                </div>
              </div>
            </div>
          </div>
        </section>
         */}
         
        {/* ========================================
        HERO SECTION - VERSIÓN ORIGINAL (COMENTADA)
        ========================================
        Para activar esta versión, descomenta todo el bloque y comenta la versión 50/50 de arriba
         */}
        <section className="relative bg-gradient-to-br from-primary-600 via-primary-700 to-primary-800 text-white overflow-hidden">
          <div className="absolute inset-0 bg-black/20" />
          <div 
            className="absolute inset-0 opacity-20"
            style={{
              backgroundImage: `url("data:image/svg+xml,%3Csvg width='120' height='120' viewBox='0 0 120 120' xmlns='http://www.w3.org/2000/svg'%3E%3Cdefs%3E%3Cg id='house'%3E%3Cpath d='M6 20L12 14L18 20V26H6V20Z' fill='none' stroke='%23ffffff' stroke-width='1.5' stroke-opacity='0.3'/%3E%3Crect x='8.5' y='22' width='2' height='3' fill='none' stroke='%23ffffff' stroke-width='1.2' stroke-opacity='0.25'/%3E%3Crect x='13' y='18' width='2' height='2' fill='none' stroke='%23ffffff' stroke-width='1' stroke-opacity='0.2'/%3E%3C/g%3E%3Cg id='building'%3E%3Crect x='2' y='12' width='10' height='14' fill='none' stroke='%23ffffff' stroke-width='1.5' stroke-opacity='0.25'/%3E%3Crect x='4' y='15' width='2' height='2' fill='none' stroke='%23ffffff' stroke-width='1' stroke-opacity='0.2'/%3E%3Crect x='7' y='15' width='2' height='2' fill='none' stroke='%23ffffff' stroke-width='1' stroke-opacity='0.2'/%3E%3Crect x='4' y='18' width='2' height='2' fill='none' stroke='%23ffffff' stroke-width='1' stroke-opacity='0.2'/%3E%3Crect x='7' y='18' width='2' height='2' fill='none' stroke='%23ffffff' stroke-width='1' stroke-opacity='0.2'/%3E%3Crect x='4' y='21' width='2' height='2' fill='none' stroke='%23ffffff' stroke-width='1' stroke-opacity='0.2'/%3E%3Crect x='7' y='21' width='2' height='2' fill='none' stroke='%23ffffff' stroke-width='1' stroke-opacity='0.2'/%3E%3C/g%3E%3Cg id='key'%3E%3Ccircle cx='4' cy='18' r='2' fill='none' stroke='%23ffffff' stroke-width='1.4' stroke-opacity='0.25'/%3E%3Cpath d='M6 18H12M9.5 16V20M10.5 16.5V19.5' stroke='%23ffffff' stroke-width='1.2' stroke-opacity='0.25' fill='none'/%3E%3C/g%3E%3Cg id='apartment'%3E%3Crect x='1' y='10' width='14' height='16' fill='none' stroke='%23ffffff' stroke-width='1.5' stroke-opacity='0.2'/%3E%3Crect x='3' y='13' width='2.5' height='2.5' fill='none' stroke='%23ffffff' stroke-width='1' stroke-opacity='0.15'/%3E%3Crect x='7' y='13' width='2.5' height='2.5' fill='none' stroke='%23ffffff' stroke-width='1' stroke-opacity='0.15'/%3E%3Crect x='11' y='13' width='2.5' height='2.5' fill='none' stroke='%23ffffff' stroke-width='1' stroke-opacity='0.15'/%3E%3Crect x='3' y='17' width='2.5' height='2.5' fill='none' stroke='%23ffffff' stroke-width='1' stroke-opacity='0.15'/%3E%3Crect x='7' y='17' width='2.5' height='2.5' fill='none' stroke='%23ffffff' stroke-width='1' stroke-opacity='0.15'/%3E%3Crect x='11' y='17' width='2.5' height='2.5' fill='none' stroke='%23ffffff' stroke-width='1' stroke-opacity='0.15'/%3E%3Crect x='3' y='21' width='2.5' height='2.5' fill='none' stroke='%23ffffff' stroke-width='1' stroke-opacity='0.15'/%3E%3Crect x='7' y='21' width='2.5' height='2.5' fill='none' stroke='%23ffffff' stroke-width='1' stroke-opacity='0.15'/%3E%3Crect x='11' y='21' width='2.5' height='2.5' fill='none' stroke='%23ffffff' stroke-width='1' stroke-opacity='0.15'/%3E%3C/g%3E%3Cg id='door'%3E%3Crect x='2' y='14' width='5' height='12' rx='2.5' fill='none' stroke='%23ffffff' stroke-width='1.4' stroke-opacity='0.25'/%3E%3Ccircle cx='5.5' cy='20' r='0.4' fill='%23ffffff' fill-opacity='0.2'/%3E%3C/g%3E%3C/defs%3E%3Cuse href='%23house' x='8' y='8'/%3E%3Cuse href='%23building' x='40' y='20'/%3E%3Cuse href='%23key' x='75' y='6' transform='rotate(45 79 24)'/%3E%3Cuse href='%23apartment' x='20' y='50'/%3E%3Cuse href='%23door' x='80' y='38' transform='rotate(-15 82.5 50)'/%3E%3Cuse href='%23key' x='12' y='80' transform='rotate(-30 16 98)'/%3E%3Cuse href='%23building' x='90' y='70'/%3E%3Cuse href='%23house' x='60' y='80'/%3E%3Cuse href='%23key' x='50' y='25' transform='rotate(60 54 43)'/%3E%3Cuse href='%23door' x='4' y='40'/%3E%3Cuse href='%23apartment' x='85' y='5'/%3E%3Cuse href='%23building' x='65' y='12'/%3E%3C/svg%3E")`,
              backgroundSize: '120px 120px'
            }}
          />
          
          <div className="relative container-custom section-padding py-20 md:py-28">
            <div className="max-w-4xl mx-auto text-center">
              <h1 className="text-4xl md:text-6xl font-bold mb-10 text-balance">
                
                <div className="text-6xl md:text-7xl font-bold" style={{ 
                  textShadow: '1px 2px 1px rgba(0,0,0,0.3), 0px 2px 0px rgba(0,0,0,0.2), 0px 3px 0px rgba(0,0,0,0.1), 0px 4px 8px rgba(0,0,0,0.15)',
                  filter: 'drop-shadow(0 2px 4px rgba(0,0,0,0.1))',
                  transform: 'scale(1.1)',
                  transformOrigin: 'center'
                }}>
                  <span className="text-secondary-500">RENTA</span><span className="text-primary-500"> FACIL</span>
                </div>
              </h1>

              <h1 className="text-4xl md:text-6xl font-bold mb-8 text-balance">
                Encuentra tu hogar ideal en{' '}
                {/* <span className="text-gradient bg-gradient-to-r from-yellow-400 to-orange-500 bg-clip-text text-transparent"> */}
                <span style={{ color: '#e18b1aff', textShadow: '0px 1px 0px rgba(0,0,0,0.3), 0px 2px 0px rgba(0,0,0,0.2), 0px 3px 0px rgba(0,0,0,0.1), 0px 4px 8px rgba(0,0,0,0.15)', filter: 'drop-shadow(0 2px 4px rgba(0,0,0,0.1))', transform: 'scale(1.1)', transformOrigin: 'center' }}>Perú</span>
                {/* </span> */}
              </h1>
              
              <p className="text-xl md:text-2xl mb-16 text-blue-100 max-w-3xl mx-auto text-balance">
                Miles de propiedades verificadas, búsqueda inteligente y atención personalizada. 
                Tu próximo alquiler te está esperando.
              </p>
              
              <div className="bg-white/10 backdrop-blur-sm rounded-2xl p-6 md:p-8 shadow-2xl border border-white/20">
                <SearchForm
                  onSearch={handleSearch}
                  isLoading={isLoading}
                  placeholder="¿Dónde quieres vivir? Ej: San Isidro, Miraflores..."
                  className="bg-white text-gray-900"
                />
              </div>
              
            </div>
          </div>
        </section>
        {/* ======================================== 
        FIN VERSIÓN ORIGINAL
        ======================================== 
         */}

        {/* Map Section - Buscar Cerca */}
        <section className="relative h-[500px] overflow-hidden">
          {/* Google Maps Iframe como fondo */}
          <div className="absolute inset-0 w-full h-full">
            <iframe
              src="https://www.google.com/maps/embed?pb=!1m18!1m12!1m3!1d249762.87293362292!2d-77.11076049955383!3d-12.00596121928324!2m3!1f0!2f0!3f0!3m2!1i1024!2i768!4f13.1!3m3!1m2!1s0x9105c5f619ee3ec7%3A0x14206cb9cc452e4a!2sLima!5e0!3m2!1ses!2spe!4v1758382774172!5m2!1ses!2spe"
              width="100%"
              height="100%"
              style={{ border: 0 }}
              allowFullScreen
              loading="lazy"
              referrerPolicy="no-referrer-when-downgrade"
              className="pointer-events-auto"
            />
          </div>
          
          {/* Overlay con contenido */}
          <div className="absolute inset-0 bg-black/40 flex items-center justify-center">
            <div className="text-center text-white px-4 max-w-2xl mx-auto">
              <h2 className="text-3xl md:text-5xl font-bold mb-6">
                Busca Cerca de Ti
              </h2>
              <p className="text-lg md:text-xl mb-8 text-white/90">
                Encuentra propiedades en tu zona preferida de Lima
              </p>
              
              {/* Botón de búsqueda por ubicación */}
              <div className="flex flex-col sm:flex-row gap-4 justify-center items-center">
                <Button
                  onClick={() => {
                    if (navigator.geolocation) {
                      navigator.geolocation.getCurrentPosition(
                        (position) => {
                          const { latitude, longitude } = position.coords
                          window.location.href = `/search?lat=${latitude}&lng=${longitude}&radius=5`
                        },
                        (error) => {
                          console.error('Error obteniendo ubicación:', error)
                          // Fallback: buscar en Lima centro
                          window.location.href = '/search?location=Lima%20Centro'
                        }
                      )
                    } else {
                      // Fallback si no hay geolocalización
                      window.location.href = '/search?location=Lima&mode=alquiler'
                    }
                  }}
                  variant="primary"
                  size="lg"
                  leftIcon={
                    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" />
                    </svg>
                  }
                  className="bg-secondary-500 hover:bg-secondary-400 text-brand-navy font-semibold px-8 py-3 shadow-lg"
                >
                  Usar Mi Ubicación
                </Button>
                
                <Button
                  as={Link}
                  href="/search"
                  variant="outline"
                  size="lg"
                  className="border-white text-white hover:bg-white hover:text-brand-navy px-8 py-3"
                >
                  Explorar Manualmente
                </Button>
              </div>
              
              {/* Texto informativo */}
              <p className="mt-6 text-sm text-white/70">
                Permite el acceso a tu ubicación para encontrar las mejores propiedades cerca de ti
              </p>
            </div>
          </div>
        </section>

        {/* Call to Action - Publica tu Propiedad */}
        <section className="py-16 bg-gradient-to-r from-secondary-500 via-secondary-400 to-secondary-500 relative overflow-hidden">
          {/* Background Pattern */}
          <div className="absolute inset-0 opacity-10">
            <div 
              className="w-full h-full"
              style={{
                backgroundImage: `url("data:image/svg+xml,%3Csvg width='40' height='40' viewBox='0 0 40 40' xmlns='http://www.w3.org/2000/svg'%3E%3Cg fill='%23ffffff' fill-opacity='0.2'%3E%3Cpath d='M20 20c0-11.046-8.954-20-20-20v20h20z'/%3E%3C/g%3E%3C/svg%3E")`,
                backgroundSize: '40px 40px'
              }}
            />
          </div>
          
          <div className="container-custom relative">
            <div className="max-w-4xl mx-auto text-center">
              <h2 className="text-4xl md:text-5xl font-bold text-brand-navy mb-6">
                ¿Tienes una propiedad?
                <span className="block text-2xl md:text-3xl font-normal mt-2 text-brand-navy/80">
                  Publícala y empieza a ganar dinero hoy
                </span>
              </h2>
              
              <p className="text-lg md:text-xl text-brand-navy/70 mb-8 max-w-3xl mx-auto">
                Únete a miles de propietarios que ya están generando ingresos extra con sus propiedades
              </p>
              
              {/* Beneficios */}
              <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-10">
                <div className="bg-white/20 backdrop-blur-sm rounded-xl p-6 border border-white/30">
                  <div className="w-12 h-12 bg-white rounded-full flex items-center justify-center mx-auto mb-4">
                    <svg className="w-6 h-6 text-secondary-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1" />
                    </svg>
                  </div>
                  <h3 className="text-lg font-semibold text-brand-navy mb-2">Ingresos Extra</h3>
                  <p className="text-sm text-brand-navy/70">Genera hasta S/2,500 mensuales adicionales con tu propiedad</p>
                </div>
                
                <div className="bg-white/20 backdrop-blur-sm rounded-xl p-6 border border-white/30">
                  <div className="w-12 h-12 bg-white rounded-full flex items-center justify-center mx-auto mb-4">
                    <svg className="w-6 h-6 text-secondary-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                    </svg>
                  </div>
                  <h3 className="text-lg font-semibold text-brand-navy mb-2">100% Gratis</h3>
                  <p className="text-sm text-brand-navy/70">Sin comisiones ocultas, solo pagas cuando cierres el trato</p>
                </div>
                
                <div className="bg-white/20 backdrop-blur-sm rounded-xl p-6 border border-white/30">
                  <div className="w-12 h-12 bg-white rounded-full flex items-center justify-center mx-auto mb-4">
                    <svg className="w-6 h-6 text-secondary-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" />
                    </svg>
                  </div>
                  <h3 className="text-lg font-semibold text-brand-navy mb-2">Rápido y Fácil</h3>
                  <p className="text-sm text-brand-navy/70">Publica en menos de 5 minutos y llega a miles de interesados</p>
                </div>
              </div>
              
              {/* CTA Buttons */}
              <div className="flex flex-col sm:flex-row gap-4 justify-center items-center">
                <Button
                  as={Link}
                  href="/publicar"
                  variant="primary"
                  size="lg"
                  leftIcon={
                    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
                    </svg>
                  }
                  className="bg-brand-navy hover:bg-brand-navy/90 text-white font-semibold px-8 py-4 text-lg shadow-xl"
                >
                  Publicar mi Propiedad GRATIS
                </Button>
                
                <Button
                  as={Link}
                  href="/como-funciona"
                  variant="outline"
                  size="lg"
                  className="border-2 border-brand-navy text-brand-navy hover:bg-brand-navy hover:text-white px-8 py-4 font-semibold"
                >
                  ¿Cómo Funciona?
                </Button>
              </div>
              
              {/* Trust indicators */}
              <div className="mt-8 flex flex-col sm:flex-row items-center justify-center gap-6 text-sm text-brand-navy/60">
                <div className="flex items-center gap-2">
                  <svg className="w-4 h-4 text-green-600" fill="currentColor" viewBox="0 0 20 20">
                    <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                  </svg>
                  <span>+15,000 propietarios confían en nosotros</span>
                </div>
                <div className="flex items-center gap-2">
                  <svg className="w-4 h-4 text-green-600" fill="currentColor" viewBox="0 0 20 20">
                    <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                  </svg>
                  <span>Respaldo legal y verificación de inquilinos</span>
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* Featured Properties */}
        <section className="section-padding bg-gray-50">
          <div className="container-custom">
            <div className="text-center mb-12">
              <h2 className="text-3xl md:text-4xl font-bold text-gray-900 mb-4">
                Propiedades Destacadas
              </h2>
              <p className="text-xl text-gray-600 max-w-2xl mx-auto">
                Descubre las mejores opciones seleccionadas especialmente para ti
              </p>
            </div>
            
            {propertiesLoading ? (
              // Loading state
              <div className="flex justify-center items-center py-12">
                <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary-600"></div>
                <span className="ml-4 text-gray-600">Cargando propiedades destacadas...</span>
              </div>
            ) : featuredProperties.length > 0 ? (
              // Properties loaded
              <>
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
                  {featuredProperties.map((property) => (
                    <PropertyCard
                      key={property.id}
                      property={property}
                      className="card-hover"
                    />
                  ))}
                </div>
                
                <div className="text-center mt-12">
                  <Button
                    as={Link}
                    href="/propiedades"
                    size="lg"
                    className="btn-primary inline-flex items-center gap-2"
                  >
                    Ver todas las propiedades
                    <ArrowRightIcon className="w-5 h-5" />
                  </Button>
                </div>
              </>
            ) : (
              // No properties found
              <div className="text-center py-12">
                <div className="text-gray-400 mb-4">
                  <HomeIcon className="w-16 h-16 mx-auto mb-4" />
                </div>
                <h3 className="text-lg font-medium text-gray-900 mb-2">
                  No hay propiedades destacadas disponibles
                </h3>
                <p className="text-gray-500 mb-6">
                  Estamos trabajando para traerte las mejores opciones
                </p>
                <Button
                  as={Link}
                  href="/propiedades"
                  size="lg"
                  className="btn-primary inline-flex items-center gap-2"
                >
                  Explorar todas las propiedades
                  <ArrowRightIcon className="w-5 h-5" />
                </Button>
              </div>
            )}
          </div>
        </section>
        {/* Why Choose Us */}
        <section className="section-padding bg-primary-50">
          <div className="container-custom">
            <div className="text-center mb-16">
              <h2 className="text-3xl md:text-4xl font-bold text-gray-900 mb-4">
                ¿Por qué elegir RentaFacil?
              </h2>
              <p className="text-xl text-gray-600 max-w-2xl mx-auto">
                Te ofrecemos la mejor experiencia en búsqueda y alquiler de propiedades
              </p>
            </div>
            
            <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
              <div className="text-center p-6">
                <div className="w-16 h-16 bg-primary-100 rounded-full center mx-auto mb-6">
                  <CheckCircleIcon className="w-8 h-8 text-primary-600" />
                </div>
                <h3 className="text-xl font-semibold mb-4">Propiedades Verificadas</h3>
                <p className="text-gray-600">
                  Todas nuestras propiedades pasan por un proceso de verificación riguroso 
                  para garantizar calidad y autenticidad.
                </p>
              </div>
              
              <div className="text-center p-6">
                <div className="w-16 h-16 bg-secondary-100 rounded-full center mx-auto mb-6">
                  <HeartIcon className="w-8 h-8 text-secondary-600" />
                </div>
                <h3 className="text-xl font-semibold mb-4">Atención Personalizada</h3>
                <p className="text-gray-600">
                  Nuestro equipo de expertos te acompaña en todo el proceso, 
                  desde la búsqueda hasta la firma del contrato.
                </p>
              </div>
              
              <div className="text-center p-6">
                <div className="w-16 h-16 bg-accent-100 rounded-full center mx-auto mb-6">
                  <MagnifyingGlassIcon className="w-8 h-8 text-accent-600" />
                </div>
                <h3 className="text-xl font-semibold mb-4">Búsqueda Inteligente</h3>
                <p className="text-gray-600">
                  Utiliza nuestros filtros avanzados, busqueda textual y busqueda por geolocalización para encontrar 
                  exactamente lo que buscas.
                </p>
              </div>
            </div>
          </div>
        </section>
        
        {/* CTA Section */}
        <section className="section-padding bg-gradient-to-r from-primary-600 to-secondary-600 text-white">
          <div className="container-custom text-center">
            <h2 className="text-3xl md:text-4xl font-bold mb-6">
              ¿Listo para encontrar tu nuevo hogar?
            </h2>
            <p className="text-xl mb-8 text-blue-100 max-w-2xl mx-auto">
              Únete a miles de personas que ya encontraron su hogar ideal con RentaFacil
            </p>
            
            <div className="flex flex-col sm:flex-row gap-4 justify-center">
              <Button
                as={Link}
                href="/propiedades"
                size="lg"
                className="bg-white text-primary-600 hover:bg-gray-100"
              >
                Buscar propiedades
              </Button>
              <Button
                as={Link}
                href="/publicar"
                size="lg"
                variant="outline"
                className="border-white text-white hover:bg-white hover:text-primary-600"
              >
                Publicar mi propiedad
              </Button>
            </div>
          </div>
        </section>
        
      </main>
    </Layout>
  )
}

export default HomePage
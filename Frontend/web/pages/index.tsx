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
  EyeIcon
} from '@heroicons/react/24/outline'

// Componentes
import Layout from '@/components/Layout'
import SearchForm from '@/components/SearchForm'
import PropertyCard from '@/components/PropertyCard'
import { Button } from '@/components/ui/Button'

// Types
import { Property } from '@/types'

// Función para formateo consistente de números
const formatNumber = (num: number): string => {
  return num.toString().replace(/\B(?=(\d{3})+(?!\d))/g, ',')
}

// Mock data para desarrollo
const featuredProperties: Property[] = [
  {
    id: '1',
    title: 'Moderno Departamento en San Isidro',
    description: 'Hermoso departamento con vista al parque, completamente amoblado',
    price: 2500,
    currency: 'PEN',
    location: 'San Isidro, Lima',
    bedrooms: 3,
    bathrooms: 2,
    area: 120,
    images: ['/images/properties/property-1.jpg'],
    amenities: ['Piscina', 'Gimnasio', 'Seguridad 24h'],
    rating: 4.8,
    reviews: 24,
    isVerified: true,
    isFavorite: false,
    views: 156
  },
  {
    id: '2',
    title: 'Casa Familiar en Miraflores',
    description: 'Casa de 3 pisos con jardín, ideal para familias',
    price: 3800,
    currency: 'PEN',
    location: 'Miraflores, Lima',
    bedrooms: 4,
    bathrooms: 3,
    area: 200,
    images: ['/images/properties/property-2.jpg'],
    amenities: ['Jardín', 'Garaje', 'Terraza'],
    rating: 4.9,
    reviews: 18,
    isVerified: true,
    isFavorite: false,
    views: 203
  },
  {
    id: '3',
    title: 'Loft Contemporáneo en Barranco',
    description: 'Loft moderno en zona bohemia, cerca de galerías y restaurantes',
    price: 2200,
    currency: 'PEN',
    location: 'Barranco, Lima',
    bedrooms: 2,
    bathrooms: 1,
    area: 85,
    images: ['/images/properties/property-3.jpg'],
    amenities: ['Terraza', 'Zona artística', 'Restaurantes cerca'],
    rating: 4.7,
    reviews: 31,
    isVerified: true,
    isFavorite: false,
    views: 127
  }
]

const HomePage: NextPage = () => {
  const [searchQuery, setSearchQuery] = useState('')
  const [isLoading, setIsLoading] = useState(false)
  
  // Estadísticas para mostrar
  const [stats, setStats] = useState({
    totalProperties: 0,
    happyClients: 0,
    yearsExperience: 0
  })

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

  const handleSearch = async (params: { mode: string; location: string; minPrice?: number; maxPrice?: number }) => {
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
        <meta name="keywords" content="alquiler, departamentos, casas, propiedades, Lima, Perú, inmobiliaria" />
        
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
        {/* Hero Section */}
        <section className="relative bg-gradient-to-br from-primary-600 via-primary-700 to-primary-800 text-white overflow-hidden">
          {/* Background Pattern */}
          <div className="absolute inset-0 bg-black/20" />
          <div 
            className="absolute inset-0 opacity-10"
            style={{
              backgroundImage: `url("data:image/svg+xml,%3Csvg width='60' height='60' viewBox='0 0 60 60' xmlns='http://www.w3.org/2000/svg'%3E%3Cg fill='none' fill-rule='evenodd'%3E%3Cg fill='%23ffffff' fill-opacity='0.1'%3E%3Ccircle cx='7' cy='7' r='7'/%3E%3C/g%3E%3C/g%3E%3C/svg%3E")`,
              backgroundSize: '60px 60px'
            }}
          />
          
          <div className="relative container-custom section-padding">
            <div className="max-w-4xl mx-auto text-center">
              <h1 className="text-4xl md:text-6xl font-bold mb-6 text-balance">
                Encuentra tu hogar ideal en{' '}
                <span className="text-gradient bg-gradient-to-r from-yellow-400 to-orange-500 bg-clip-text text-transparent">
                  Perú
                </span>
              </h1>
              
              <p className="text-xl md:text-2xl mb-12 text-blue-100 max-w-3xl mx-auto text-balance">
                Miles de propiedades verificadas, búsqueda inteligente y atención personalizada. 
                Tu próximo alquiler te está esperando.
              </p>
              
              {/* Search Form */}
              <div className="bg-white/10 backdrop-blur-sm rounded-2xl p-6 md:p-8 shadow-2xl border border-white/20">
                <SearchForm
                  onSearch={handleSearch}
                  isLoading={isLoading}
                  placeholder="¿Dónde quieres vivir? Ej: San Isidro, Miraflores..."
                  className="bg-white text-gray-900"
                />
              </div>
              
              {/* Quick Stats */}
              <div className="grid grid-cols-3 gap-8 mt-12">
                <div className="text-center">
                  <div className="text-3xl md:text-4xl font-bold text-yellow-400">
                    {formatNumber(stats.totalProperties)}+
                  </div>
                  <div className="text-blue-100">Propiedades</div>
                </div>
                <div className="text-center">
                  <div className="text-3xl md:text-4xl font-bold text-green-400">
                    {formatNumber(stats.happyClients)}+
                  </div>
                  <div className="text-blue-100">Clientes felices</div>
                </div>
                <div className="text-center">
                  <div className="text-3xl md:text-4xl font-bold text-orange-400">
                    {stats.yearsExperience}+
                  </div>
                  <div className="text-blue-100">Años de experiencia</div>
                </div>
              </div>
            </div>
          </div>
        </section>

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
                      window.location.href = '/search?location=Lima'
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
                  Utiliza nuestros filtros avanzados y búsqueda por IA para encontrar 
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
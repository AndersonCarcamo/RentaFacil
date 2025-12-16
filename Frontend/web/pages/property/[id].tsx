import { NextPage, GetServerSideProps } from 'next'
import Head from 'next/head'
import { useState } from 'react'
import Link from 'next/link'
import Image from 'next/image'
import { useRouter } from 'next/router'

// Componentes
import Layout from '@/components/Layout'
import { Button } from '@/components/ui/Button'
import { useAuth } from '@/lib/hooks/useAuth'

// Types y Services
import { Property } from '@/types'
import { listingsService } from '@/services/listings'
import chatService from '@/services/chatService'

// Utilities
import { formatPrice } from '@/lib/utils'

interface PropertyDetailPageProps {
  property: Property | null
  error?: string
}

const PropertyDetailPage: NextPage<PropertyDetailPageProps> = ({ property, error }) => {
  const [currentImageIndex, setCurrentImageIndex] = useState(0)
  const [loadingChat, setLoadingChat] = useState(false)
  const [hasConfirmedBooking, setHasConfirmedBooking] = useState(false)
  const [checkingBooking, setCheckingBooking] = useState(true)
  const { user } = useAuth()
  const router = useRouter()

  const handleContact = (type: 'call' | 'whatsapp' | 'email') => {
    if (!user) {
      // Si no hay usuario, redirigir a registro con tipo USER preseleccionado
      router.push('/register?type=user&redirectTo=' + encodeURIComponent(router.asPath))
    } else {
      // Si hay usuario, proceder con el contacto (implementar después)
      switch (type) {
        case 'call':
          alert('Llamar al propietario')
          break
        case 'whatsapp':
          alert('Abrir WhatsApp')
          break
        case 'email':
          alert('Enviar email')
          break
      }
    }
  }

  // Verificar si el usuario tiene una reserva confirmada para este listing
  useEffect(() => {
    const checkBookingStatus = async () => {
      if (!user || !property) {
        setCheckingBooking(false)
        return
      }

      try {
        const token = localStorage.getItem('access_token')
        const response = await fetch(
          `${process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000/api/v1'}/bookings/my-bookings`,
          {
            headers: {
              'Authorization': `Bearer ${token}`,
            },
          }
        )
        
        if (response.ok) {
          const bookings = await response.json()
          // Verificar si hay alguna reserva confirmada para este listing
          const confirmedBooking = bookings.find(
            (booking: any) => 
              booking.listing_id === property.id && 
              booking.status === 'confirmed'
          )
          setHasConfirmedBooking(!!confirmedBooking)
        }
      } catch (err) {
        console.error('Error checking booking:', err)
      } finally {
        setCheckingBooking(false)
      }
    }

    checkBookingStatus()
  }, [user, property])

  const handleStartChat = async () => {
    if (!user) {
      router.push('/register?type=user&redirectTo=' + encodeURIComponent(router.asPath))
      return
    }

    if (!property) return

    try {
      setLoadingChat(true)
      const conversation = await chatService.createConversation({
        listing_id: property.id,
      })
      router.push(`/messages/${conversation.id}`)
    } catch (err: any) {
      console.error('Error starting chat:', err)
      alert(err.response?.data?.detail || 'Error al iniciar chat')
    } finally {
      setLoadingChat(false)
    }
  }

  if (error || !property) {
    return (
      <Layout>
        <Head>
          <title>Propiedad no encontrada - RentaFacil</title>
        </Head>
        <main className="min-h-screen bg-gray-50 flex items-center justify-center">
          <div className="max-w-md text-center">
            <h1 className="text-2xl font-bold text-gray-900 mb-4">
              Propiedad no encontrada
            </h1>
            <p className="text-gray-600 mb-6">
              La propiedad que buscas no existe o ha sido removida.
            </p>
            <Button as={Link} href="/" variant="primary">
              Volver al inicio
            </Button>
          </div>
        </main>
      </Layout>
    )
  }

  const nextImage = () => {
    setCurrentImageIndex((prev) => 
      prev === property.images.length - 1 ? 0 : prev + 1
    )
  }

  const prevImage = () => {
    setCurrentImageIndex((prev) => 
      prev === 0 ? property.images.length - 1 : prev - 1
    )
  }

  return (
    <Layout>
      <Head>
        <title>{property.title} - RentaFacil</title>
        <meta name="description" content={property.description} />
      </Head>

      <main className="min-h-screen bg-gray-50">
        {/* Galería de imágenes */}
        <section className="relative bg-black">
          <div className="aspect-[16/9] relative overflow-hidden">
            <Image
              src={property.images[currentImageIndex]}
              alt={property.title}
              fill
              className="object-cover"
              priority
            />
            
            {/* Controles de navegación */}
            {property.images.length > 1 && (
              <>
                <button
                  onClick={prevImage}
                  className="absolute left-4 top-1/2 -translate-y-1/2 bg-black/50 hover:bg-black/70 text-white p-2 rounded-full transition-colors"
                >
                  <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
                  </svg>
                </button>
                <button
                  onClick={nextImage}
                  className="absolute right-4 top-1/2 -translate-y-1/2 bg-black/50 hover:bg-black/70 text-white p-2 rounded-full transition-colors"
                >
                  <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                  </svg>
                </button>
                
                {/* Indicadores */}
                <div className="absolute bottom-4 left-1/2 -translate-x-1/2 flex space-x-2">
                  {property.images.map((_, index) => (
                    <button
                      key={index}
                      onClick={() => setCurrentImageIndex(index)}
                      className={`w-2 h-2 rounded-full transition-colors ${
                        index === currentImageIndex ? 'bg-white' : 'bg-white/50'
                      }`}
                    />
                  ))}
                </div>
              </>
            )}
          </div>
        </section>

        {/* Información de la propiedad */}
        <section className="section-padding">
          <div className="container-custom">
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
              {/* Columna principal */}
              <div className="lg:col-span-2">
                {/* Header */}
                <div className="bg-white rounded-xl p-6 mb-6">
                  <div className="flex flex-col sm:flex-row sm:items-start sm:justify-between gap-4 mb-4">
                    <div>
                      <h1 className="text-2xl md:text-3xl font-bold text-gray-900 mb-2">
                        {property.title}
                      </h1>
                      <p className="text-gray-600 flex items-center">
                        <svg className="w-5 h-5 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" />
                        </svg>
                        {property.location}
                      </p>
                    </div>
                    <div className="text-right">
                      <div className="text-3xl font-bold text-yellow-600 mb-1">
                        S/ {formatPrice(property.price)}
                      </div>
                      {property.type === 'alquiler' && (
                        <div className="text-gray-600">/ mes</div>
                      )}
                    </div>
                  </div>

                  {/* Características */}
                  <div className="flex flex-wrap gap-6">
                    <div className="flex items-center text-gray-600">
                      <svg className="w-5 h-5 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-4m-5 0H3m5 0h4" />
                      </svg>
                      {property.bedrooms} dormitorios
                    </div>
                    <div className="flex items-center text-gray-600">
                      <svg className="w-5 h-5 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 14v3a2 2 0 002 2h4a2 2 0 002-2v-3M8 14V9a2 2 0 012-2h4a2 2 0 012 2v5m-8 0h8" />
                      </svg>
                      {property.bathrooms} baños
                    </div>
                    <div className="flex items-center text-gray-600">
                      <svg className="w-5 h-5 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 8V4m0 0h4M4 4l5 5m11-1V4m0 0h-4m4 0l-5 5M4 16v4m0 0h4m-4 0l5-5m11 5l-5-5m5 5v-4m0 4h-4" />
                      </svg>
                      {property.area} m²
                    </div>
                  </div>
                </div>

                {/* Descripción */}
                <div className="bg-white rounded-xl p-6">
                  <h2 className="text-xl font-bold text-gray-900 mb-4">Descripción</h2>
                  <div className="text-gray-700 leading-relaxed whitespace-pre-line">
                    {property.description}
                  </div>
                </div>
              </div>

              {/* Sidebar de contacto */}
              <div className="lg:col-span-1">
                <div className="bg-white rounded-xl p-6 sticky top-4">
                  <h3 className="text-lg font-bold text-gray-900 mb-4">
                    {user ? 'Contactar' : 'Regístrate para Contactar'}
                  </h3>
                  
                  <div className="space-y-4">
                    {/* Botón de chat - Solo visible con reserva confirmada */}
                    {user && hasConfirmedBooking && (
                      <Button 
                        variant="primary" 
                        className="w-full"
                        onClick={handleStartChat}
                        disabled={loadingChat}
                      >
                        <svg className="w-5 h-5 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z" />
                        </svg>
                        {loadingChat ? 'Iniciando chat...' : 'Enviar mensaje'}
                      </Button>
                    )}

                    {/* Mensaje informativo si no hay reserva */}
                    {user && !checkingBooking && !hasConfirmedBooking && (
                      <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 text-sm text-blue-800">
                        <p className="font-medium mb-1">💬 Chat disponible</p>
                        <p>El chat estará disponible una vez que el propietario acepte tu reserva.</p>
                      </div>
                    )}

                    <Button 
                      variant="outline" 
                      className="w-full"
                      onClick={() => handleContact('call')}
                    >
                      <svg className="w-5 h-5 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 5a2 2 0 012-2h3.28a1 1 0 01.948.684l1.498 4.493a1 1 0 01-.502 1.21l-2.257 1.13a11.042 11.042 0 005.516 5.516l1.13-2.257a1 1 0 011.21-.502l4.493 1.498a1 1 0 01.684.949V19a2 2 0 01-2 2h-1C9.716 21 3 14.284 3 6V5z" />
                      </svg>
                      {user ? 'Llamar' : 'Regístrate para Llamar'}
                    </Button>
                    
                    <Button 
                      variant="outline" 
                      className="w-full"
                      onClick={() => handleContact('whatsapp')}
                    >
                      <svg className="w-5 h-5 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z" />
                      </svg>
                      WhatsApp
                    </Button>
                    
                    <Button 
                      variant="outline" 
                      className="w-full"
                      onClick={() => handleContact('email')}
                    >
                      <svg className="w-5 h-5 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 8l7.89 4.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
                      </svg>
                      Email
                    </Button>

                    <div className="pt-4 border-t border-gray-200">
                      <Button variant="outline" className="w-full">
                        <svg className="w-5 h-5 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4.318 6.318a4.5 4.5 0 000 6.364L12 20.364l7.682-7.682a4.5 4.5 0 00-6.364-6.364L12 7.636l-1.318-1.318a4.5 4.5 0 00-6.364 0z" />
                        </svg>
                        Guardar
                      </Button>
                    </div>
                  </div>

                  <div className="mt-6 pt-6 border-t border-gray-200 text-center">
                    <p className="text-sm text-gray-500">
                      Código: <span className="font-mono">{property.id}</span>
                    </p>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </section>
      </main>
    </Layout>
  )
}

export const getServerSideProps: GetServerSideProps = async (context) => {
  const { id } = context.params!

  try {
    const property = await listingsService.getListing(id as string)
    
    if (!property) {
      return {
        props: {
          property: null,
          error: 'Property not found'
        }
      }
    }

    return {
      props: {
        property
      }
    }
  } catch (error) {
    console.error('Error fetching property:', error)
    return {
      props: {
        property: null,
        error: 'Error fetching property'
      }
    }
  }
}

export default PropertyDetailPage
import { NextPage } from 'next'
import Head from 'next/head'
import Link from 'next/link'
import Image from 'next/image'
import { 
  MagnifyingGlassIcon,
  UserGroupIcon,
  HomeIcon,
  ShieldCheckIcon,
  CheckCircleIcon,
  ArrowRightIcon,
  ChatBubbleLeftRightIcon,
  DocumentTextIcon,
  KeyIcon,
  BanknotesIcon
} from '@heroicons/react/24/outline'
import Layout from '@/components/common/Layout'
import { Button } from '@/components/ui/Button'

const ComoFuncionaPage: NextPage = () => {
  return (
    <Layout>
      <Head>
        <title>¿Cómo Funciona? - RentaFacil</title>
        <meta 
          name="description" 
          content="Descubre cómo funciona RentaFacil, la plataforma más fácil y segura para alquilar, comprar o vender propiedades en Perú." 
        />
      </Head>

      {/* Hero Section */}
      <section className="relative bg-gradient-to-br from-brand-navy via-brand-navy/95 to-blue-900 text-white pt-24 pb-20">
        <div className="absolute inset-0 bg-[url('/images/pattern.svg')] opacity-10" />
        <div className="container-custom relative z-10">
          <div className="max-w-4xl mx-auto text-center">
            <h1 className="text-4xl md:text-5xl lg:text-6xl font-bold mb-6">
              ¿Cómo Funciona RentaFacil?
            </h1>
            <p className="text-xl md:text-2xl text-white/90 mb-8">
              Alquilar, comprar o vender propiedades nunca fue tan fácil. 
              Descubre nuestro proceso paso a paso.
            </p>
            <div className="flex flex-wrap gap-4 justify-center">
              <Button
                as={Link}
                href="/propiedades"
                variant="secondary"
                size="lg"
                rightIcon={<ArrowRightIcon className="h-5 w-5" />}
              >
                Ver Propiedades
              </Button>
              <Button
                as={Link}
                href="/publicar"
                variant="outline"
                size="lg"
                className="border-2 border-white text-white hover:bg-white hover:text-brand-navy"
              >
                Publicar Propiedad
              </Button>
            </div>
          </div>
        </div>
      </section>

      {/* Para Inquilinos */}
      <section className="section-padding bg-white">
        <div className="container-custom">
          <div className="text-center mb-16">
            <h2 className="text-3xl md:text-4xl font-bold text-gray-900 mb-4">
              Para Inquilinos
            </h2>
            <p className="text-xl text-gray-600 max-w-2xl mx-auto">
              Encuentra tu hogar ideal en 4 simples pasos
            </p>
          </div>

          <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-8">
            {/* Paso 1 */}
            <div className="text-center">
              <div className="relative inline-flex items-center justify-center w-20 h-20 bg-secondary-100 rounded-2xl mb-6">
                <MagnifyingGlassIcon className="h-10 w-10 text-secondary-600" />
                <span className="absolute -top-2 -right-2 w-8 h-8 bg-brand-navy text-white rounded-full flex items-center justify-center text-sm font-bold">
                  1
                </span>
              </div>
              <h3 className="text-xl font-bold text-gray-900 mb-3">Busca</h3>
              <p className="text-gray-600">
                Explora miles de propiedades verificadas usando nuestros filtros avanzados. 
                Encuentra el lugar perfecto según tu presupuesto y necesidades.
              </p>
            </div>

            {/* Paso 2 */}
            <div className="text-center">
              <div className="relative inline-flex items-center justify-center w-20 h-20 bg-secondary-100 rounded-2xl mb-6">
                <ChatBubbleLeftRightIcon className="h-10 w-10 text-secondary-600" />
                <span className="absolute -top-2 -right-2 w-8 h-8 bg-brand-navy text-white rounded-full flex items-center justify-center text-sm font-bold">
                  2
                </span>
              </div>
              <h3 className="text-xl font-bold text-gray-900 mb-3">Contacta</h3>
              <p className="text-gray-600">
                Comunícate directamente con propietarios o agentes. Agenda visitas, 
                haz preguntas y negocia las mejores condiciones.
              </p>
            </div>

            {/* Paso 3 */}
            <div className="text-center">
              <div className="relative inline-flex items-center justify-center w-20 h-20 bg-secondary-100 rounded-2xl mb-6">
                <ShieldCheckIcon className="h-10 w-10 text-secondary-600" />
                <span className="absolute -top-2 -right-2 w-8 h-8 bg-brand-navy text-white rounded-full flex items-center justify-center text-sm font-bold">
                  3
                </span>
              </div>
              <h3 className="text-xl font-bold text-gray-900 mb-3">Verifica</h3>
              <p className="text-gray-600">
                Revisa toda la documentación. Todas nuestras propiedades verificadas 
                cuentan con garantía de autenticidad.
              </p>
            </div>

            {/* Paso 4 */}
            <div className="text-center">
              <div className="relative inline-flex items-center justify-center w-20 h-20 bg-secondary-100 rounded-2xl mb-6">
                <KeyIcon className="h-10 w-10 text-secondary-600" />
                <span className="absolute -top-2 -right-2 w-8 h-8 bg-brand-navy text-white rounded-full flex items-center justify-center text-sm font-bold">
                  4
                </span>
              </div>
              <h3 className="text-xl font-bold text-gray-900 mb-3">Múdate</h3>
              <p className="text-gray-600">
                Firma el contrato, realiza el pago seguro y recibe las llaves. 
                ¡Bienvenido a tu nuevo hogar!
              </p>
            </div>
          </div>

          <div className="mt-12 text-center">
            <Button
              as={Link}
              href="/propiedades"
              variant="primary"
              size="lg"
              rightIcon={<ArrowRightIcon className="h-5 w-5" />}
            >
              Buscar Propiedades
            </Button>
          </div>
        </div>
      </section>

      {/* Para Propietarios */}
      <section className="section-padding bg-gray-50">
        <div className="container-custom">
          <div className="text-center mb-16">
            <h2 className="text-3xl md:text-4xl font-bold text-gray-900 mb-4">
              Para Propietarios
            </h2>
            <p className="text-xl text-gray-600 max-w-2xl mx-auto">
              Publica y gestiona tus propiedades de manera profesional
            </p>
          </div>

          <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-8">
            {/* Paso 1 */}
            <div className="text-center">
              <div className="relative inline-flex items-center justify-center w-20 h-20 bg-blue-100 rounded-2xl mb-6">
                <UserGroupIcon className="h-10 w-10 text-blue-600" />
                <span className="absolute -top-2 -right-2 w-8 h-8 bg-brand-navy text-white rounded-full flex items-center justify-center text-sm font-bold">
                  1
                </span>
              </div>
              <h3 className="text-xl font-bold text-gray-900 mb-3">Regístrate</h3>
              <p className="text-gray-600">
                Crea tu cuenta gratis en segundos. Elige si eres propietario 
                individual o agencia inmobiliaria.
              </p>
            </div>

            {/* Paso 2 */}
            <div className="text-center">
              <div className="relative inline-flex items-center justify-center w-20 h-20 bg-blue-100 rounded-2xl mb-6">
                <HomeIcon className="h-10 w-10 text-blue-600" />
                <span className="absolute -top-2 -right-2 w-8 h-8 bg-brand-navy text-white rounded-full flex items-center justify-center text-sm font-bold">
                  2
                </span>
              </div>
              <h3 className="text-xl font-bold text-gray-900 mb-3">Publica</h3>
              <p className="text-gray-600">
                Sube fotos, describe tu propiedad y establece el precio. 
                Nuestro sistema te guía en cada paso.
              </p>
            </div>

            {/* Paso 3 */}
            <div className="text-center">
              <div className="relative inline-flex items-center justify-center w-20 h-20 bg-blue-100 rounded-2xl mb-6">
                <DocumentTextIcon className="h-10 w-10 text-blue-600" />
                <span className="absolute -top-2 -right-2 w-8 h-8 bg-brand-navy text-white rounded-full flex items-center justify-center text-sm font-bold">
                  3
                </span>
              </div>
              <h3 className="text-xl font-bold text-gray-900 mb-3">Gestiona</h3>
              <p className="text-gray-600">
                Recibe solicitudes, responde consultas y agenda visitas desde 
                un solo lugar. Todo bajo control.
              </p>
            </div>

            {/* Paso 4 */}
            <div className="text-center">
              <div className="relative inline-flex items-center justify-center w-20 h-20 bg-blue-100 rounded-2xl mb-6">
                <BanknotesIcon className="h-10 w-10 text-blue-600" />
                <span className="absolute -top-2 -right-2 w-8 h-8 bg-brand-navy text-white rounded-full flex items-center justify-center text-sm font-bold">
                  4
                </span>
              </div>
              <h3 className="text-xl font-bold text-gray-900 mb-3">Cobra</h3>
              <p className="text-gray-600">
                Firma el contrato y recibe pagos seguros. Nosotros facilitamos 
                todo el proceso de manera transparente.
              </p>
            </div>
          </div>

          <div className="mt-12 text-center">
            <Button
              as={Link}
              href="/publicar"
              variant="primary"
              size="lg"
              rightIcon={<ArrowRightIcon className="h-5 w-5" />}
            >
              Publicar Propiedad Gratis
            </Button>
          </div>
        </div>
      </section>

      {/* Beneficios */}
      <section className="section-padding bg-white">
        <div className="container-custom">
          <div className="text-center mb-16">
            <h2 className="text-3xl md:text-4xl font-bold text-gray-900 mb-4">
              ¿Por Qué Elegir RentaFacil?
            </h2>
            <p className="text-xl text-gray-600 max-w-2xl mx-auto">
              Somos más que una plataforma, somos tu aliado en el proceso
            </p>
          </div>

          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-8">
            {/* Beneficio 1 */}
            <div className="bg-gray-50 rounded-2xl p-8 hover:shadow-lg transition-shadow">
              <div className="w-14 h-14 bg-secondary-100 rounded-xl flex items-center justify-center mb-4">
                <ShieldCheckIcon className="h-8 w-8 text-secondary-600" />
              </div>
              <h3 className="text-xl font-bold text-gray-900 mb-3">
                100% Verificado
              </h3>
              <p className="text-gray-600">
                Todas las propiedades pasan por un riguroso proceso de verificación. 
                Tu seguridad es nuestra prioridad.
              </p>
            </div>

            {/* Beneficio 2 */}
            <div className="bg-gray-50 rounded-2xl p-8 hover:shadow-lg transition-shadow">
              <div className="w-14 h-14 bg-secondary-100 rounded-xl flex items-center justify-center mb-4">
                <ChatBubbleLeftRightIcon className="h-8 w-8 text-secondary-600" />
              </div>
              <h3 className="text-xl font-bold text-gray-900 mb-3">
                Soporte 24/7
              </h3>
              <p className="text-gray-600">
                Nuestro equipo está disponible para ayudarte en cualquier momento. 
                Chat en vivo, email o teléfono.
              </p>
            </div>

            {/* Beneficio 3 */}
            <div className="bg-gray-50 rounded-2xl p-8 hover:shadow-lg transition-shadow">
              <div className="w-14 h-14 bg-secondary-100 rounded-xl flex items-center justify-center mb-4">
                <CheckCircleIcon className="h-8 w-8 text-secondary-600" />
              </div>
              <h3 className="text-xl font-bold text-gray-900 mb-3">
                Sin Comisiones Ocultas
              </h3>
              <p className="text-gray-600">
                Transparencia total. Lo que ves es lo que pagas. Sin sorpresas 
                ni costos adicionales.
              </p>
            </div>

            {/* Beneficio 4 */}
            <div className="bg-gray-50 rounded-2xl p-8 hover:shadow-lg transition-shadow">
              <div className="w-14 h-14 bg-secondary-100 rounded-xl flex items-center justify-center mb-4">
                <DocumentTextIcon className="h-8 w-8 text-secondary-600" />
              </div>
              <h3 className="text-xl font-bold text-gray-900 mb-3">
                Contratos Legales
              </h3>
              <p className="text-gray-600">
                Plantillas de contratos revisadas por abogados. Protege tus 
                derechos en cada transacción.
              </p>
            </div>

            {/* Beneficio 5 */}
            <div className="bg-gray-50 rounded-2xl p-8 hover:shadow-lg transition-shadow">
              <div className="w-14 h-14 bg-secondary-100 rounded-xl flex items-center justify-center mb-4">
                <BanknotesIcon className="h-8 w-8 text-secondary-600" />
              </div>
              <h3 className="text-xl font-bold text-gray-900 mb-3">
                Pagos Seguros
              </h3>
              <p className="text-gray-600">
                Procesamiento de pagos encriptado y protegido. Tus datos 
                financieros siempre seguros.
              </p>
            </div>

            {/* Beneficio 6 */}
            <div className="bg-gray-50 rounded-2xl p-8 hover:shadow-lg transition-shadow">
              <div className="w-14 h-14 bg-secondary-100 rounded-xl flex items-center justify-center mb-4">
                <HomeIcon className="h-8 w-8 text-secondary-600" />
              </div>
              <h3 className="text-xl font-bold text-gray-900 mb-3">
                Miles de Propiedades
              </h3>
              <p className="text-gray-600">
                La mayor base de datos de propiedades en Perú. Encuentra 
                exactamente lo que buscas.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* CTA Final */}
      <section className="section-padding bg-gradient-to-br from-brand-navy to-blue-900 text-white">
        <div className="container-custom">
          <div className="max-w-3xl mx-auto text-center">
            <h2 className="text-3xl md:text-4xl font-bold mb-6">
              ¿Listo para Comenzar?
            </h2>
            <p className="text-xl text-white/90 mb-8">
              Únete a miles de usuarios que ya confían en RentaFacil. 
              Es gratis, rápido y seguro.
            </p>
            <div className="flex flex-wrap gap-4 justify-center">
              <Button
                as={Link}
                href="/registro"
                variant="secondary"
                size="lg"
                rightIcon={<ArrowRightIcon className="h-5 w-5" />}
              >
                Crear Cuenta Gratis
              </Button>
              <Button
                as={Link}
                href="/propiedades"
                variant="outline"
                size="lg"
                className="border-2 border-white text-white hover:bg-white hover:text-brand-navy"
              >
                Explorar Propiedades
              </Button>
            </div>
          </div>
        </div>
      </section>
    </Layout>
  )
}

export default ComoFuncionaPage

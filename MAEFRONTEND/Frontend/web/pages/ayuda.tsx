import { NextPage } from 'next'
import Head from 'next/head'
import { useState } from 'react'
import { Header } from '../components/common/Header'
import { Footer } from '../components/common/Footer'
import {
	QuestionMarkCircleIcon,
	MagnifyingGlassIcon,
	UserIcon,
	HomeIcon,
	ShieldCheckIcon,
	CreditCardIcon,
	ChatBubbleLeftRightIcon,
	PhoneIcon,
	EnvelopeIcon,
	ChevronDownIcon,
	ChevronUpIcon
} from '@heroicons/react/24/outline'

interface FAQ {
	id: number
	category: string
	question: string
	answer: string
}

const faqs: FAQ[] = [
	// Categoría: Cuenta y Registro
	{
		id: 1,
		category: 'Cuenta y Registro',
		question: '¿Cómo creo una cuenta en RentaFacil?',
		answer: 'Para crear una cuenta, haz clic en "Registrarse" en la parte superior derecha. Elige si eres propietario, inquilino o inmobiliaria, completa tus datos y verifica tu correo electrónico. ¡Es gratis y toma menos de 2 minutos!'
	},
	{
		id: 2,
		category: 'Cuenta y Registro',
		question: '¿Es gratis usar RentaFacil?',
		answer: 'Sí, crear una cuenta y buscar propiedades es completamente gratis. Los propietarios e inmobiliarias pueden publicar sus primeras propiedades sin costo. Consulta nuestros planes premium para funcionalidades avanzadas.'
	},
	{
		id: 3,
		category: 'Cuenta y Registro',
		question: '¿Puedo cambiar mi tipo de cuenta después de registrarme?',
		answer: 'Sí, puedes actualizar tu cuenta de usuario normal a propietario o agente inmobiliario en cualquier momento desde tu perfil. Solo necesitarás completar la verificación de identidad correspondiente.'
	},
	
	// Categoría: Búsqueda de Propiedades
	{
		id: 4,
		category: 'Búsqueda de Propiedades',
		question: '¿Cómo busco propiedades?',
		answer: 'Usa nuestra barra de búsqueda principal ingresando la ubicación deseada. Puedes filtrar por tipo de propiedad (departamentos, casas, cuartos), precio, número de habitaciones, servicios y más. También puedes explorar por distritos desde el menú "Propiedades".'
	},
	{
		id: 5,
		category: 'Búsqueda de Propiedades',
		question: '¿Qué significa "Tipo Airbnb"?',
		answer: 'Las propiedades "Tipo Airbnb" son alquileres temporales o vacacionales, ideales para estadías cortas. Incluyen alojamientos amoblados y servicios adicionales como WiFi, TV, cocina equipada, etc. Perfectos para visitantes o viajeros.'
	},
	{
		id: 6,
		category: 'Búsqueda de Propiedades',
		question: '¿Puedo guardar propiedades favoritas?',
		answer: 'Sí, haz clic en el ícono de corazón ❤️ en cualquier propiedad para agregarla a tus favoritos. Podrás verlas todas juntas en tu perfil y recibirás notificaciones si hay cambios en el precio o disponibilidad.'
	},
	
	// Categoría: Publicar Propiedades
	{
		id: 7,
		category: 'Publicar Propiedades',
		question: '¿Quién puede publicar propiedades?',
		answer: 'Propietarios con DNI verificado e inmobiliarias con RUC pueden publicar propiedades. Si eres usuario normal, puedes actualizar tu cuenta desde tu perfil haciendo clic en "Publicar" y completando la verificación de identidad.'
	},
	{
		id: 8,
		category: 'Publicar Propiedades',
		question: '¿Cuántas propiedades puedo publicar?',
		answer: 'Como propietario verificado, puedes publicar propiedades ilimitadas sin costo adicional. Las inmobiliarias tienen acceso a herramientas profesionales para gestionar múltiples propiedades de manera eficiente.'
	},
	{
		id: 9,
		category: 'Publicar Propiedades',
		question: '¿Cuánto tiempo tarda en aprobarse mi publicación?',
		answer: 'Las publicaciones se aprueban en menos de 24 horas. Nuestro equipo revisa que cumplan con nuestros estándares de calidad: fotos reales, información completa y datos verificables. Recibirás una notificación cuando esté activa.'
	},
	
	// Categoría: Seguridad y Verificación
	{
		id: 10,
		category: 'Seguridad y Verificación',
		question: '¿Cómo verifican las propiedades?',
		answer: 'Verificamos la identidad de los propietarios mediante DNI o RUC. Las propiedades deben incluir fotos reales, información completa y datos de contacto válidos. Los usuarios pueden reportar anuncios sospechosos para revisión inmediata.'
	},
	{
		id: 11,
		category: 'Seguridad y Verificación',
		question: '¿Qué hago si encuentro un anuncio fraudulento?',
		answer: 'Reporta inmediatamente el anuncio usando el botón "Reportar" en la página de la propiedad. Nunca transfieras dinero sin visitar la propiedad primero. RentaFacil no solicita pagos directos; solo conectamos a las partes.'
	},
	{
		id: 12,
		category: 'Seguridad y Verificación',
		question: '¿RentaFacil maneja los pagos?',
		answer: 'Actualmente RentaFacil es una plataforma de conexión. Los acuerdos de pago y contratos se realizan directamente entre propietario e inquilino. Recomendamos usar métodos de pago seguros y siempre firmar un contrato de alquiler formal.'
	},
	
	// Categoría: Contacto y Soporte
	{
		id: 13,
		category: 'Contacto y Soporte',
		question: '¿Cómo contacto al propietario de una propiedad?',
		answer: 'En cada anuncio encontrarás botones para "Contactar" o "WhatsApp". Debes estar registrado para ver la información completa de contacto. Los propietarios suelen responder en menos de 24 horas.'
	},
	{
		id: 14,
		category: 'Contacto y Soporte',
		question: '¿Ofrecen soporte telefónico?',
		answer: 'Como startup en crecimiento, actualmente ofrecemos soporte principalmente por correo electrónico (soporte@rentafacil.pe) y chat en nuestra web. Nuestro equipo responde en horario de 9am a 6pm, de lunes a sábado.'
	},
	{
		id: 15,
		category: 'Contacto y Soporte',
		question: '¿Puedo modificar o eliminar mi anuncio?',
		answer: 'Sí, desde tu Dashboard de propietario puedes editar, pausar o eliminar tus anuncios en cualquier momento. Los cambios se reflejan en tiempo real. También puedes actualizar precios, disponibilidad y fotos cuando lo necesites.'
	}
]

const categories = [
	{ name: 'Cuenta y Registro', icon: UserIcon, color: 'blue' },
	{ name: 'Búsqueda de Propiedades', icon: MagnifyingGlassIcon, color: 'green' },
	{ name: 'Publicar Propiedades', icon: HomeIcon, color: 'purple' },
	{ name: 'Seguridad y Verificación', icon: ShieldCheckIcon, color: 'orange' },
	{ name: 'Contacto y Soporte', icon: ChatBubbleLeftRightIcon, color: 'pink' }
]

const AyudaPage: NextPage = () => {
	const [searchQuery, setSearchQuery] = useState('')
	const [selectedCategory, setSelectedCategory] = useState<string | null>(null)
	const [expandedFAQ, setExpandedFAQ] = useState<number | null>(null)

	const filteredFAQs = faqs.filter(faq => {
		const matchesSearch = searchQuery === '' || 
			faq.question.toLowerCase().includes(searchQuery.toLowerCase()) ||
			faq.answer.toLowerCase().includes(searchQuery.toLowerCase())
		
		const matchesCategory = !selectedCategory || faq.category === selectedCategory

		return matchesSearch && matchesCategory
	})

	const toggleFAQ = (id: number) => {
		setExpandedFAQ(expandedFAQ === id ? null : id)
	}

	return (
		<>
			<Head>
				<title>Centro de Ayuda - RentaFacil | Preguntas Frecuentes y Soporte</title>
				<meta 
					name="description" 
					content="Encuentra respuestas a las preguntas más frecuentes sobre RentaFacil. Ayuda para buscar propiedades, publicar anuncios, seguridad y más."
				/>
				<meta name="keywords" content="ayuda, soporte, FAQ, preguntas frecuentes, contacto, rentafacil" />
			</Head>

			<Header />

			<main className="bg-gray-50 min-h-screen">
				{/* Hero Section */}
				<div className="bg-gradient-to-br from-brand-blue to-blue-700 text-white py-16 px-4">
					<div className="max-w-4xl mx-auto text-center">
						<QuestionMarkCircleIcon className="h-16 w-16 mx-auto mb-6 text-secondary-500" />
						<h1 className="text-4xl md:text-5xl font-bold mb-6">
							¿En qué podemos ayudarte?
						</h1>
						<p className="text-xl text-blue-100 mb-8">
							Encuentra respuestas rápidas a las preguntas más comunes
						</p>
						
						{/* Search Bar */}
						<div className="relative max-w-2xl mx-auto">
							<MagnifyingGlassIcon className="absolute left-4 top-1/2 -translate-y-1/2 h-6 w-6 text-gray-400" />
							<input
								type="text"
								placeholder="Busca tu pregunta aquí..."
								value={searchQuery}
								onChange={(e) => setSearchQuery(e.target.value)}
								className="w-full pl-12 pr-4 py-4 rounded-xl text-gray-900 text-lg focus:outline-none focus:ring-4 focus:ring-secondary-500/50"
							/>
						</div>
					</div>
				</div>

				{/* Categories */}
				<section className="max-w-7xl mx-auto px-4 -mt-8 mb-12">
					<div className="grid sm:grid-cols-2 lg:grid-cols-5 gap-4">
						{categories.map((category) => {
							const Icon = category.icon
							const isSelected = selectedCategory === category.name
							
							return (
								<button
									key={category.name}
									onClick={() => setSelectedCategory(isSelected ? null : category.name)}
									className={`bg-white rounded-xl p-6 shadow-md hover:shadow-lg transition-all ${
										isSelected ? 'ring-2 ring-brand-blue' : ''
									}`}
								>
									<Icon className={`h-8 w-8 mx-auto mb-3 ${
										isSelected ? 'text-brand-blue' : 'text-gray-400'
									}`} />
									<h3 className={`text-sm font-semibold text-center ${
										isSelected ? 'text-brand-blue' : 'text-gray-700'
									}`}>
										{category.name}
									</h3>
								</button>
							)
						})}
					</div>
				</section>

				{/* FAQs */}
				<section className="max-w-4xl mx-auto px-4 pb-16">
					<div className="bg-white rounded-2xl shadow-md p-8">
						<h2 className="text-2xl font-bold text-gray-900 mb-6">
							{selectedCategory ? `${selectedCategory}` : 'Preguntas Frecuentes'}
						</h2>
						
						{filteredFAQs.length === 0 ? (
							<div className="text-center py-12">
								<QuestionMarkCircleIcon className="h-16 w-16 mx-auto text-gray-300 mb-4" />
								<p className="text-gray-500 text-lg">
									No encontramos preguntas que coincidan con tu búsqueda.
								</p>
								<button
									onClick={() => {
										setSearchQuery('')
										setSelectedCategory(null)
									}}
									className="mt-4 text-brand-blue hover:underline font-medium"
								>
									Limpiar filtros
								</button>
							</div>
						) : (
							<div className="space-y-4">
								{filteredFAQs.map((faq) => (
									<div
										key={faq.id}
										className="border border-gray-200 rounded-lg overflow-hidden hover:border-brand-blue transition-colors"
									>
										<button
											onClick={() => toggleFAQ(faq.id)}
											className="w-full flex items-center justify-between p-5 text-left hover:bg-gray-50 transition-colors"
										>
											<div className="flex-1">
												<span className="text-xs font-semibold text-brand-blue uppercase tracking-wide">
													{faq.category}
												</span>
												<h3 className="text-lg font-semibold text-gray-900 mt-1">
													{faq.question}
												</h3>
											</div>
											{expandedFAQ === faq.id ? (
												<ChevronUpIcon className="h-6 w-6 text-gray-400 flex-shrink-0 ml-4" />
											) : (
												<ChevronDownIcon className="h-6 w-6 text-gray-400 flex-shrink-0 ml-4" />
											)}
										</button>
										
										{expandedFAQ === faq.id && (
											<div className="px-5 pb-5 pt-2 bg-gray-50 border-t border-gray-200">
												<p className="text-gray-700 leading-relaxed">
													{faq.answer}
												</p>
											</div>
										)}
									</div>
								))}
							</div>
						)}
					</div>
				</section>

				{/* Contact Support */}
				<section className="max-w-7xl mx-auto px-4 pb-16">
					<div className="bg-gradient-to-br from-brand-blue to-blue-700 rounded-3xl p-12 text-white">
						<div className="text-center mb-12">
							<h2 className="text-3xl font-bold mb-4">¿No encontraste lo que buscabas?</h2>
							<p className="text-xl text-blue-100">
								Nuestro equipo está aquí para ayudarte
							</p>
						</div>

						<div className="grid md:grid-cols-3 gap-8">
							{/* Email */}
							<div className="bg-white/10 backdrop-blur rounded-xl p-6 text-center hover:bg-white/20 transition-colors">
								<div className="mx-auto w-16 h-16 bg-white/20 rounded-full flex items-center justify-center mb-4">
									<EnvelopeIcon className="h-8 w-8 text-white" />
								</div>
								<h3 className="text-xl font-bold mb-2">Email</h3>
								<p className="text-blue-100 mb-4">Respuesta en 24 horas</p>
								<a 
									href="mailto:soporte@rentafacil.pe" 
									className="text-secondary-500 font-semibold hover:underline"
								>
									soporte@rentafacil.pe
								</a>
							</div>

							{/* WhatsApp */}
							<div className="bg-white/10 backdrop-blur rounded-xl p-6 text-center hover:bg-white/20 transition-colors">
								<div className="mx-auto w-16 h-16 bg-white/20 rounded-full flex items-center justify-center mb-4">
									<ChatBubbleLeftRightIcon className="h-8 w-8 text-white" />
								</div>
								<h3 className="text-xl font-bold mb-2">WhatsApp</h3>
								<p className="text-blue-100 mb-4">Lun - Sáb: 9am - 6pm</p>
								<a 
									href="https://wa.me/51999999999" 
									target="_blank"
									rel="noopener noreferrer"
									className="text-secondary-500 font-semibold hover:underline"
								>
									+51 999 999 999
								</a>
							</div>

							{/* Chat en Vivo */}
							<div className="bg-white/10 backdrop-blur rounded-xl p-6 text-center hover:bg-white/20 transition-colors">
								<div className="mx-auto w-16 h-16 bg-white/20 rounded-full flex items-center justify-center mb-4">
									<PhoneIcon className="h-8 w-8 text-white" />
								</div>
								<h3 className="text-xl font-bold mb-2">Chat en Vivo</h3>
								<p className="text-blue-100 mb-4">Horario de oficina</p>
								<button className="text-secondary-500 font-semibold hover:underline">
									Iniciar chat
								</button>
							</div>
						</div>
					</div>
				</section>

				{/* Quick Links */}
				<section className="max-w-4xl mx-auto px-4 pb-16">
					<div className="bg-white rounded-2xl shadow-md p-8">
						<h2 className="text-2xl font-bold text-gray-900 mb-6">Enlaces Rápidos</h2>
						<div className="grid sm:grid-cols-2 gap-4">
							<a href="/registro" className="flex items-center gap-3 p-4 rounded-lg hover:bg-gray-50 transition-colors">
								<UserIcon className="h-6 w-6 text-brand-blue" />
								<div>
									<h3 className="font-semibold text-gray-900">Crear Cuenta</h3>
									<p className="text-sm text-gray-600">Regístrate en RentaFacil</p>
								</div>
							</a>
							<a href="/buscar" className="flex items-center gap-3 p-4 rounded-lg hover:bg-gray-50 transition-colors">
								<MagnifyingGlassIcon className="h-6 w-6 text-green-600" />
								<div>
									<h3 className="font-semibold text-gray-900">Buscar Propiedades</h3>
									<p className="text-sm text-gray-600">Encuentra tu hogar ideal</p>
								</div>
							</a>
							<a href="/publish" className="flex items-center gap-3 p-4 rounded-lg hover:bg-gray-50 transition-colors">
								<HomeIcon className="h-6 w-6 text-purple-600" />
								<div>
									<h3 className="font-semibold text-gray-900">Publicar Propiedad</h3>
									<p className="text-sm text-gray-600">Anuncia tu inmueble</p>
								</div>
							</a>
							<a href="/nosotros" className="flex items-center gap-3 p-4 rounded-lg hover:bg-gray-50 transition-colors">
								<QuestionMarkCircleIcon className="h-6 w-6 text-orange-600" />
								<div>
									<h3 className="font-semibold text-gray-900">Sobre Nosotros</h3>
									<p className="text-sm text-gray-600">Conoce RentaFacil</p>
								</div>
							</a>
						</div>
					</div>
				</section>
			</main>

			<Footer />
		</>
	)
}

export default AyudaPage

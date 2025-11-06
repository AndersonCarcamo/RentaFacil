import { NextPage } from 'next'
import Head from 'next/head'
import { Header } from '../components/common/Header'
import { Footer } from '../components/common/Footer'
import { 
	BuildingOfficeIcon,
	UserGroupIcon,
	LightBulbIcon,
	ChartBarIcon,
	HeartIcon,
	ShieldCheckIcon,
	MapPinIcon,
	ClockIcon
} from '@heroicons/react/24/outline'

const NosotrosPage: NextPage = () => {
	return (
		<>
			<Head>
				<title>Sobre Nosotros - RentaFacil | Tu plataforma de confianza para alquileres</title>
				<meta 
					name="description" 
					content="Conoce RentaFacil, la startup que revoluciona el mercado de alquileres en Perú. Conectamos arrendadores e inquilinos de manera fácil, rápida y segura."
				/>
				<meta name="keywords" content="sobre nosotros, rentafacil, startup alquileres, misión, visión, equipo" />
				<meta property="og:title" content="Sobre Nosotros - RentaFacil" />
				<meta property="og:description" content="Conoce la startup que está transformando el mercado de alquileres en Perú" />
				<meta property="og:type" content="website" />
			</Head>

			<Header />

			<main className="bg-white">
				{/* Hero Section */}
				<div className="relative bg-gradient-to-br from-brand-blue to-blue-700 text-white py-20 px-4">
					<div className="max-w-7xl mx-auto text-center">
						<h1 className="text-4xl md:text-5xl font-bold mb-6">
							Sobre <span className="text-secondary-500">RentaFacil</span>
						</h1>
						<p className="text-xl md:text-2xl max-w-3xl mx-auto text-blue-100">
							Una plataforma peruana que facilita la forma en que las personas encuentran su próximo hogar
						</p>
					</div>
				</div>

				{/* Nuestra Historia */}
				<section className="max-w-7xl mx-auto px-4 py-16">
					<div className="grid md:grid-cols-2 gap-12 items-center">
						<div>
							<h2 className="text-3xl font-bold text-gray-900 mb-6">
								Nuestra Historia
							</h2>
							<div className="space-y-4 text-gray-700 text-lg">
								<p>
									<strong className="text-brand-blue">RentaFacil</strong> nace de una necesidad real: simplificar el proceso de búsqueda y alquiler de propiedades en Perú.
								</p>
								<p>
									Entendemos los desafíos del mercado inmobiliario tradicional: 
									procesos lentos, falta de transparencia, y dificultad para conectar directamente 
									con propietarios e inquilinos confiables.
								</p>
								<p>
									Por eso creamos una plataforma tecnológica que elimina intermediarios innecesarios, 
									reduce costos y brinda una experiencia moderna, segura y eficiente para todos.
								</p>
							</div>
						</div>
						<div className="relative">
							<div className="bg-gradient-to-br from-secondary-500/20 to-brand-blue/10 rounded-2xl p-8 h-full flex items-center justify-center">
								<BuildingOfficeIcon className="h-48 w-48 text-brand-blue opacity-20" />
							</div>
						</div>
					</div>
				</section>

				{/* Misión y Visión */}
				<section className="bg-gray-50 py-16">
					<div className="max-w-7xl mx-auto px-4">
						<div className="grid md:grid-cols-2 gap-8">
							{/* Misión */}
							<div className="bg-white rounded-2xl p-8 shadow-md hover:shadow-xl transition-shadow">
								<div className="flex items-center gap-4 mb-6">
									<div className="p-4 bg-brand-blue/10 rounded-xl">
										<HeartIcon className="h-8 w-8 text-brand-blue" />
									</div>
									<h3 className="text-2xl font-bold text-gray-900">Nuestra Misión</h3>
								</div>
								<p className="text-gray-700 text-lg leading-relaxed">
									Democratizar el acceso al mercado inmobiliario de alquiler, conectando 
									arrendadores e inquilinos de manera directa, transparente y eficiente mediante 
									tecnología innovadora que genere confianza y simplifique cada paso del proceso.
								</p>
							</div>

							{/* Visión */}
							<div className="bg-white rounded-2xl p-8 shadow-md hover:shadow-xl transition-shadow">
								<div className="flex items-center gap-4 mb-6">
									<div className="p-4 bg-purple-500/10 rounded-xl">
										<LightBulbIcon className="h-8 w-8 text-purple-600" />
									</div>
									<h3 className="text-2xl font-bold text-gray-900">Nuestra Visión</h3>
								</div>
								<p className="text-gray-700 text-lg leading-relaxed">
									Convertirnos en la plataforma líder de alquileres en Perú, siendo reconocidos 
									por nuestra innovación tecnológica, seguridad y compromiso con mejorar la 
									experiencia de millones de peruanos en su búsqueda del hogar ideal.
								</p>
							</div>
						</div>
					</div>
				</section>

				{/* Nuestros Valores */}
				<section className="max-w-7xl mx-auto px-4 py-16">
					<h2 className="text-3xl font-bold text-center text-gray-900 mb-12">
						Nuestros Valores
					</h2>
					<div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-8">
						<div className="text-center">
							<div className="mx-auto w-16 h-16 bg-blue-100 rounded-full flex items-center justify-center mb-4">
								<ShieldCheckIcon className="h-8 w-8 text-brand-blue" />
							</div>
							<h3 className="text-xl font-bold text-gray-900 mb-2">Confianza</h3>
							<p className="text-gray-600">
								Verificación de identidad y transparencia en cada transacción
							</p>
						</div>

						<div className="text-center">
							<div className="mx-auto w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mb-4">
								<ClockIcon className="h-8 w-8 text-green-600" />
							</div>
							<h3 className="text-xl font-bold text-gray-900 mb-2">Eficiencia</h3>
							<p className="text-gray-600">
								Procesos rápidos y simples, sin complicaciones innecesarias
							</p>
						</div>

						<div className="text-center">
							<div className="mx-auto w-16 h-16 bg-purple-100 rounded-full flex items-center justify-center mb-4">
								<LightBulbIcon className="h-8 w-8 text-purple-600" />
							</div>
							<h3 className="text-xl font-bold text-gray-900 mb-2">Innovación</h3>
							<p className="text-gray-600">
								Tecnología de punta para mejorar constantemente la experiencia
							</p>
						</div>

						<div className="text-center">
							<div className="mx-auto w-16 h-16 bg-orange-100 rounded-full flex items-center justify-center mb-4">
								<UserGroupIcon className="h-8 w-8 text-orange-600" />
							</div>
							<h3 className="text-xl font-bold text-gray-900 mb-2">Comunidad</h3>
							<p className="text-gray-600">
								Construimos relaciones duraderas con nuestros usuarios
							</p>
						</div>
					</div>
				</section>

				{/* Nuestro Enfoque */}
				<section className="bg-gradient-to-br from-blue-50 to-indigo-50 py-16">
					<div className="max-w-7xl mx-auto px-4">
						<h2 className="text-3xl font-bold text-center text-gray-900 mb-12">
							Nuestro Enfoque
						</h2>
						<div className="grid md:grid-cols-2 gap-8 max-w-4xl mx-auto">
							{/* Tecnología */}
							<div className="bg-white rounded-xl p-8 shadow-md">
								<div className="flex items-center gap-3 mb-4">
									<div className="p-3 bg-brand-blue/10 rounded-lg">
										<ChartBarIcon className="h-6 w-6 text-brand-blue" />
									</div>
									<h3 className="text-xl font-bold text-gray-900">Tecnología Simple</h3>
								</div>
								<ul className="space-y-3 text-gray-700">
									<li className="flex items-start gap-2">
										<span className="text-brand-blue mt-1">•</span>
										<span>Plataforma intuitiva y fácil de usar</span>
									</li>
									<li className="flex items-start gap-2">
										<span className="text-brand-blue mt-1">•</span>
										<span>Búsqueda optimizada con filtros precisos</span>
									</li>
									<li className="flex items-start gap-2">
										<span className="text-brand-blue mt-1">•</span>
										<span>Publicación de propiedades en minutos</span>
									</li>
									<li className="flex items-start gap-2">
										<span className="text-brand-blue mt-1">•</span>
										<span>Acceso desde cualquier dispositivo</span>
									</li>
								</ul>
							</div>

							{/* Seguridad */}
							<div className="bg-white rounded-xl p-8 shadow-md">
								<div className="flex items-center gap-3 mb-4">
									<div className="p-3 bg-secondary-500/20 rounded-lg">
										<ShieldCheckIcon className="h-6 w-6 text-brand-blue" />
									</div>
									<h3 className="text-xl font-bold text-gray-900">Seguridad y Confianza</h3>
								</div>
								<ul className="space-y-3 text-gray-700">
									<li className="flex items-start gap-2">
										<span className="text-brand-blue mt-1">•</span>
										<span>Verificación de identidad de usuarios</span>
									</li>
									<li className="flex items-start gap-2">
										<span className="text-brand-blue mt-1">•</span>
										<span>Información transparente y actualizada</span>
									</li>
									<li className="flex items-start gap-2">
										<span className="text-brand-blue mt-1">•</span>
										<span>Sistema de reportes y moderación</span>
									</li>
									<li className="flex items-start gap-2">
										<span className="text-brand-blue mt-1">•</span>
										<span>Protección de datos personales</span>
									</li>
								</ul>
							</div>
						</div>
					</div>
				</section>

				{/* Nuestro Compromiso */}
				<section className="max-w-7xl mx-auto px-4 py-16">
					<div className="bg-gradient-to-br from-brand-blue to-blue-700 rounded-3xl p-12 text-white text-center">
						<h2 className="text-3xl font-bold mb-6">Nuestro Compromiso Contigo</h2>
						<p className="text-xl max-w-3xl mx-auto mb-8 text-blue-100">
							Trabajamos continuamente para ofrecerte la mejor experiencia en búsqueda y 
							publicación de propiedades, con transparencia, seguridad y facilidad de uso.
						</p>
						<div className="flex flex-wrap justify-center gap-8 text-lg">
							<div className="flex items-center gap-2">
								<MapPinIcon className="h-6 w-6 text-secondary-500" />
								<span>Cobertura en Lima</span>
							</div>
							<div className="flex items-center gap-2">
								<ShieldCheckIcon className="h-6 w-6 text-secondary-500" />
								<span>Verificación de usuarios</span>
							</div>
							<div className="flex items-center gap-2">
								<ClockIcon className="h-6 w-6 text-secondary-500" />
								<span>Soporte disponible</span>
							</div>
						</div>
					</div>
				</section>

				{/* CTA Final */}
				<section className="bg-gray-50 py-16">
					<div className="max-w-4xl mx-auto text-center px-4">
						<h2 className="text-3xl font-bold text-gray-900 mb-6">
							¿Listo para encontrar tu próximo hogar?
						</h2>
						<p className="text-xl text-gray-700 mb-8">
							Comienza a buscar propiedades o publica tu inmueble de manera fácil y rápida
						</p>
						<div className="flex flex-wrap justify-center gap-4">
							<a
								href="/alquiler/apartment/lima"
								className="inline-flex items-center px-8 py-4 text-lg font-semibold text-white bg-brand-blue rounded-lg hover:bg-blue-700 transition-colors shadow-lg"
							>
								Buscar Propiedades
							</a>
							<a
								href="/registro"
								className="inline-flex items-center px-8 py-4 text-lg font-semibold text-brand-navy bg-secondary-500 rounded-lg hover:bg-secondary-500/90 transition-colors shadow-lg"
							>
								Crear Cuenta
							</a>
						</div>
					</div>
				</section>
			</main>

			<Footer />
		</>
	)
}

export default NosotrosPage

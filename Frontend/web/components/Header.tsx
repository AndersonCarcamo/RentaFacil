import { useState, Fragment, useEffect } from 'react'
import Link from 'next/link'
import Image from 'next/image'
import { useRouter } from 'next/router'
import { Dialog, Disclosure, Popover, Transition, Menu } from '@headlessui/react'
import { useAuth } from '../lib/hooks/useAuth'
import { 
	Bars3Icon, 
	XMarkIcon,
	HomeIcon,
	BuildingOfficeIcon,
	KeyIcon,
	PlusIcon,
	UserIcon,
	HeartIcon,
	BellIcon,
	MagnifyingGlassIcon,
	ArrowRightOnRectangleIcon,
	UserCircleIcon,
	ChartBarIcon,
	IdentificationIcon,
	CheckIcon,
	ExclamationTriangleIcon,
	ShieldCheckIcon,
	UsersIcon
} from '@heroicons/react/24/outline'
import { ChevronDownIcon } from '@heroicons/react/20/solid'
import { createPortal } from 'react-dom'

const propertyTypes = [
	{ 
		name: 'Departamentos', 
		description: 'Encuentra departamentos en toda la ciudad', 
		href: '/departamentos', 
		icon: BuildingOfficeIcon 
	},
	{ 
		name: 'Casas', 
		description: 'Casas familiares y unifamiliares', 
		href: '/casas', 
		icon: HomeIcon 
	},
	{ 
		name: 'Cuartos', 
		description: 'Habitaciones individuales para estudiantes', 
		href: '/cuartos', 
		icon: KeyIcon 
	},
	{ 
		name: 'Tipo Airbnb', 
		description: 'Alquileres temporales y vacacionales', 
		href: '/airbnb', 
		icon: HomeIcon 
	},
]

function classNames(...classes: string[]) {
	return classes.filter(Boolean).join(' ')
}

// Helper to get full avatar URL
function getAvatarUrl(avatarUrl: string | null | undefined): string | null {
	if (!avatarUrl) return null;
	
	// If already a full URL, return as is
	if (avatarUrl.startsWith('http://') || avatarUrl.startsWith('https://')) {
		return avatarUrl;
	}
	
	// Otherwise, prepend API base URL
	const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000';
	return `${API_BASE_URL}${avatarUrl}`;
}

export function Header() {
	const [mobileMenuOpen, setMobileMenuOpen] = useState(false)
	const [showPublishModal, setShowPublishModal] = useState(false)
	const [showRoleUpgradeModal, setShowRoleUpgradeModal] = useState(false)
	const [selectedRole, setSelectedRole] = useState<'landlord' | 'agent' | null>(null)
	const [formData, setFormData] = useState({
		national_id: '',
		agency_name: ''
	})
	const [isSubmittingRole, setIsSubmittingRole] = useState(false)
	const [roleSubmitError, setRoleSubmitError] = useState('')
	const [isMounted, setIsMounted] = useState(false)
	const { user, isLoggedIn, logout, updateUserRole } = useAuth()
	const router = useRouter()

	useEffect(() => {
		// ensure document is available for portals (client-side only)
		setIsMounted(true)
		
		// Debug: Log complete user object
		if (user) {
			console.log('👤 COMPLETE USER OBJECT:', JSON.stringify(user, null, 2))
			console.log('🏢 agency_name field:', user.agency_name)
			console.log('📧 email:', user.email)
			console.log('🎭 role:', user.role)
		}
	}, [user])

	const handlePublishClick = () => {
		console.log('🖱️ Click en Publicar desde Header')
		
		// Si no está autenticado, mostrar modal de registro
		if (!user) {
			console.log('❌ No autenticado - Mostrando modal de registro')
			setShowPublishModal(true)
			return
		}

		// Si es usuario normal, mostrar modal para upgrade de rol
		if (user.role === 'user') {
			console.log('👤 Usuario normal - Mostrando modal para upgrade de rol')
			setShowRoleUpgradeModal(true)
			return
		}

		// Si es landlord o agent, ir directo a crear propiedad
		if (user.role === 'landlord' || user.role === 'agent') {
			console.log('✅ Usuario autorizado - Redirigiendo a /dashboard/create-listing')
			router.push('/dashboard/create-listing')
			return
		}

		// Default: mostrar modal de upgrade
		console.log('⚠️ Caso no manejado - Mostrando modal de upgrade')
		setShowRoleUpgradeModal(true)
	}

	const handleLogout = async () => {
		try {
			await logout()
			window.location.href = '/'
		} catch (error) {
			console.error('Error logging out:', error)
		}
	}

	const handleRoleSelection = (role: 'landlord' | 'agent') => {
		setSelectedRole(role)
		setFormData({ national_id: '', agency_name: '' })
		setRoleSubmitError('')
	}

	const handleRoleSubmit = async () => {
		if (!selectedRole) return

		// Validación
		if (!formData.national_id.trim()) {
			setRoleSubmitError('El DNI es obligatorio')
			return
		}

		if (selectedRole === 'agent' && !formData.agency_name.trim()) {
			setRoleSubmitError('El nombre de la inmobiliaria es obligatorio para agentes')
			return
		}

		setIsSubmittingRole(true)
		setRoleSubmitError('')

		try {
			const roleData = {
				role: selectedRole,
				national_id: formData.national_id,
				national_id_type: selectedRole === 'agent' ? 'RUC' : 'DNI',
				...(selectedRole === 'agent' && {
					agency_name: formData.agency_name
				})
			}

			await updateUserRole(roleData)
			
			// Cerrar modal y redirigir
			setShowRoleUpgradeModal(false)
			setSelectedRole(null)
			router.push('/publish')
		} catch (error) {
			console.error('Error updating role:', error)
			setRoleSubmitError(error instanceof Error ? error.message : 'Error al actualizar el rol')
		} finally {
			setIsSubmittingRole(false)
		}
	}

	const closeRoleUpgradeModal = () => {
		setShowRoleUpgradeModal(false)
		setSelectedRole(null)
		setFormData({ national_id: '', agency_name: '' })
		setRoleSubmitError('')
	}

	// Render modal via portal so it isn't clipped by header's transform stacking context
	const modalContent = (
		<div className="fixed inset-0 z-[9999] overflow-y-auto">
			<div className="flex min-h-full items-center justify-center p-4 text-center">
				{/* Overlay */}
				<div
					className="fixed inset-0 bg-black/30 backdrop-blur-sm transition-opacity"
					onClick={() => setShowPublishModal(false)}
				/>

				{/* Modal Content */}
				<div className="relative transform overflow-hidden rounded-2xl bg-white p-8 text-left shadow-2xl transition-all w-full max-w-2xl">
					<button
						onClick={() => setShowPublishModal(false)}
						className="absolute top-4 right-4 text-gray-400 hover:text-gray-600 transition-colors"
					>
						<XMarkIcon className="h-6 w-6" />
					</button>

					<div className="text-center mb-8">
						<h3 className="text-3xl font-bold text-gray-900 mb-2">¡Publica tu propiedad!</h3>
						<p className="text-gray-600">Selecciona el tipo de cuenta que mejor se adapte a tus necesidades</p>
					</div>

					<div className="grid md:grid-cols-2 gap-6">
						<button
							onClick={() => {
								setShowPublishModal(false)
								router.push('/register?type=landlord')
							}}
							className="group relative bg-gradient-to-br from-blue-50 to-cyan-50 rounded-xl p-6 text-left hover:shadow-xl transition-all duration-300 border-2 border-transparent hover:border-brand-blue"
						>
							<div className="flex items-start gap-4 mb-4">
								<div className="p-3 bg-brand-blue/10 rounded-lg group-hover:bg-brand-blue/20 transition-colors">
									<HomeIcon className="h-8 w-8 text-brand-blue" />
								</div>
								<div>
									<h4 className="text-xl font-bold text-gray-900 mb-1">Soy Propietario</h4>
									<p className="text-sm text-gray-600">Tengo una o más propiedades</p>
								</div>
							</div>
							<ul className="space-y-2 text-sm text-gray-700">
								<li className="flex items-center gap-2"><span className="text-brand-blue">✓</span> Publica propiedades ilimitadas</li>
								<li className="flex items-center gap-2"><span className="text-brand-blue">✓</span> Panel de control personal</li>
								<li className="flex items-center gap-2"><span className="text-brand-blue">✓</span> Gestión directa con inquilinos</li>
							</ul>
							<div className="mt-4 text-brand-blue font-semibold group-hover:translate-x-1 transition-transform">Comenzar como propietario →</div>
						</button>

						<button
							onClick={() => {
								setShowPublishModal(false)
								router.push('/register?type=agent')
							}}
							className="group relative bg-gradient-to-br from-purple-50 to-pink-50 rounded-xl p-6 text-left hover:shadow-xl transition-all duration-300 border-2 border-transparent hover:border-purple-500"
						>
							<div className="flex items-start gap-4 mb-4">
								<div className="p-3 bg-purple-500/10 rounded-lg group-hover:bg-purple-500/20 transition-colors">
									<BuildingOfficeIcon className="h-8 w-8 text-purple-600" />
								</div>
								<div>
									<h4 className="text-xl font-bold text-gray-900 mb-1">Soy Inmobiliaria</h4>
									<p className="text-sm text-gray-600">Agencia o corredor profesional</p>
								</div>
							</div>
							<ul className="space-y-2 text-sm text-gray-700">
								<li className="flex items-center gap-2"><span className="text-purple-600">✓</span> Gestión multi-propiedad</li>
								<li className="flex items-center gap-2"><span className="text-purple-600">✓</span> Herramientas profesionales</li>
								<li className="flex items-center gap-2"><span className="text-purple-600">✓</span> Perfil empresarial destacado</li>
							</ul>
							<div className="mt-4 text-purple-600 font-semibold group-hover:translate-x-1 transition-transform">Comenzar como inmobiliaria →</div>
						</button>
					</div>

					<div className="mt-6 text-center text-sm text-gray-500">¿Ya tienes cuenta?{' '}
						<button
							onClick={() => {
								setShowPublishModal(false)
								router.push('/login')
							}}
							className="text-brand-blue hover:text-brand-blue/80 font-medium"
						>
							Inicia sesión aquí
						</button>
					</div>
				</div>
			</div>
		</div>
	)

	// Modal de upgrade de rol para usuarios existentes
	const roleUpgradeModalContent = (
		<div className="fixed inset-0 z-[9999] overflow-y-auto">
			<div className="flex min-h-full items-center justify-center p-4 text-center">
				{/* Overlay */}
				<div
					className="fixed inset-0 bg-black/30 backdrop-blur-sm transition-opacity"
					onClick={closeRoleUpgradeModal}
				/>

				{/* Modal Content */}
				<div className="relative transform overflow-hidden rounded-2xl bg-white p-8 text-left shadow-2xl transition-all w-full max-w-2xl">
					<button
						onClick={closeRoleUpgradeModal}
						className="absolute top-4 right-4 text-gray-400 hover:text-gray-600 transition-colors"
					>
						<XMarkIcon className="h-6 w-6" />
					</button>

					<div className="text-center mb-8">
						<div className="mx-auto w-16 h-16 bg-blue-100 rounded-full flex items-center justify-center mb-4">
							<HomeIcon className="w-8 h-8 text-blue-600" />
						</div>
						<h3 className="text-3xl font-bold text-gray-900 mb-2">
							¡Actualiza tu cuenta para publicar!
						</h3>
						<p className="text-gray-600">
							Para publicar propiedades necesitas actualizar tu cuenta. Selecciona el tipo que mejor se adapte a ti.
						</p>
					</div>

					{!selectedRole ? (
						// Selección de rol
						<div className="grid md:grid-cols-2 gap-6">
							<button
								onClick={() => handleRoleSelection('landlord')}
								className="group relative bg-gradient-to-br from-blue-50 to-cyan-50 rounded-xl p-6 text-left hover:shadow-xl transition-all duration-300 border-2 border-transparent hover:border-blue-500"
							>
								<div className="flex items-start gap-4 mb-4">
									<div className="p-3 bg-blue-500/10 rounded-lg group-hover:bg-blue-500/20 transition-colors">
										<HomeIcon className="h-8 w-8 text-blue-600" />
									</div>
									<div>
										<h4 className="text-xl font-bold text-gray-900 mb-1">Soy Propietario</h4>
										<p className="text-sm text-gray-600">Tengo una o más propiedades</p>
									</div>
								</div>
								<ul className="space-y-2 text-sm text-gray-700">
									<li className="flex items-center gap-2"><CheckIcon className="w-4 h-4 text-blue-600" /> Publica propiedades</li>
									<li className="flex items-center gap-2"><CheckIcon className="w-4 h-4 text-blue-600" /> Panel de control personal</li>
									<li className="flex items-center gap-2"><CheckIcon className="w-4 h-4 text-blue-600" /> Gestión directa</li>
								</ul>
							</button>

							<button
								onClick={() => handleRoleSelection('agent')}
								className="group relative bg-gradient-to-br from-purple-50 to-pink-50 rounded-xl p-6 text-left hover:shadow-xl transition-all duration-300 border-2 border-transparent hover:border-purple-500"
							>
								<div className="flex items-start gap-4 mb-4">
									<div className="p-3 bg-purple-500/10 rounded-lg group-hover:bg-purple-500/20 transition-colors">
										<BuildingOfficeIcon className="h-8 w-8 text-purple-600" />
									</div>
									<div>
										<h4 className="text-xl font-bold text-gray-900 mb-1">Soy Inmobiliaria</h4>
										<p className="text-sm text-gray-600">Agencia o corredor profesional</p>
									</div>
								</div>
								<ul className="space-y-2 text-sm text-gray-700">
									<li className="flex items-center gap-2"><CheckIcon className="w-4 h-4 text-purple-600" /> Gestión multi-propiedad</li>
									<li className="flex items-center gap-2"><CheckIcon className="w-4 h-4 text-purple-600" /> Herramientas profesionales</li>
									<li className="flex items-center gap-2"><CheckIcon className="w-4 h-4 text-purple-600" /> Perfil empresarial</li>
								</ul>
							</button>
						</div>
					) : (
						// Formulario de datos adicionales
						<div className="space-y-6">
							<div className="bg-blue-50 rounded-lg p-4 mb-6">
								<div className="flex items-center gap-3">
									{selectedRole === 'landlord' ? (
										<HomeIcon className="w-6 h-6 text-blue-600" />
									) : (
										<BuildingOfficeIcon className="w-6 h-6 text-purple-600" />
									)}
									<div>
										<h4 className="font-semibold text-gray-900">
											{selectedRole === 'landlord' ? 'Propietario' : 'Inmobiliaria'}
										</h4>
										<p className="text-sm text-gray-600">
											Completa la información requerida para verificar tu identidad
										</p>
									</div>
								</div>
							</div>

							{roleSubmitError && (
								<div className="bg-red-50 border border-red-200 rounded-lg p-4 flex items-center gap-3">
									<ExclamationTriangleIcon className="w-5 h-5 text-red-600 flex-shrink-0" />
									<p className="text-sm text-red-700">{roleSubmitError}</p>
								</div>
							)}

							<div>
								<label className="block text-sm font-medium text-gray-700 mb-2">
									<IdentificationIcon className="w-4 h-4 inline mr-1" />
									{selectedRole === 'agent' ? 'RUC *' : 'DNI *'}
								</label>
								<input
									type="text"
									value={formData.national_id}
									onChange={(e) => setFormData(prev => ({ ...prev, national_id: e.target.value }))}
									className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
									placeholder={selectedRole === 'agent' ? 'Ingresa el RUC de tu inmobiliaria' : 'Ingresa tu DNI'}
									maxLength={selectedRole === 'agent' ? 11 : 8}
								/>
								<p className="text-xs text-gray-500 mt-1">
									{selectedRole === 'agent' 
										? 'RUC de la inmobiliaria para verificar la empresa'
										: 'Necesitamos verificar tu identidad para garantizar la seguridad de la plataforma'
									}
								</p>
							</div>

							{selectedRole === 'agent' && (
								<>
									<div>
										<label className="block text-sm font-medium text-gray-700 mb-2">
											Nombre de la Inmobiliaria *
										</label>
										<input
											type="text"
											value={formData.agency_name}
											onChange={(e) => setFormData(prev => ({ ...prev, agency_name: e.target.value }))}
											className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-purple-500"
											placeholder="Ej: Inmobiliaria López S.A.C."
										/>
									</div>


								</>
							)}

							<div className="flex gap-3 pt-4">
								<button
									onClick={() => setSelectedRole(null)}
									className="flex-1 px-4 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition-colors"
								>
									Atrás
								</button>
								<button
									onClick={handleRoleSubmit}
									disabled={isSubmittingRole}
									className={`flex-1 px-4 py-2 rounded-lg text-white font-medium transition-colors ${
										selectedRole === 'landlord' 
											? 'bg-blue-600 hover:bg-blue-700 disabled:bg-blue-400' 
											: 'bg-purple-600 hover:bg-purple-700 disabled:bg-purple-400'
									}`}
								>
									{isSubmittingRole ? 'Actualizando...' : 'Continuar'}
								</button>
							</div>
						</div>
					)}
				</div>
			</div>
		</div>
	)

	return (
		<>
			<header className="sticky top-0 z-[500] border-b border-gray-200 bg-white/90 backdrop-blur supports-[backdrop-filter]:bg-white/70">
				{/* Grid de 3 columnas para centrar logo */}
				<div className="mx-auto grid max-w-7xl grid-cols-3 items-center h-24 px-4 sm:px-6 lg:px-8" aria-label="Global">
					{/* Navegación izquierda */}
					<Popover.Group className="hidden md:flex items-center gap-5">
						{/* Tipos de Propiedad Dropdown */}
						<Popover className="relative">
							<Popover.Button className="flex items-center gap-1 text-sm font-medium text-gray-600 hover:text-brand-navy transition-colors">
								Propiedades
								<ChevronDownIcon className="h-3.5 w-3.5 flex-none text-gray-400" aria-hidden="true" />
							</Popover.Button>

							<Transition
								as={Fragment}
								enter="transition ease-out duration-200"
								enterFrom="opacity-0 translate-y-1"
								enterTo="opacity-100 translate-y-0"
								leave="transition ease-in duration-150"
								leaveFrom="opacity-100 translate-y-0"
								leaveTo="opacity-0 translate-y-1"
							>
								<Popover.Panel className="absolute -left-4 top-full z-[300] mt-1 w-screen max-w-xs overflow-hidden rounded-md bg-white shadow-lg ring-1 ring-gray-900/5">
									<div className="p-2">
										{propertyTypes.map((item) => (
											<div
												key={item.name}
												className="group relative flex items-center gap-3 rounded-md p-2.5 text-xs sm:text-sm leading-5 hover:bg-gray-50"
											>
												<div className="flex h-8 w-8 flex-none items-center justify-center rounded-md bg-gray-50 group-hover:bg-white">
													<item.icon className="h-4 w-4 text-gray-600 group-hover:text-brand-blue" aria-hidden="true" />
												</div>
												<div className="flex-auto">
													<Link href={item.href} className="block font-medium text-gray-800">
														{item.name}
														<span className="absolute inset-0" />
													</Link>
													<p className="mt-0.5 text-gray-500 text-[10px] sm:text-xs">{item.description}</p>
												</div>
											</div>
										))}
										<button
											onClick={handlePublishClick}
											className="mt-1 flex items-center justify-center gap-1.5 rounded-md bg-secondary-500/20 px-2.5 py-2 text-xs sm:text-sm font-medium text-brand-navy hover:bg-secondary-500/30 transition-colors"
										>
											<PlusIcon className="h-3.5 w-3.5 flex-none text-brand-navy" aria-hidden="true" />
											Publicar Propiedad
										</button>
									</div>
								</Popover.Panel>
							</Transition>
						</Popover>
						<Link href="/inmobiliarias" className="font-medium text-gray-600 hover:text-brand-navy transition-colors">
							Inmobiliarias
						</Link>
						<Link href="/nosotros" className="font-medium text-gray-600 hover:text-brand-navy transition-colors">
							Nosotros
						</Link>
						<Link href="/ayuda" className="font-medium text-gray-600 hover:text-brand-navy transition-colors">
							Ayuda
						</Link>
					</Popover.Group>
					{/* Logo centrado */}
					<div className="flex justify-center items-center col-span-1 md:col-span-1">
						<Link href="/" className="flex items-center">
							<span className="sr-only">RentaFacil</span>
							<Image
								src="/images/renta_facil_logo2.png"
								alt="RentaFacil Logo"
								width={330}
								height={50}
								className='w-auto select-none'
								style={{ height: '6.5rem' }}
							/>
						</Link>
					</div>

					{/* Acciones derecha */}
					<div className="flex items-center justify-end gap-2 md:gap-3 col-span-2 md:col-span-1">
						{/* Search button */}
						<button className="hidden sm:inline-flex text-gray-400 hover:text-brand-navy transition-colors p-2 rounded-md hover:bg-gray-100">
							<span className="sr-only">Buscar</span>
							<MagnifyingGlassIcon className="h-5 w-5" />
						</button>

						{isLoggedIn ? (
							<>
								{/* Notifications - Solo cuando está logueado */}
								<button className="hidden sm:inline-flex text-gray-400 hover:text-brand-navy transition-colors relative p-2 rounded-md hover:bg-gray-100">
									<span className="sr-only">Notificaciones</span>
									<BellIcon className="h-5 w-5" />
									{/* Notification dot */}
									<span className="absolute top-1.5 right-1.5 h-2 w-2 bg-red-500 rounded-full"></span>
								</button>

								{/* User Profile Menu */}
								<Menu as="div" className="relative hidden md:inline-block">
									<Menu.Button className="flex items-center gap-2 text-gray-600 hover:text-brand-navy transition-colors p-2 rounded-md hover:bg-gray-100">
										{/* Avatar o icono según si tiene foto */}
										{getAvatarUrl(user?.profile_picture_url) ? (
											<img
												src={getAvatarUrl(user?.profile_picture_url)!}
												alt={user?.first_name || 'Usuario'}
												className="h-8 w-8 rounded-full object-cover border-2 border-gray-200"
												onError={(e) => {
													// Si falla cargar la imagen, mostrar el ícono de respaldo
													console.error('Error loading avatar:', e);
												}}
											/>
										) : (
											<UserCircleIcon className="h-6 w-6" />
										)}
										<span className="text-sm font-medium hidden lg:inline">
											{user?.first_name || 'Usuario'}
										</span>
										<ChevronDownIcon className="h-4 w-4" />
									</Menu.Button>

									<Transition
										as={Fragment}
										enter="transition ease-out duration-100"
										enterFrom="transform opacity-0 scale-95"
										enterTo="transform opacity-100 scale-100"
										leave="transition ease-in duration-75"
										leaveFrom="transform opacity-100 scale-100"
										leaveTo="transform opacity-0 scale-95"
									>
										<Menu.Items className="absolute right-0 z-[300] mt-2 w-56 origin-top-right rounded-md bg-white shadow-lg ring-1 ring-black ring-opacity-5 focus:outline-none">
											<div className="py-1">
												<div className="px-4 py-3 border-b border-gray-100">
													<p className="text-sm font-medium text-gray-900">
														{user?.first_name} {user?.last_name}
													</p>
													<p className="text-sm text-gray-500 truncate">
														{user?.email}
													</p>
												</div>

												<Menu.Item>
													{({ active }) => (
														<Link
															href="/profile"
															className={classNames(
																active ? 'bg-gray-100' : '',
																'flex items-center gap-3 px-4 py-2 text-sm text-gray-700'
															)}
														>
															<UserIcon className="h-5 w-5 text-gray-400" />
															Mi Perfil
														</Link>
													)}
											</Menu.Item>

											{/* Dashboard - Para LANDLORD, AGENT y ADMIN */}
											{(user?.role === 'landlord' || user?.role === 'agent' || user?.role === 'admin') && (
												<Menu.Item>
													{({ active }) => (
														<Link
															href="/dashboard"
															className={classNames(
																active ? 'bg-gray-100' : '',
																'flex items-center gap-3 px-4 py-2 text-sm text-gray-700'
															)}
														>
															<ChartBarIcon className="h-5 w-5 text-gray-400" />
															Dashboard
														</Link>
													)}
												</Menu.Item>
											)}

											{/* Mi Equipo - Solo para AGENT (inmobiliarias) */}
											{(() => {
												const shouldShow = user?.role === 'agent';
												console.log('🔍 Mi Equipo check:', {
													userRole: user?.role,
													userRoleType: typeof user?.role,
													comparison: user?.role === 'agent',
													shouldShow
												});
												return shouldShow;
											})() && (
												<Menu.Item>
													{({ active }) => (
														<Link
															href="/dashboard/agents"
															className={classNames(
																active ? 'bg-gray-100' : '',
																'flex items-center gap-3 px-4 py-2 text-sm text-gray-700'
															)}
														>
															<UsersIcon className="h-5 w-5 text-gray-400" />
															Mi Equipo
														</Link>
													)}
												</Menu.Item>
											)}

											{/* Panel de Admin - Solo para ADMIN */}
											{user?.role === 'admin' && (
												<Menu.Item>
													{({ active }) => (
														<Link
															href="/admin"
															className={classNames(
																active ? 'bg-gray-100' : '',
																'flex items-center gap-3 px-4 py-2 text-sm text-gray-700'
															)}
														>
															<ShieldCheckIcon className="h-5 w-5 text-purple-600" />
															<span className="text-purple-600 font-medium">Panel de Admin</span>
														</Link>
													)}
												</Menu.Item>
											)}

											<Menu.Item>
													{({ active }) => (
														<Link
															href="/profile"
															className={classNames(
																active ? 'bg-gray-100' : '',
																'flex items-center gap-3 px-4 py-2 text-sm text-gray-700'
															)}
														>
															<HeartIcon className="h-5 w-5 text-gray-400" />
															Favoritos
														</Link>
													)}
												</Menu.Item>

												<div className="border-t border-gray-100"></div>

												<Menu.Item>
													{({ active }) => (
														<button
															onClick={handleLogout}
															className={classNames(
																active ? 'bg-gray-100' : '',
																'flex w-full items-center gap-3 px-4 py-2 text-sm text-red-600'
															)}
														>
															<ArrowRightOnRectangleIcon className="h-5 w-5" />
															Cerrar Sesión
														</button>
													)}
												</Menu.Item>
											</div>
										</Menu.Items>
									</Transition>
								</Menu>

								<button
									onClick={handlePublishClick}
									type="button"
									className="inline-flex h-10 items-center rounded-md border border-secondary-500/60 px-3 text-sm font-semibold text-brand-navy hover:bg-secondary-500/30 transition"
								>
									Publicar
								</button>
							</>
						) : (
							<>
								{/* Botones de login/registro cuando NO está logueado */}
								<Link href="/login" className="hidden md:inline-flex h-10 items-center px-3 rounded-md text-sm font-medium text-gray-600 hover:text-brand-navy transition">
									Ingresar
								</Link>
								<Link href="/registro" className="hidden md:inline-flex h-10 items-center rounded-md bg-secondary-500 px-3 text-sm font-semibold text-brand-navy shadow-sm hover:bg-secondary-500/90 transition">
									Registrarse
								</Link>
								<button
									onClick={handlePublishClick}
									type="button"
									className="inline-flex h-10 items-center rounded-md border border-secondary-500/60 px-3 text-sm font-semibold text-brand-navy hover:bg-secondary-500/30 transition"
								>
									Publicar
								</button>
							</>
						)}

						{/* Mobile menu button */}
						<button
							type="button"
							className="md:hidden inline-flex items-center justify-center rounded-md p-2 text-gray-600 hover:text-brand-navy hover:bg-gray-100"
							onClick={() => setMobileMenuOpen(true)}
						>
							<span className="sr-only">Abrir menú principal</span>
							<Bars3Icon className="h-6 w-6" aria-hidden="true" />
						</button>
					</div>
				</div>

				{/* Mobile menu */}
				<Dialog as="div" className="lg:hidden" open={mobileMenuOpen} onClose={setMobileMenuOpen}>
					<div className="fixed inset-0 z-[400]" />
					<Dialog.Panel className="fixed inset-y-0 right-0 z-[450] w-full overflow-y-auto bg-white px-6 py-6 sm:max-w-sm sm:ring-1 sm:ring-gray-900/10">
						<div className="flex items-center justify-between">
							<Link href="/" className="-m-1.5 p-1.5">
								<span className="sr-only">RentaFacil</span>
								<Image
                src="/images/renta_facil_logo2.png"
                alt="RentaFacil Logo"
                width={160}
                height={42}
                className='h-10 w-auto'
              />
							</Link>
							<button
								type="button"
								className="-m-2.5 rounded-md p-2.5 text-gray-700"
								onClick={() => setMobileMenuOpen(false)}
							>
								<span className="sr-only">Cerrar menú</span>
								<XMarkIcon className="h-6 w-6" aria-hidden="true" />
							</button>
						</div>
						<div className="mt-6 flow-root">
							<div className="-my-6 divide-y divide-gray-500/10">
								<div className="space-y-2 py-6">
									<Disclosure as="div" className="-mx-3">
										{({ open }) => (
											<>
												<Disclosure.Button className="flex w-full items-center justify-between rounded-lg py-2 pl-3 pr-3.5 text-base font-semibold leading-7 text-gray-900 hover:bg-gray-50">
													Propiedades
													<ChevronDownIcon
														className={classNames(open ? 'rotate-180' : '', 'h-5 w-5 flex-none')}
														aria-hidden="true"
													/>
												</Disclosure.Button>
												<Disclosure.Panel className="mt-2 space-y-2">
													{propertyTypes.map((item) => (
														<Disclosure.Button
															key={item.name}
															as={Link}
															href={item.href}
															className="block rounded-lg py-2 pl-6 pr-3 text-sm font-semibold leading-7 text-gray-900 hover:bg-gray-50"
														>
															{item.name}
														</Disclosure.Button>
													))}
													<Disclosure.Button
														as="button"
														onClick={handlePublishClick}
														className="block w-full text-left rounded-lg py-2 pl-6 pr-3 text-sm font-semibold leading-7 text-gray-900 hover:bg-gray-50"
													>
														Publicar Propiedad
													</Disclosure.Button>
												</Disclosure.Panel>
											</>
										)}
									</Disclosure>
									<Link
										href="/buscar"
										className="-mx-3 block rounded-lg px-3 py-2 text-base font-semibold leading-7 text-gray-900 hover:bg-gray-50"
									>
										Buscar
									</Link>
									<Link
										href="/inmobiliarias"
										className="-mx-3 block rounded-lg px-3 py-2 text-base font-semibold leading-7 text-gray-900 hover:bg-gray-50"
									>
										Inmobiliarias
									</Link>
									<Link
										href="/nosotros"
										className="-mx-3 block rounded-lg px-3 py-2 text-base font-semibold leading-7 text-gray-900 hover:bg-gray-50"
									>
										Nosotros
									</Link>
									<Link
										href="/ayuda"
										className="-mx-3 block rounded-lg px-3 py-2 text-base font-semibold leading-7 text-gray-900 hover:bg-gray-50"
									>
										Ayuda
									</Link>
								</div>
								<div className="py-6">
									{isLoggedIn ? (
										<>
											{/* User info */}
											<div className="px-3 pb-4 border-b border-gray-200 flex items-center gap-3">
												{/* Avatar en móvil */}
												{getAvatarUrl(user?.profile_picture_url) ? (
													<img
														src={getAvatarUrl(user?.profile_picture_url)!}
														alt={user?.first_name || 'Usuario'}
														className="h-12 w-12 rounded-full object-cover border-2 border-gray-200"
														onError={(e) => {
															e.currentTarget.style.display = 'none';
														}}
													/>
												) : (
													<UserCircleIcon className="h-12 w-12 text-gray-400" />
												)}
												<div className="flex-1">
													<p className="text-base font-semibold text-gray-900">
														{user?.first_name} {user?.last_name}
													</p>
													<p className="text-sm text-gray-500 truncate">
														{user?.email}
													</p>
												</div>
											</div>
											
											<Link
												href="/profile"
												className="-mx-3 mt-4 flex items-center gap-3 rounded-lg px-3 py-2.5 text-base font-semibold leading-7 text-gray-900 hover:bg-gray-50"
											>
												<UserIcon className="h-5 w-5 text-gray-400" />
												Mi Perfil
											</Link>
											
											{/* Dashboard - Para LANDLORD, AGENT y ADMIN */}
											{(user?.role === 'landlord' || user?.role === 'agent' || user?.role === 'admin') && (
												<Link
													href="/dashboard"
													className="-mx-3 flex items-center gap-3 rounded-lg px-3 py-2.5 text-base font-semibold leading-7 text-gray-900 hover:bg-gray-50"
												>
													<ChartBarIcon className="h-5 w-5 text-gray-400" />
													Dashboard
												</Link>
											)}
											
											{/* Panel de Admin - Solo para ADMIN */}
											{user?.role === 'admin' && (
												<Link
													href="/admin"
													className="-mx-3 flex items-center gap-3 rounded-lg px-3 py-2.5 text-base font-semibold leading-7 text-purple-600 hover:bg-gray-50"
												>
													<ShieldCheckIcon className="h-5 w-5 text-purple-600" />
													Panel de Admin
												</Link>
											)}
											
											<Link
												href="/profile"
												className="-mx-3 flex items-center gap-3 rounded-lg px-3 py-2.5 text-base font-semibold leading-7 text-gray-900 hover:bg-gray-50"
											>
												<HeartIcon className="h-5 w-5 text-gray-400" />
												Favoritos
											</Link>
											<button
												onClick={handleLogout}
												className="-mx-3 flex w-full items-center gap-3 rounded-lg px-3 py-2.5 text-base font-semibold leading-7 text-red-600 hover:bg-gray-50"
											>
												<ArrowRightOnRectangleIcon className="h-5 w-5" />
												Cerrar Sesión
											</button>
										</>
									) : (
										<>
											<Link
												href="/login"
												className="-mx-3 block rounded-lg px-3 py-2.5 text-base font-semibold leading-7 text-gray-900 hover:bg-gray-50"
											>
												Ingresar
											</Link>
											<Link
												href="/registro"
												className="-mx-3 block rounded-lg px-3 py-2.5 text-base font-semibold leading-7 text-brand-blue hover:bg-gray-50"
											>
												Registrarse
											</Link>
										</>
									)}
								</div>
							</div>
						</div>
					</Dialog.Panel>
				</Dialog>
			</header>
			{isMounted && showPublishModal && createPortal(modalContent, document.body)}
			{isMounted && showRoleUpgradeModal && createPortal(roleUpgradeModalContent, document.body)}
		</>
	)
}

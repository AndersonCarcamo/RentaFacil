import { useState, Fragment, useEffect } from 'react'
import Link from 'next/link'
import Image from 'next/image'
import { useRouter } from 'next/router'
import { Dialog, Disclosure, Popover, Transition, Menu } from '@headlessui/react'
import { useAuth } from '../../lib/hooks/useAuth'
import { BookingNotifications } from '../BookingNotifications'
import { Notifications } from '../Notifications'
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
	CalendarDaysIcon,
	ShieldCheckIcon,
	UsersIcon
} from '@heroicons/react/24/outline'
import { ChevronDownIcon } from '@heroicons/react/20/solid'
import { createPortal } from 'react-dom'

const propertyTypes = [
	{ 
		name: 'Departamentos', 
		description: 'Encuentra departamentos en toda la ciudad', 
		href: '/alquiler/apartment/lima',
		icon: BuildingOfficeIcon 
	},
	{ 
		name: 'Casas', 
		description: 'Casas familiares y unifamiliares', 
		href: '/alquiler/house/lima',
		icon: HomeIcon 
	},
	{ 
		name: 'Cuartos', 
		description: 'Habitaciones individuales para estudiantes', 
		href: '/alquiler/room/lima',
		icon: KeyIcon 
	},
	{ 
		name: 'Tipo Airbnb', 
		description: 'Alquileres temporales y vacacionales', 
		href: '/alquiler-temporal/apartment/lima',
		icon: CalendarDaysIcon // ✨ Nuevo icono para Airbnb
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
	
	// Log inmediato al obtener user del hook (comentado para evitar spam en consola)
	// console.log('🎯 Header render - user from useAuth:', user)
	// console.log('🎯 Header render - isLoggedIn:', isLoggedIn)

	// Debug: Log user role
	useEffect(() => {
		console.log('🔍 Header - useAuth hook data:', { user, isLoggedIn })
		if (user) {
			console.log('🔍 Header - User data:', user)
			console.log('🔍 Header - User role:', user.role)
			console.log('🔍 Header - Is admin?:', user.role === 'admin')
			console.log('🔍 Header - Should show Dashboard?:', user?.role === 'landlord' || user?.role === 'agent' || user?.role === 'admin')
			console.log('🔍 Header - Should show Admin Panel?:', user?.role === 'admin')
		} else {
			console.log('🔍 Header - User is null/undefined')
		}
	}, [user, isLoggedIn])

	useEffect(() => {
		// ensure document is available for portals (client-side only)
		setIsMounted(true)
	}, [])

	const handlePublishClick = () => {
		// Si no está autenticado, mostrar modal de registro
		if (!user) {
			setShowPublishModal(true)
			return
		}

		// Si es usuario normal, mostrar modal para upgrade de rol
		if (user.role === 'user') {
			setShowRoleUpgradeModal(true)
			return
		}

		// Si es landlord o agent, ir directo a publicar
		if (user.role === 'landlord' || user.role === 'agent') {
			router.push('/publish')
			return
		}

		// Default: mostrar modal de upgrade
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
			<header className="sticky top-0 z-[100] border-b border-gray-200 bg-white/95 backdrop-blur supports-[backdrop-filter]:bg-white/80 shadow-sm">
				{/* Container responsive con mejor espaciado */}
				<nav className="mx-auto max-w-7xl px-3 sm:px-4 lg:px-6" aria-label="Global">
					<div className="flex h-16 sm:h-20 lg:h-24 items-center justify-between gap-2">
						
						{/* LEFT: Navegación Desktop */}
						<div className="hidden lg:flex lg:flex-1 lg:items-center lg:gap-x-6">
							{/* Tipos de Propiedad Dropdown */}
							<Popover className="relative">
								<Popover.Button className="flex items-center gap-x-1 text-sm font-medium text-gray-700 hover:text-brand-navy transition-colors">
									Propiedades
									<ChevronDownIcon className="h-4 w-4 flex-none text-gray-400" aria-hidden="true" />
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
									<Popover.Panel className="absolute -left-4 top-full z-[110] mt-2 w-screen max-w-xs overflow-hidden rounded-xl bg-white shadow-lg ring-1 ring-gray-900/5">
										<div className="p-3">
											{propertyTypes.map((item) => (
												<div
													key={item.name}
													className="group relative flex items-center gap-x-4 rounded-lg p-3 text-sm leading-6 hover:bg-gray-50 transition-colors"
												>
													<div className="flex h-10 w-10 flex-none items-center justify-center rounded-lg bg-gray-50 group-hover:bg-white">
														<item.icon className="h-5 w-5 text-gray-600 group-hover:text-brand-blue transition-colors" aria-hidden="true" />
													</div>
													<div className="flex-auto">
														<Link href={item.href} className="block font-semibold text-gray-900 hover:text-brand-blue">
															{item.name}
															<span className="absolute inset-0" />
														</Link>
														<p className="mt-1 text-xs text-gray-600">{item.description}</p>
													</div>
												</div>
											))}
											<button
												onClick={handlePublishClick}
												className="mt-2 flex w-full items-center justify-center gap-x-2 rounded-lg bg-secondary-500/20 px-3 py-2.5 text-sm font-semibold text-brand-navy hover:bg-secondary-500/30 transition-colors"
											>
												<PlusIcon className="h-4 w-4 flex-none" aria-hidden="true" />
												Publicar Propiedad
											</button>
										</div>
									</Popover.Panel>
								</Transition>
							</Popover>

							<Link href="/inmobiliarias" className="text-sm font-medium text-gray-700 hover:text-brand-navy transition-colors">
								Inmobiliarias
							</Link>
							<Link href="/nosotros" className="text-sm font-medium text-gray-700 hover:text-brand-navy transition-colors">
								Nosotros
							</Link>
							<Link href="/ayuda" className="text-sm font-medium text-gray-700 hover:text-brand-navy transition-colors">
								Ayuda
							</Link>
						</div>

					{/* CENTER: Logo - Tamaño grande fijo */}
					<div className="flex lg:flex-1 lg:justify-center">
						<Link href="/" className="flex items-center -m-1.5 p-1.5">
							<span className="sr-only">RentaFacil</span>
							<Image
								src="/images/renta_facil_logo2.png"
								alt="RentaFacil Logo"
								width={260}
								height={68}
								style={{ height: '6.5rem', width: 'auto' }}
								priority
								className="select-none"
							/>
						</Link>
					</div>							{/* RIGHT: Acciones */}
							<div className="flex flex-1 items-center justify-end gap-x-3">
								{/* Search - Hidden on mobile */}
								<button 
									aria-label="Buscar"
									className="hidden sm:inline-flex p-2.5 text-gray-600 hover:text-brand-navy rounded-lg hover:bg-gray-100 transition-colors"
								>
									<MagnifyingGlassIcon className="h-6 w-6" />
								</button>

								{isLoggedIn ? (
									<>
										{/* Notifications */}
										<div className="hidden sm:inline-flex">
											<Notifications />
										</div>
										
										{/* Booking Notifications */}
										<div className="hidden sm:inline-flex">
											<BookingNotifications />
										</div>

										{/* User Menu Desktop */}
										<Menu as="div" className="relative hidden lg:block">
											<Menu.Button className="flex items-center gap-x-2 rounded-lg px-3 py-2.5 text-base font-medium text-gray-700 hover:text-brand-navy hover:bg-gray-100 transition-colors">
												{getAvatarUrl(user?.profile_picture_url) ? (
													<img
														src={getAvatarUrl(user?.profile_picture_url)!}
														alt={user?.first_name || 'Usuario'}
														className="h-10 w-10 rounded-full object-cover border-2 border-gray-200"
														onError={(e) => {
															e.currentTarget.style.display = 'none';
														}}
													/>
												) : (
													<UserCircleIcon className="h-10 w-10" />
												)}
												<span className="hidden xl:inline-block max-w-[120px] truncate">
													{user?.first_name || 'Usuario'}
												</span>
												<ChevronDownIcon className="h-5 w-5 text-gray-400" />
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
											<Menu.Items className="absolute right-0 z-[110] mt-2 w-56 origin-top-right rounded-xl bg-white shadow-lg ring-1 ring-black ring-opacity-5 focus:outline-none">
												<div className="py-2">
													<div className="px-4 py-3 border-b border-gray-100">
														<p className="text-sm font-medium text-gray-900 truncate">
															{user?.first_name} {user?.last_name}
														</p>
														<p className="text-xs text-gray-500 truncate mt-1">
															{user?.email}
														</p>
													</div>

													<Menu.Item>
														{({ active }) => (
															<Link
																href="/profile"
																className={classNames(
																	active ? 'bg-gray-50' : '',
																	'flex items-center gap-x-3 px-4 py-2.5 text-sm text-gray-700'
																)}
															>
																<UserIcon className="h-5 w-5 text-gray-400" />
																Mi Perfil
															</Link>
														)}
													</Menu.Item>

													{/* Mis Reservas - Para todos los usuarios */}
													<Menu.Item>
														{({ active }) => (
															<Link
																href="/my-bookings"
																className={classNames(
																	active ? 'bg-gray-50' : '',
																	'flex items-center gap-x-3 px-4 py-2.5 text-sm text-gray-700'
																)}
															>
																<CalendarDaysIcon className="h-5 w-5 text-gray-400" />
																Mis Reservas
															</Link>
														)}
													</Menu.Item>

													{/* Mensajes - Para todos los usuarios */}
													<Menu.Item>
														{({ active }) => (
															<Link
																href="/messages"
																className={classNames(
																	active ? 'bg-gray-50' : '',
																	'flex items-center gap-x-3 px-4 py-2.5 text-sm text-gray-700'
																)}
															>
																<svg className="h-5 w-5 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
																	<path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z" />
																</svg>
																Mensajes
															</Link>
														)}
													</Menu.Item>

													{(user?.role === 'landlord' || user?.role === 'agent' || user?.role === 'admin') && (
														<Menu.Item>
															{({ active }) => (
																<Link
																	href="/dashboard"
																	className={classNames(
																		active ? 'bg-gray-50' : '',
																		'flex items-center gap-x-3 px-4 py-2.5 text-sm text-gray-700'
																	)}
																>
																	<ChartBarIcon className="h-5 w-5 text-gray-400" />
																	Dashboard
																</Link>
															)}
														</Menu.Item>
													)}

													{/* Mi Equipo - Solo para AGENT (inmobiliarias) */}
													{user?.role === 'agent' && (
														<Menu.Item>
															{({ active }) => (
																<Link
																	href="/dashboard/agents"
																	className={classNames(
																		active ? 'bg-gray-50' : '',
																		'flex items-center gap-x-3 px-4 py-2.5 text-sm text-gray-700'
																	)}
																>
																	<UsersIcon className="h-5 w-5 text-gray-400" />
																	Mi Equipo
																</Link>
															)}
														</Menu.Item>
													)}

													{/* Gestión de Reservas - Solo para LANDLORD y AGENT */}
													{(user?.role === 'landlord' || user?.role === 'agent') && (
														<Menu.Item>
															{({ active }) => (
																<Link
																	href="/dashboard/bookings"
																	className={classNames(
																		active ? 'bg-gray-50' : '',
																		'flex items-center gap-x-3 px-4 py-2.5 text-sm text-gray-700'
																	)}
																>
																	<CalendarDaysIcon className="h-5 w-5 text-gray-400" />
																	Gestión de Reservas
																</Link>
															)}
														</Menu.Item>
													)}

													{user?.role === 'admin' && (
														<Menu.Item>
															{({ active }) => (
																<Link
																	href="/admin"
																	className={classNames(
																		active ? 'bg-gray-50' : '',
																		'flex items-center gap-x-3 px-4 py-2.5 text-sm text-gray-700'
																	)}
																>
																	<ShieldCheckIcon className="h-5 w-5 text-purple-600" />
																	<span className="text-purple-600 font-semibold">Panel de Admin</span>
																</Link>
															)}
														</Menu.Item>
													)}

													<Menu.Item>
														{({ active }) => (
															<Link
																href="/perfil"
																className={classNames(
																	active ? 'bg-gray-50' : '',
																	'flex items-center gap-x-3 px-4 py-2.5 text-sm text-gray-700'
																)}
															>
																<HeartIcon className="h-5 w-5 text-gray-400" />
																Favoritos
															</Link>
														)}
													</Menu.Item>

													<div className="border-t border-gray-100 my-2"></div>

													<Menu.Item>
														{({ active }) => (
															<button
																onClick={handleLogout}
																className={classNames(
																	active ? 'bg-red-50' : '',
																	'flex w-full items-center gap-x-3 px-4 py-2.5 text-sm text-red-600 hover:text-red-700'
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

									{/* Botón Publicar */}
									<button
										onClick={handlePublishClick}
										type="button"
										className="inline-flex items-center gap-x-2 rounded-lg bg-secondary-500 px-5 py-3 text-base font-semibold text-brand-navy shadow-sm hover:bg-secondary-500/90 transition-colors"
									>
										<span className="hidden sm:inline">Publicar</span>
										<PlusIcon className="h-5 w-5 sm:hidden" />
									</button>
								</>
							) : (
								<>
									{/* Login/Register - Only Desktop */}
									<Link 
										href="/login" 
										className="hidden lg:inline-flex items-center px-4 py-2.5 text-base font-semibold text-gray-900 ring-1 ring-inset ring-gray-300 rounded-lg hover:bg-gray-50 transition-colors"
									>
										Ingresar
									</Link>
									<Link 
										href="/registro" 
										className="hidden md:inline-flex items-center rounded-lg bg-secondary-500 px-4 py-2.5 text-base font-semibold text-brand-navy shadow-sm hover:bg-secondary-500/90 transition-colors"
									>
										Registrarse
									</Link>
									<button
										onClick={handlePublishClick}
										type="button"
										className="inline-flex items-center gap-x-1.5 rounded-lg bg-brand-blue px-4 py-2.5 text-base font-semibold text-white shadow-sm hover:bg-brand-blue/90 transition-colors"
									>
										Publicar
									</button>
								</>
							)}

							{/* Mobile menu button */}
							<button
								type="button"
								className="lg:hidden inline-flex items-center justify-center rounded-lg p-2.5 text-gray-700 hover:bg-gray-100 hover:text-brand-navy transition-colors"
								onClick={() => setMobileMenuOpen(true)}
								aria-label="Abrir menú"
							>
								<span className="sr-only">Abrir menú</span>
								<Bars3Icon className="h-7 w-7" aria-hidden="true" />
							</button>
						</div>
					</div>
				</nav>

				{/* Mobile menu */}
				<Dialog as="div" className="lg:hidden" open={mobileMenuOpen} onClose={setMobileMenuOpen}>
					<div className="fixed inset-0 z-[200] bg-black/30 backdrop-blur-sm" />
					<Dialog.Panel className="fixed inset-y-0 right-0 z-[200] w-full overflow-y-auto bg-white px-6 py-6 sm:max-w-sm sm:ring-1 sm:ring-gray-900/10">
						{/* Header del menú móvil */}
						<div className="flex items-center justify-between mb-8">
							<Link href="/" className="-m-1.5 p-1.5" onClick={() => setMobileMenuOpen(false)}>
								<span className="sr-only">RentaFacil</span>
								<Image
									src="/images/renta_facil_logo2.png"
									alt="RentaFacil Logo"
									width={180}
									height={40}
									className="h-10 w-auto"
								/>
							</Link>
							<button
								type="button"
								className="-m-2.5 rounded-lg p-2.5 text-gray-700 hover:bg-gray-100 transition-colors"
								onClick={() => setMobileMenuOpen(false)}
							>
								<span className="sr-only">Cerrar menú</span>
								<XMarkIcon className="h-6 w-6" aria-hidden="true" />
							</button>
						</div>

						<div className="flow-root">
							<div className="-my-6 divide-y divide-gray-200">
								{/* Navegación principal */}
								<div className="space-y-2 py-6">
									{/* Dropdown Propiedades */}
									<Disclosure as="div" className="-mx-3">
										{({ open }) => (
											<>
												<Disclosure.Button className="flex w-full items-center justify-between rounded-lg py-3 pl-3 pr-3.5 text-base font-semibold leading-7 text-gray-900 hover:bg-gray-50 transition-colors">
													Propiedades
													<ChevronDownIcon
														className={classNames(
															open ? 'rotate-180' : '',
															'h-5 w-5 flex-none text-gray-400 transition-transform duration-200'
														)}
														aria-hidden="true"
													/>
												</Disclosure.Button>
												<Disclosure.Panel className="mt-2 space-y-2">
													{propertyTypes.map((item) => (
														<Disclosure.Button
															key={item.name}
															as={Link}
															href={item.href}
															onClick={() => setMobileMenuOpen(false)}
															className="block rounded-lg py-2.5 pl-6 pr-3 text-sm font-semibold leading-7 text-gray-900 hover:bg-gray-50 transition-colors"
														>
															{item.name}
														</Disclosure.Button>
													))}
													<Disclosure.Button
														as="button"
														onClick={() => {
															setMobileMenuOpen(false)
															handlePublishClick()
														}}
														className="block w-full text-left rounded-lg py-2.5 pl-6 pr-3 text-sm font-semibold leading-7 text-brand-blue hover:bg-gray-50 transition-colors"
													>
														+ Publicar Propiedad
													</Disclosure.Button>
												</Disclosure.Panel>
											</>
										)}
									</Disclosure>

									{/* Enlaces directos */}
									<Link
										href="/inmobiliarias"
										onClick={() => setMobileMenuOpen(false)}
										className="-mx-3 block rounded-lg px-3 py-3 text-base font-semibold leading-7 text-gray-900 hover:bg-gray-50 transition-colors"
									>
										Inmobiliarias
									</Link>
									<Link
										href="/nosotros"
										onClick={() => setMobileMenuOpen(false)}
										className="-mx-3 block rounded-lg px-3 py-3 text-base font-semibold leading-7 text-gray-900 hover:bg-gray-50 transition-colors"
									>
										Nosotros
									</Link>
									<Link
										href="/ayuda"
										onClick={() => setMobileMenuOpen(false)}
										className="-mx-3 block rounded-lg px-3 py-3 text-base font-semibold leading-7 text-gray-900 hover:bg-gray-50 transition-colors"
									>
										Ayuda
									</Link>
								</div>

								{/* Sección de usuario */}
								<div className="py-6">
									{isLoggedIn ? (
										<>
											{/* Perfil del usuario */}
											<div className="mb-6 flex items-center gap-3 px-3 pb-4 border-b border-gray-200">
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
												<div className="flex-1 min-w-0">
													<p className="text-base font-semibold text-gray-900 truncate">
														{user?.first_name} {user?.last_name}
													</p>
													<p className="text-sm text-gray-500 truncate">
														{user?.email}
													</p>
												</div>
											</div>

											{/* Enlaces del perfil */}
											<div className="space-y-1">
												<Link
													href="/profile"
													onClick={() => setMobileMenuOpen(false)}
													className="-mx-3 flex items-center gap-x-3 rounded-lg px-3 py-3 text-base font-semibold leading-7 text-gray-900 hover:bg-gray-50 transition-colors"
												>
													<UserIcon className="h-5 w-5 text-gray-400" />
													Mi Perfil
												</Link>

												{(user?.role === 'landlord' || user?.role === 'agent' || user?.role === 'admin') && (
													<Link
														href="/dashboard"
														onClick={() => setMobileMenuOpen(false)}
														className="-mx-3 flex items-center gap-x-3 rounded-lg px-3 py-3 text-base font-semibold leading-7 text-gray-900 hover:bg-gray-50 transition-colors"
													>
														<ChartBarIcon className="h-5 w-5 text-gray-400" />
														Dashboard
													</Link>
												)}

												{/* Mi Equipo - Solo para AGENT */}
												{user?.role === 'agent' && (
													<Link
														href="/dashboard/agents"
														onClick={() => setMobileMenuOpen(false)}
														className="-mx-3 flex items-center gap-x-3 rounded-lg px-3 py-3 text-base font-semibold leading-7 text-gray-900 hover:bg-gray-50 transition-colors"
													>
														<UsersIcon className="h-5 w-5 text-gray-400" />
														Mi Equipo
													</Link>
												)}

												{user?.role === 'admin' && (
													<Link
														href="/admin"
														onClick={() => setMobileMenuOpen(false)}
														className="-mx-3 flex items-center gap-x-3 rounded-lg px-3 py-3 text-base font-semibold leading-7 text-purple-600 hover:bg-purple-50 transition-colors"
													>
														<ShieldCheckIcon className="h-5 w-5 text-purple-600" />
														Panel de Admin
													</Link>
												)}

												<Link
													href="/perfil"
													onClick={() => setMobileMenuOpen(false)}
													className="-mx-3 flex items-center gap-x-3 rounded-lg px-3 py-3 text-base font-semibold leading-7 text-gray-900 hover:bg-gray-50 transition-colors"
												>
													<HeartIcon className="h-5 w-5 text-gray-400" />
													Favoritos
												</Link>

												<button
													onClick={() => {
														setMobileMenuOpen(false)
														handleLogout()
													}}
													className="-mx-3 flex w-full items-center gap-x-3 rounded-lg px-3 py-3 text-base font-semibold leading-7 text-red-600 hover:bg-red-50 transition-colors"
												>
													<ArrowRightOnRectangleIcon className="h-5 w-5" />
													Cerrar Sesión
												</button>
											</div>
										</>
									) : (
										<>
											{/* Botones para usuarios no logueados */}
											<div className="space-y-3">
												<Link
													href="/login"
													onClick={() => setMobileMenuOpen(false)}
													className="flex w-full items-center justify-center rounded-lg bg-white border-2 border-gray-300 px-3 py-3 text-base font-semibold text-gray-900 hover:bg-gray-50 transition-colors"
												>
													Ingresar
												</Link>
												<Link
													href="/registro"
													onClick={() => setMobileMenuOpen(false)}
													className="flex w-full items-center justify-center rounded-lg bg-secondary-500 px-3 py-3 text-base font-semibold text-brand-navy shadow-sm hover:bg-secondary-500/90 transition-colors"
												>
													Registrarse
												</Link>
											</div>
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

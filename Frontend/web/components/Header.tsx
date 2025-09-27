import { useState, Fragment } from 'react'
import Link from 'next/link'
import Image from 'next/image'
import { Dialog, Disclosure, Popover, Transition } from '@headlessui/react'
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
	MagnifyingGlassIcon
} from '@heroicons/react/24/outline'
import { ChevronDownIcon } from '@heroicons/react/20/solid'

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

export function Header() {
	const [mobileMenuOpen, setMobileMenuOpen] = useState(false)

	return (
		<header className="sticky top-0 z-50 border-b border-gray-200 bg-white/90 backdrop-blur supports-[backdrop-filter]:bg-white/70">
			{/* Grid de 3 columnas para centrar logo */}
			<div className="mx-auto grid max-w-7xl grid-cols-3 items-center h-24 px-3 sm:px-4 lg:px-6" aria-label="Global" style={{ transform: 'scale(1.1)', transformOrigin: 'center' }}>
				{/* Navegación izquierda */}
				<Popover.Group className="hidden md:flex items-center gap-5" style={{ fontSize: '1rem' }}>
					{/* Tipos de Propiedad Dropdown */}
					<Popover className="relative">
						<Popover.Button className="flex items-center gap-1 font-medium text-gray-600 hover:text-brand-navy transition-colors">
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
							<Popover.Panel className="absolute -left-4 top-full z-10 mt-1 w-screen max-w-xs overflow-hidden rounded-md bg-white shadow-lg ring-1 ring-gray-900/5">
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
									<Link
										href="/publicar"
										className="mt-1 flex items-center justify-center gap-1.5 rounded-md bg-secondary-500/20 px-2.5 py-2 text-xs sm:text-sm font-medium text-brand-navy hover:bg-secondary-500/30 transition-colors"
									>
										<PlusIcon className="h-3.5 w-3.5 flex-none text-brand-navy" aria-hidden="true" />
										Publicar Propiedad
									</Link>
								</div>
							</Popover.Panel>
						</Transition>
					</Popover>
					<Link href="/buscar" className="font-medium text-gray-600 hover:text-brand-navy transition-colors">
						Buscar
					</Link>
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
				<div className="flex justify-center md:justify-center col-span-1 md:col-span-1">
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

					{/* Notifications */}
					<button className="hidden sm:inline-flex text-gray-400 hover:text-brand-navy transition-colors relative p-2 rounded-md hover:bg-gray-100">
						<span className="sr-only">Notificaciones</span>
						<BellIcon className="h-5 w-5" />
						{/* Notification dot */}
						<span className="absolute top-1.5 right-1.5 h-2 w-2 bg-red-500 rounded-full"></span>
					</button>

					{/* Favorites */}
					<Link href="/favoritos" className="hidden sm:inline-flex text-gray-400 hover:text-brand-navy transition-colors p-2 rounded-md hover:bg-gray-100">
						<span className="sr-only">Favoritos</span>
						<HeartIcon className="h-5 w-5" />
					</Link>
					<Link href="/login" className="hidden md:inline-flex h-10 items-center px-3 rounded-md text-xs sm:text-sm font-medium text-gray-600 hover:text-brand-navy transition">Ingresar</Link>
					<Link href="/registro" className="hidden md:inline-flex h-10 items-center rounded-md bg-secondary-500 px-3 text-xs sm:text-sm font-semibold text-brand-navy shadow-sm hover:bg-secondary-500/90 transition">Registrarse</Link>
					<Link href="/publicar" className="inline-flex h-10 items-center rounded-md border border-secondary-500/60 px-3 text-xs sm:text-sm font-semibold text-brand-navy hover:bg-secondary-500/30 transition">Publicar</Link>

					{/* Mobile menu button */}
					<button
						type="button"
						className="md:hidden inline-flex items-center justify-center rounded-md p-2 text-gray-600 hover:text-brand-navy hover:bg-gray-100"
						onClick={() => setMobileMenuOpen(true)}
					>
						<span className="sr-only">Abrir menú principal</span>
						<Bars3Icon className="h-5 w-5" aria-hidden="true" />
					</button>
				</div>
			</div>

			{/* Mobile menu */}
			<Dialog as="div" className="lg:hidden" open={mobileMenuOpen} onClose={setMobileMenuOpen}>
				<div className="fixed inset-0 z-10" />
				<Dialog.Panel className="fixed inset-y-0 right-0 z-10 w-full overflow-y-auto bg-white px-6 py-6 sm:max-w-sm sm:ring-1 sm:ring-gray-900/10">
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
													as={Link}
													href="/publicar"
													className="block rounded-lg py-2 pl-6 pr-3 text-sm font-semibold leading-7 text-gray-900 hover:bg-gray-50"
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
							</div>
						</div>
					</div>
				</Dialog.Panel>
			</Dialog>
		</header>
	)
}

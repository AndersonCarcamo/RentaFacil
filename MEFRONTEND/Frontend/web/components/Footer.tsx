import Link from 'next/link'
import Image from 'next/image'

const navigation = {
	producto: [
		{ name: 'Buscar propiedades', href: '/propiedades' },
		{ name: 'Publicar propiedad', href: '/publicar' },
		{ name: 'Planes y precios', href: '/planes' },
		{ name: 'Preguntas frecuentes', href: '/ayuda' },
	],
	empresa: [
		{ name: 'Nosotros', href: '/nosotros' },
		{ name: 'Inversionistas', href: '/inversionistas' },
		{ name: 'Blog', href: '/blog' },
		{ name: 'Prensa', href: '/prensa' },
	],
	legal: [
		{ name: 'Términos y Condiciones', href: '/terminos' },
		{ name: 'Política de Privacidad', href: '/privacidad' },
		{ name: 'Cookies', href: '/cookies' },
		{ name: 'Licencias', href: '/licencias' },
	],
	contacto: [
		{ name: 'Soporte', href: '/soporte' },
		{ name: 'Centro de ayuda', href: '/ayuda' },
		{ name: 'Contacto comercial', href: '/contacto' },
		{ name: 'Reportar problema', href: '/reporte' },
	],
}

export function Footer() {
	return (
		<footer className="relative border-t border-gray-200 bg-white mt-16">
			<div className="absolute inset-0 pointer-events-none bg-gradient-to-b from-brand-navy/3 to-white" />
			<div className="relative mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 py-16">
				<div className="grid gap-12 md:grid-cols-4">
					{/* Brand */}
					<div>
						<Link href="/" className="inline-flex items-center">
							<Image
								src="/images/logo_sin_fondo.png"
								alt="RentaFacil"
								width={140}
								height={40}
								className="h-9 w-auto"
							/>
						</Link>
						<p className="mt-5 text-sm text-gray-600 max-w-xs leading-relaxed">
							Plataforma líder para alquiler y publicación de propiedades en Perú. Simplificamos la experiencia de encontrar hogar.
						</p>
						<div className="mt-6 flex gap-3">
							{['facebook','instagram','linkedin','twitter'].map(net => (
								<Link key={net} href={`https://${net}.com/rentafacil`} className="group inline-flex h-9 w-9 items-center justify-center rounded-full border border-gray-200 hover:border-secondary-500 hover:bg-secondary-500/10 transition">
									<span className="sr-only">{net}</span>
									<svg aria-hidden="true" viewBox="0 0 24 24" className="h-4 w-4 text-gray-500 group-hover:text-brand-navy">
										<circle cx="12" cy="12" r="10" fill="currentColor" className={net==='linkedin'?'opacity-80':''} />
									</svg>
								</Link>
							))}
						</div>
					</div>

					{/* Columnas navegación */}
					<div className="grid grid-cols-2 gap-8 md:col-span-3 sm:grid-cols-3">
						<div>
							<h3 className="text-sm font-semibold text-brand-navy tracking-wide">Producto</h3>
							<ul className="mt-4 space-y-2">
								{navigation.producto.map(item => (
									<li key={item.name}>
										<Link href={item.href} className="text-sm text-gray-600 hover:text-brand-navy transition-colors">
											{item.name}
										</Link>
									</li>
								))}
							</ul>
						</div>
						<div>
							<h3 className="text-sm font-semibold text-brand-navy tracking-wide">Empresa</h3>
							<ul className="mt-4 space-y-2">
								{navigation.empresa.map(item => (
									<li key={item.name}>
										<Link href={item.href} className="text-sm text-gray-600 hover:text-brand-navy transition-colors">
											{item.name}
										</Link>
									</li>
								))}
							</ul>
						</div>
						<div className="sm:col-span-1">
							<h3 className="text-sm font-semibold text-brand-navy tracking-wide">Legal</h3>
							<ul className="mt-4 space-y-2">
								{navigation.legal.map(item => (
									<li key={item.name}>
										<Link href={item.href} className="text-sm text-gray-600 hover:text-brand-navy transition-colors">
											{item.name}
										</Link>
									</li>
								))}
							</ul>
						</div>
						<div className="hidden sm:block">
							<h3 className="text-sm font-semibold text-brand-navy tracking-wide">Contacto</h3>
							<ul className="mt-4 space-y-2">
								{navigation.contacto.map(item => (
									<li key={item.name}>
										<Link href={item.href} className="text-sm text-gray-600 hover:text-brand-navy transition-colors">
											{item.name}
										</Link>
									</li>
								))}
							</ul>
						</div>
					</div>
				</div>

				<div className="mt-14 border-t border-gray-200 pt-8 flex flex-col md:flex-row items-start md:items-center justify-between gap-6">
						<p className="text-xs text-gray-500">© {new Date().getFullYear()} RentaFacil. Todos los derechos reservados.</p>
						<div className="flex flex-wrap gap-4 text-xs text-gray-500">
							<Link href="/privacidad" className="hover:text-brand-navy">Privacidad</Link>
							<Link href="/terminos" className="hover:text-brand-navy">Términos</Link>
							<Link href="/cookies" className="hover:text-brand-navy">Cookies</Link>
							<Link href="/seguridad" className="hover:text-brand-navy">Seguridad</Link>
						</div>
				</div>
			</div>
		</footer>
	)
}

export default Footer

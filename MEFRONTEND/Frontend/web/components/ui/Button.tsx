import { forwardRef } from 'react'
import clsx from 'clsx'
import { ArrowPathIcon } from '@heroicons/react/24/outline'

type Variant = 'primary' | 'secondary' | 'outline' | 'ghost' | 'danger'
type Size = 'sm' | 'md' | 'lg' | 'icon'

export interface ButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
	variant?: Variant
	size?: Size
	loading?: boolean
	leftIcon?: React.ReactNode
	rightIcon?: React.ReactNode
	asChild?: boolean // reserved for future <Slot/>
	as?: React.ElementType
	href?: string // allow passing when as Link/anchor
}

const base = 'inline-flex items-center justify-center font-semibold rounded-lg focus:outline-none focus-visible:ring-2 focus-visible:ring-offset-2 focus-visible:ring-brand-navy disabled:opacity-50 disabled:cursor-not-allowed transition-shadow shadow-soft hover:shadow-medium active:shadow-none'

const variantStyles: Record<Variant, string> = {
	primary: 'bg-secondary-500 text-brand-navy hover:bg-secondary-400 active:bg-secondary-600',
	secondary: 'bg-primary-500 text-white hover:bg-primary-400 active:bg-primary-600',
	outline: 'border border-brand-navy/30 text-brand-navy hover:bg-brand-navy/5 active:bg-brand-navy/10',
	ghost: 'text-brand-navy hover:bg-brand-navy/10 active:bg-brand-navy/20',
	danger: 'bg-red-600 text-white hover:bg-red-500 active:bg-red-700'
}

const sizeStyles: Record<Size, string> = {
	sm: 'text-xs px-3 py-1.5 gap-1',
	md: 'text-sm px-4 py-2 gap-2',
	lg: 'text-base px-6 py-3 gap-2',
	icon: 'h-10 w-10 p-0'
}

export const Button = forwardRef<HTMLButtonElement, ButtonProps>(function Button(
	{ className, variant = 'primary', size = 'md', loading = false, leftIcon, rightIcon, children, disabled, as, href, ...rest },
	ref
) {
	const Component: any = as || 'button'
	const isButton = Component === 'button'
	const sharedProps: any = {
		className: clsx(base, variantStyles[variant], sizeStyles[size], loading && 'relative !text-transparent', className),
		ref,
		...(href ? { href } : {}),
		...(isButton ? { disabled: disabled || loading } : { 'aria-disabled': disabled || loading })
	}
	return (
		<Component {...sharedProps} {...rest}>
			{loading && (
				<span className="absolute inset-0 flex items-center justify-center">
					<ArrowPathIcon className="h-5 w-5 animate-spin text-current" />
				</span>
			)}
			{!loading && leftIcon}
			{!loading && <span>{children}</span>}
			{!loading && rightIcon}
		</Component>
	)
})

export default Button

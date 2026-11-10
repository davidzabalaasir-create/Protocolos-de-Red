import { forwardRef, type ButtonHTMLAttributes, type ReactNode } from 'react'

type Variant = 'primary' | 'secondary' | 'ghost'
type Size = 'md' | 'icon' | 'iconSm' | 'sm'

interface Props extends ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: Variant
  size?: Size
  /** Accessible name + tooltip. Required for icon-only buttons. */
  label?: string
  /** Keyboard shortcut shown in the tooltip, e.g. "Espacio". */
  shortcut?: string
  children?: ReactNode
}

const base =
  'relative inline-flex select-none items-center justify-center gap-2 rounded-lg border text-xs font-bold tracking-wider uppercase ' +
  'transition-[background-color,border-color,box-shadow,transform,filter] duration-150 ease-out ' +
  'active:translate-y-px active:scale-[0.98] ' +
  'disabled:pointer-events-none disabled:opacity-45 ' +
  'focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-accent'

const variants: Record<Variant, string> = {
  primary:
    'border-transparent bg-accent text-accent-fg shadow-[0_1px_0_rgb(255_255_255/0.15)_inset,0_6px_16px_-6px_var(--accent)] ' +
    'hover:brightness-110 hover:shadow-[0_1px_0_rgb(255_255_255/0.15)_inset,0_10px_22px_-6px_var(--accent)]',
  secondary:
    'border-line-strong bg-panel text-fg shadow-sm hover:border-accent hover:bg-panel-2 ' +
    'aria-pressed:border-accent aria-pressed:bg-accent aria-pressed:text-accent-fg',
  ghost:
    'border-transparent bg-transparent text-fg hover:bg-panel-2 ' +
    'aria-pressed:bg-accent aria-pressed:text-accent-fg aria-[current]:bg-accent aria-[current]:text-accent-fg',
}

const sizes: Record<Size, string> = {
  md: 'min-h-11 px-4',
  sm: 'min-h-10 px-3',
  icon: 'size-11',
  iconSm: 'size-9',
}

export const Button = forwardRef<HTMLButtonElement, Props>(function Button(
  { variant = 'secondary', size = 'md', label, shortcut, className = '', children, type = 'button', ...rest },
  ref,
) {
  const tip = label ? (shortcut ? `${label} (${shortcut})` : label) : undefined
  return (
    <button
      ref={ref}
      type={type}
      title={tip}
      className={`${base} ${variants[variant]} ${sizes[size]} ${className}`}
      {...rest}
    >
      {children}
      {label && (size === 'icon' || size === 'iconSm') && <span className="sr-only">{label}</span>}
    </button>
  )
})

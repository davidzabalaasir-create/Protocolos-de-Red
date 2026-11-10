import { Boxes, Menu, Moon, Sun } from 'lucide-react'

interface Props {
  theme: 'light' | 'dark'
  onTheme: (t: 'light' | 'dark') => void
  onOpenMenu: () => void
}

export function Header({ theme, onTheme, onOpenMenu }: Props) {
  return (
    <header className="flex flex-wrap items-center gap-3 border-b border-line px-3 py-3 sm:px-4">
      <button
        type="button"
        onClick={onOpenMenu}
        className="inline-flex min-h-11 items-center gap-2 rounded-md border border-line-strong bg-panel px-3 text-xs font-bold tracking-wider uppercase hover:bg-panel-2"
      >
        <Menu aria-hidden className="size-4" />
        Protocolos
      </button>

      <a href="/" className="flex min-h-11 items-center gap-3 rounded-md" aria-label="Protocolos de Red, inicio">
        <span className="grid size-11 place-items-center rounded-md border border-line bg-panel">
          <Boxes aria-hidden className="size-6 text-accent dark:text-blue-300" />
        </span>
        <span className="leading-tight">
          <span className="block text-lg font-bold tracking-[0.18em] uppercase sm:text-xl">
            Protocolos <em className="text-accent not-italic dark:text-blue-300">de Red</em>
          </span>
          <span className="hidden text-[11px] tracking-[0.2em] text-muted uppercase sm:block">
            Aprende cómo funciona Internet
          </span>
        </span>
      </a>

      <div className="ml-auto flex items-center gap-3">
        <p className="text-right text-[11px] leading-tight">
          <span className="block font-bold tracking-wider text-muted uppercase">Diseñado por</span>
          <span className="font-bold">David</span>
        </p>

        <div role="group" aria-label="Tema de color" className="flex rounded-md border border-line-strong bg-panel p-0.5">
          <button
            type="button"
            aria-pressed={theme === 'light'}
            onClick={() => onTheme('light')}
            className="grid size-10 place-items-center rounded aria-pressed:bg-accent aria-pressed:text-accent-fg"
          >
            <Sun aria-hidden className="size-4" />
            <span className="sr-only">Tema claro</span>
          </button>
          <button
            type="button"
            aria-pressed={theme === 'dark'}
            onClick={() => onTheme('dark')}
            className="grid size-10 place-items-center rounded aria-pressed:bg-accent aria-pressed:text-accent-fg"
          >
            <Moon aria-hidden className="size-4" />
            <span className="sr-only">Tema oscuro</span>
          </button>
        </div>
      </div>
    </header>
  )
}

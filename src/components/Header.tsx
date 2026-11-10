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
        <div className="text-[11px] leading-tight">
          <span className="block font-bold tracking-wider text-muted uppercase">Diseñado por</span>
          <a
            href="https://github.com/davidzabalaasir-create"
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex min-h-6 items-center gap-1.5 text-sm font-bold hover:underline"
          >
            <svg aria-hidden viewBox="0 0 16 16" className="size-4" fill="currentColor">
              <path d="M8 0C3.58 0 0 3.58 0 8c0 3.54 2.29 6.53 5.47 7.59.4.07.55-.17.55-.38 0-.19-.01-.82-.01-1.49-2.01.37-2.53-.49-2.69-.94-.09-.23-.48-.94-.82-1.13-.28-.15-.68-.52-.01-.53.63-.01 1.08.58 1.23.82.72 1.21 1.87.87 2.33.66.07-.52.28-.87.51-1.07-1.78-.2-3.64-.89-3.64-3.95 0-.87.31-1.59.82-2.15-.08-.2-.36-1.02.08-2.12 0 0 .67-.21 2.2.82.64-.18 1.32-.27 2-.27.68 0 1.36.09 2 .27 1.53-1.04 2.2-.82 2.2-.82.44 1.1.16 1.92.08 2.12.51.56.82 1.27.82 2.15 0 3.07-1.87 3.75-3.65 3.95.29.25.54.73.54 1.48 0 1.07-.01 1.93-.01 2.2 0 .21.15.46.55.38A8.013 8.013 0 0016 8c0-4.42-3.58-8-8-8z" />
            </svg>
            David
            <span className="sr-only">(GitHub, se abre en una pestaña nueva)</span>
          </a>
        </div>

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

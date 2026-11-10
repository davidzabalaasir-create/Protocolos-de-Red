import { Search } from 'lucide-react'
import { useEffect, useId, useMemo, useRef, useState } from 'react'
import { OSI_LAYERS, PROTOCOLS } from '../data/protocols'

interface Props {
  currentLayer: number
  onSelect: (id: string) => void
  onLayer: (layer: number) => void
}

export function Toolbar({ currentLayer, onSelect, onLayer }: Props) {
  const [query, setQuery] = useState('')
  const [active, setActive] = useState(0)
  const inputRef = useRef<HTMLInputElement>(null)
  const listId = useId()

  const results = useMemo(() => {
    const q = query.trim().toLowerCase()
    if (!q) return []
    return PROTOCOLS.filter((p) => `${p.name} ${p.full}`.toLowerCase().includes(q))
  }, [query])

  // Ctrl/Cmd + K focuses search, like the original
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if ((e.ctrlKey || e.metaKey) && e.key.toLowerCase() === 'k') {
        e.preventDefault()
        inputRef.current?.focus()
      }
    }
    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
  }, [])

  const choose = (id: string) => {
    onSelect(id)
    setQuery('')
  }

  const open = results.length > 0 || query.trim() !== ''

  return (
    <div className="flex flex-wrap items-end gap-4 px-3 py-3 sm:px-4">
      <div className="relative min-w-60 flex-1">
        <label htmlFor="search" className="sr-only">
          Buscar protocolos
        </label>
        <Search aria-hidden className="pointer-events-none absolute top-1/2 left-3 size-4 -translate-y-1/2 text-muted" />
        <input
          id="search"
          ref={inputRef}
          type="search"
          role="combobox"
          aria-expanded={open}
          aria-controls={listId}
          aria-autocomplete="list"
          aria-activedescendant={results[active] ? `${listId}-${results[active].id}` : undefined}
          placeholder="Buscar protocolos"
          value={query}
          onChange={(e) => {
            setQuery(e.target.value)
            setActive(0)
          }}
          onKeyDown={(e) => {
            if (e.key === 'ArrowDown') {
              e.preventDefault()
              setActive((a) => Math.min(a + 1, results.length - 1))
            } else if (e.key === 'ArrowUp') {
              e.preventDefault()
              setActive((a) => Math.max(a - 1, 0))
            } else if (e.key === 'Enter' && results[active]) {
              choose(results[active].id)
            } else if (e.key === 'Escape') {
              setQuery('')
            }
          }}
          className="h-11 w-full rounded-md border border-line-strong bg-panel pr-20 pl-9 text-sm placeholder:text-muted"
        />
        <kbd className="pointer-events-none absolute top-1/2 right-2 hidden -translate-y-1/2 rounded border border-line px-1.5 py-0.5 text-[11px] text-muted sm:block">
          Ctrl K
        </kbd>
        {open && (
          <ul
            id={listId}
            role="listbox"
            aria-label="Resultados"
            className="absolute z-20 mt-1 w-full overflow-hidden rounded-md border border-line bg-panel shadow-xl"
          >
            {results.length === 0 && <li className="p-3 text-sm text-muted">Sin resultados</li>}
            {results.map((p, i) => (
              <li
                key={p.id}
                id={`${listId}-${p.id}`}
                role="option"
                aria-selected={i === active}
                onMouseDown={(e) => e.preventDefault()}
                onClick={() => choose(p.id)}
                className="flex min-h-11 cursor-pointer items-center gap-3 px-3 text-sm aria-selected:bg-accent aria-selected:text-accent-fg"
              >
                <strong>{p.name}</strong>
                <span className="truncate opacity-80">{p.full}</span>
              </li>
            ))}
          </ul>
        )}
      </div>

      <fieldset className="min-w-0">
        <legend className="mb-1 flex w-full justify-between gap-6 text-[11px] font-bold tracking-widest text-muted uppercase">
          <span>Capa OSI</span>
          <span aria-live="polite">{OSI_LAYERS[currentLayer]}</span>
        </legend>
        <div className="flex gap-1">
          {[1, 2, 3, 4, 5, 6, 7].map((l) => (
            <button
              key={l}
              type="button"
              onClick={() => onLayer(l)}
              aria-current={l === currentLayer ? 'true' : undefined}
              aria-label={`Capa ${l}, ${OSI_LAYERS[l]}: ver protocolos`}
              className="grid size-11 place-items-center rounded border border-line-strong bg-panel text-sm hover:bg-panel-2 aria-[current]:border-accent aria-[current]:bg-accent aria-[current]:font-bold aria-[current]:text-accent-fg"
            >
              {l}
            </button>
          ))}
        </div>
      </fieldset>
    </div>
  )
}

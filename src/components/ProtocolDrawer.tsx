import { X } from 'lucide-react'
import { useEffect, useRef } from 'react'
import { OSI_LAYERS, PROTOCOLS } from '../data/protocols'

interface Props {
  open: boolean
  layer: number | null
  currentId: string
  onClose: () => void
  onSelect: (id: string) => void
  onLayer: (layer: number | null) => void
}

/** Side panel listing protocols, grouped by OSI layer. Native <dialog> gives focus trapping and Escape. */
export function ProtocolDrawer({ open, layer, currentId, onClose, onSelect, onLayer }: Props) {
  const ref = useRef<HTMLDialogElement>(null)

  useEffect(() => {
    const d = ref.current
    if (!d) return
    if (open && !d.open) d.showModal()
    if (!open && d.open) d.close()
  }, [open])

  const layers = [7, 4, 3, 2].filter((l) => layer === null || l === layer)

  return (
    <dialog
      ref={ref}
      onClose={onClose}
      onClick={(e) => e.target === ref.current && onClose()}
      aria-labelledby="drawer-title"
      className="m-0 h-full max-h-none w-[min(22rem,100vw)] border-r border-line bg-panel p-0 text-fg"
    >
      <div className="flex items-center justify-between border-b border-line p-4">
        <h2 id="drawer-title" className="text-sm font-bold tracking-widest uppercase">
          Protocolos
        </h2>
        <button
          type="button"
          onClick={onClose}
          className="grid size-11 place-items-center rounded-md hover:bg-panel-2"
        >
          <X aria-hidden className="size-5" />
          <span className="sr-only">Cerrar lista de protocolos</span>
        </button>
      </div>

      {layer !== null && (
        <div className="flex items-center justify-between gap-2 border-b border-line px-4 py-2 text-xs">
          <span>
            Filtrado: capa {layer} · {OSI_LAYERS[layer]}
          </span>
          <button type="button" onClick={() => onLayer(null)} className="min-h-11 px-2 font-bold text-accent underline dark:text-blue-300">
            Ver todas
          </button>
        </div>
      )}

      <nav aria-label="Lista de protocolos" className="p-2">
        {layers.map((l) => (
          <section key={l} className="mb-3">
            <h3 className="px-2 py-2 text-[11px] font-bold tracking-widest text-muted uppercase">
              Capa {l} · {OSI_LAYERS[l]}
            </h3>
            <ul>
              {PROTOCOLS.filter((p) => p.layer === l).map((p) => (
                <li key={p.id}>
                  <button
                    type="button"
                    aria-current={p.id === currentId ? 'true' : undefined}
                    onClick={() => onSelect(p.id)}
                    className="flex min-h-11 w-full items-center justify-between gap-3 rounded-md px-3 text-left hover:bg-panel-2 aria-[current]:bg-accent aria-[current]:text-accent-fg"
                  >
                    <span className="font-bold">{p.name}</span>
                    <span className="truncate text-xs opacity-80">{p.full}</span>
                  </button>
                </li>
              ))}
            </ul>
          </section>
        ))}
        {layers.every((l) => !PROTOCOLS.some((p) => p.layer === l)) && (
          <p className="p-3 text-sm text-muted">Todavía no hay lecciones para esta capa.</p>
        )}
      </nav>
    </dialog>
  )
}

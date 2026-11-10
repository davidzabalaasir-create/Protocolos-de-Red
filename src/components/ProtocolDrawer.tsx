import { CircleCheck, Route, X } from 'lucide-react'
import { useEffect, useRef } from 'react'
import { OSI_LAYERS, PROTOCOLS } from '../data/protocols'
import { QUIZ } from '../data/quiz'
import { isDone, type Progress } from '../lib/progress'
import { TOUR } from '../data/tour'
import { Button } from './ui/Button'

interface Props {
  open: boolean
  layer: number | null
  currentId: string
  progress: Progress
  onClose: () => void
  onSelect: (id: string) => void
  onLayer: (layer: number | null) => void
}

/** Side panel listing protocols, grouped by OSI layer. Native <dialog> gives focus trapping and Escape. */
export function ProtocolDrawer({ open, layer, currentId, progress, onClose, onSelect, onLayer }: Props) {
  const ref = useRef<HTMLDialogElement>(null)

  useEffect(() => {
    const d = ref.current
    if (!d) return
    if (open && !d.open) d.showModal()
    if (!open && d.open) d.close()
  }, [open])

  const doneCount = PROTOCOLS.filter((p) => isDone(progress, p.id, QUIZ[p.id]?.length ?? 0)).length
  const layers = [7, 6, 5, 4, 3, 2, 1].filter((l) => (layer === null || l === layer) && PROTOCOLS.some((p) => p.layer === l))

  return (
    <dialog
      ref={ref}
      onClose={onClose}
      onClick={(e) => e.target === ref.current && onClose()}
      aria-labelledby="drawer-title"
      className="m-0 h-full max-h-none w-[min(22rem,100vw)] border-r border-line bg-panel p-0 text-fg"
    >
      <div className="flex items-center justify-between border-b border-line p-4">
        <div>
          <h2 id="drawer-title" className="text-sm font-bold tracking-widest uppercase">
            Protocolos
          </h2>
          <p className="mt-1 text-xs text-muted">
            {doneCount}/{PROTOCOLS.length} completados
          </p>
          <div aria-hidden className="mt-1.5 h-1 w-40 overflow-hidden rounded-full bg-panel-2">
            <div className="h-full rounded-full bg-accent" style={{ width: `${(doneCount / PROTOCOLS.length) * 100}%` }} />
          </div>
        </div>
        <Button variant="ghost" size="icon" label="Cerrar lista de protocolos" shortcut="Esc" onClick={onClose}>
          <X aria-hidden className="size-5" />
        </Button>
      </div>

      {layer !== null && (
        <div className="flex items-center justify-between gap-2 border-b border-line px-4 py-2 text-xs">
          <span>
            Filtrado: capa {layer} · {OSI_LAYERS[layer]}
          </span>
          <Button variant="ghost" size="sm" onClick={() => onLayer(null)}>
            Ver todas
          </Button>
        </div>
      )}

      <div className="border-b border-line p-3">
        <Button variant="primary" className="w-full" onClick={() => onSelect(TOUR[0].id)}>
          <Route aria-hidden className="size-4" />
          Empezar el recorrido guiado ({TOUR.length} lecciones)
        </Button>
      </div>

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
                    className="flex min-h-11 w-full items-center justify-between gap-3 rounded-lg px-3 text-left hover:bg-panel-2 aria-[current]:bg-accent aria-[current]:text-accent-fg"
                  >
                    <span className="flex items-center gap-2 font-bold">
                      {p.name}
                      {isDone(progress, p.id, QUIZ[p.id]?.length ?? 0) && (
                        <CircleCheck aria-label="completado" className="size-4 text-green-700 aria-[current]:text-current dark:text-green-400" />
                      )}
                    </span>
                    <span className="truncate text-xs opacity-80">{p.full}</span>
                  </button>
                </li>
              ))}
            </ul>
          </section>
        ))}
        {layers.length === 0 && (
          <p className="p-3 text-sm text-muted">Todavía no hay lecciones para esta capa.</p>
        )}
      </nav>
    </dialog>
  )
}

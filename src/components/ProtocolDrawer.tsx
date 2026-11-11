import { PanelLeftClose, X } from 'lucide-react'
import { useEffect, useRef } from 'react'
import { useT } from '../i18n'
import type { Progress } from '../lib/progress'
import { ListProgress, ProtocolList } from './ProtocolList'
import { Button } from './ui/Button'

interface Props {
  onExam?: () => void
  open: boolean
  layer: number | null
  currentId: string
  progress: Progress
  onClose: () => void
  onSelect: (id: string) => void
  onLayer: (layer: number | null) => void
}

/** Protocol list as a modal panel (narrow screens). Native <dialog> gives focus trapping and Escape. */
export function ProtocolDrawer({ open, layer, currentId, progress, onClose, onSelect, onLayer, onExam }: Props) {
  const t = useT()
  const ref = useRef<HTMLDialogElement>(null)

  useEffect(() => {
    const d = ref.current
    if (!d) return
    if (open && !d.open) d.showModal()
    if (!open && d.open) d.close()
  }, [open])

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
            {t('Protocolos')}
          </h2>
          <ListProgress progress={progress} />
        </div>
        <Button variant="ghost" size="icon" label={t('Cerrar lista de protocolos')} shortcut="Esc" onClick={onClose}>
          <X aria-hidden className="size-5" />
        </Button>
      </div>
      <ProtocolList layer={layer} currentId={currentId} progress={progress} onSelect={onSelect} onLayer={onLayer} onExam={onExam} />
    </dialog>
  )
}

/** Protocol list as a fixed, collapsible sidebar (wide screens). */
export function ProtocolSidebar({ layer, currentId, progress, onSelect, onLayer, onHide, onExam }: Omit<Props, 'open' | 'onClose'> & { onHide: () => void }) {
  const t = useT()
  return (
    <aside
      aria-labelledby="sidebar-title"
      className="sticky top-3 flex max-h-[calc(100dvh-1.5rem)] w-72 shrink-0 flex-col overflow-hidden rounded-lg border border-line bg-panel"
    >
      <div className="flex items-start justify-between border-b border-line p-4">
        <div>
          <h2 id="sidebar-title" className="text-sm font-bold tracking-widest uppercase">
            {t('Protocolos')}
          </h2>
          <ListProgress progress={progress} />
        </div>
        <Button variant="ghost" size="iconSm" label={t('Ocultar lista de protocolos')} onClick={onHide}>
          <PanelLeftClose aria-hidden className="size-4" />
        </Button>
      </div>
      <div className="flex-1 overflow-y-auto">
        <ProtocolList layer={layer} currentId={currentId} progress={progress} onSelect={onSelect} onLayer={onLayer} onExam={onExam} />
      </div>
    </aside>
  )
}

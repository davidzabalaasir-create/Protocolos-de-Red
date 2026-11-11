import { Check, Copy, X } from 'lucide-react'
import { useEffect, useRef, useState } from 'react'
import type { Protocol } from '../data/protocols'
import { useT } from '../i18n'
import { SITE } from '../lib/site'
import { Button } from './ui/Button'

/** Copy-paste <iframe> code to put a lesson inside Moodle, Google Classroom or any web page. */
export function EmbedDialog({ protocol, onClose }: { protocol: Protocol; onClose: () => void }) {
  const t = useT()
  const ref = useRef<HTMLDialogElement>(null)
  const [copied, setCopied] = useState(false)
  useEffect(() => {
    const d = ref.current
    if (d && !d.open) d.showModal()
  }, [])
  const code = `<iframe src="${SITE}/${protocol.id}/?embed=1" title="${protocol.name} · Protocolos de Red" width="100%" height="640" style="border:0" loading="lazy" allow="fullscreen"></iframe>`
  const copy = async () => {
    try {
      await navigator.clipboard.writeText(code)
      setCopied(true)
      setTimeout(() => setCopied(false), 2000)
    } catch {
      /* clipboard blocked: the text is selectable anyway */
    }
  }
  return (
    <dialog ref={ref} onClose={onClose} aria-labelledby="embed-title" className="m-auto w-[min(96vw,40rem)] rounded-lg border border-line bg-panel p-0 text-fg">
      <div className="flex items-center justify-between border-b border-line px-4 py-3">
        <h2 id="embed-title" className="text-sm font-bold tracking-widest uppercase">
          {t('Incrustar en un aula virtual')}
        </h2>
        <Button variant="ghost" size="icon" label={t('Cerrar')} shortcut="Esc" onClick={onClose}>
          <X aria-hidden className="size-5" />
        </Button>
      </div>
      <div className="flex flex-col gap-3 p-4 text-sm">
        <p className="text-muted">{t('Pega este código en Moodle, Google Classroom o cualquier página que admita HTML. Se mostrará solo la lección, sin menús.')}</p>
        <label className="flex flex-col gap-1 text-xs font-bold tracking-wider uppercase">
          {t('Código')}
          <textarea readOnly value={code} rows={4} onFocus={(e) => e.currentTarget.select()} className="rounded-lg border border-line-strong bg-panel-2 p-2 font-mono text-xs font-normal normal-case tracking-normal" />
        </label>
        <Button variant="primary" onClick={copy}>
          {copied ? <Check aria-hidden className="size-4" /> : <Copy aria-hidden className="size-4" />}
          {copied ? t('Copiado') : t('Copiar código')}
        </Button>
      </div>
    </dialog>
  )
}

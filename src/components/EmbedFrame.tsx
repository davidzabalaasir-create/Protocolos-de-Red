import { ExternalLink } from 'lucide-react'
import type { ReactNode } from 'react'
import type { Protocol } from '../data/protocols'
import { useT } from '../i18n'
import { lessonUrl } from '../lib/url'

/** Compact layout for ?embed=1: just the lesson, with a link to open it on the full site. */
export function EmbedFrame({ protocol, children }: { protocol: Protocol; children: ReactNode }) {
  const t = useT()
  return (
    <div className="flex min-h-dvh flex-col gap-2 p-2">
      <header className="flex items-center justify-between gap-2 px-1">
        <h1 className="text-sm font-bold tracking-widest uppercase">
          {protocol.name} <span className="font-normal text-muted normal-case">· {protocol.full}</span>
        </h1>
        <a href={lessonUrl(protocol.id)} target="_blank" rel="noopener noreferrer" className="inline-flex min-h-9 items-center gap-1.5 rounded-md px-2 text-xs font-bold underline-offset-4 hover:underline">
          {t('Abrir en Protocolos de Red')}
          <ExternalLink aria-hidden className="size-3.5" />
        </a>
      </header>
      <main id="main" className="flex flex-col gap-2">
        {children}
      </main>
    </div>
  )
}

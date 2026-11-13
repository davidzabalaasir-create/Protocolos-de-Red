import { useT } from '../../i18n'
import { SectionShell } from '../SectionShell'
import { ConsolePage } from './ConsolePage'

/** /consola/: the IOS-style practice terminal inside the shared section frame. */
export default function ConsoleApp() {
  const t = useT()
  return (
    <SectionShell title={t('Consola')}>
      <ConsolePage />
    </SectionShell>
  )
}

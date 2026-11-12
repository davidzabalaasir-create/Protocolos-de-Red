import { useT } from '../../i18n'
import { SectionShell } from '../SectionShell'
import { RefPage } from './RefPage'

/** /referencia/: the CCNA cheat sheet and flashcards inside the shared section frame. */
export default function RefApp() {
  const t = useT()
  return (
    <SectionShell title={t('Referencia')}>
      <RefPage />
    </SectionShell>
  )
}

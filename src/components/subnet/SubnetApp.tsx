import { useT } from '../../i18n'
import { SectionShell } from '../SectionShell'
import { parseSubnetHash, SubnetPage } from './SubnetPage'

/** /subneteo/: the subnetting tools inside the shared section frame. */
export default function SubnetApp() {
  const t = useT()
  return (
    <SectionShell title={t('Subneteo')}>
      <SubnetPage initial={parseSubnetHash(location.hash)} />
    </SectionShell>
  )
}

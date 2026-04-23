import { PageHeader } from '@/shared/ui/app-shell/PageHeader'
import { SurfaceCard } from '@/shared/ui/cards/SurfaceCard'
import { StatusBadge } from '@/shared/ui/status/StatusBadge'

export default function SkillsPage() {
  return (
    <>
      <PageHeader
        eyebrow="Skills"
        title="Skills"
        subtitle="Única superficie editable del MVP. En esta fase solo se habilita el contenedor de navegación."
      />
      <SurfaceCard title="Edición controlada (pendiente)">
        <p style={{ marginTop: 0 }}>Todavía no se implementan flujos de edición. Esta ruta queda como placeholder del módulo productivo.</p>
        <StatusBadge status="sin-datos" />
      </SurfaceCard>
    </>
  )
}

import { PageHeader } from '@/shared/ui/app-shell/PageHeader'
import { SurfaceCard } from '@/shared/ui/cards/SurfaceCard'
import { StatusBadge } from '@/shared/ui/status/StatusBadge'

export default function HealthcheckPage() {
  return (
    <>
      <PageHeader
        eyebrow="Healthcheck"
        title="Salud del sistema"
        subtitle="Placeholder técnico para chequeos transversales de infraestructura y módulos."
      />
      <SurfaceCard title="Estado general">
        <p style={{ marginTop: 0 }}>Panel de healthcheck se implementará en la siguiente microfase.</p>
        <StatusBadge status="stale" />
      </SurfaceCard>
    </>
  )
}

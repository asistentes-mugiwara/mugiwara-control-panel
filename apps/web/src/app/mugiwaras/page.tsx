import { PageHeader } from '@/shared/ui/app-shell/PageHeader'
import { SurfaceCard } from '@/shared/ui/cards/SurfaceCard'
import { StatusBadge } from '@/shared/ui/status/StatusBadge'

export default function MugiwarasPage() {
  return (
    <>
      <PageHeader
        eyebrow="Mugiwaras"
        title="Tripulación"
        subtitle="Placeholder del módulo de lectura de agentes y su estado operativo."
      />
      <SurfaceCard title="Módulo en construcción">
        <p style={{ marginTop: 0 }}>La fase actual entrega shell + navegación. El detalle de agentes llega en la siguiente fase.</p>
        <StatusBadge status="revision" />
      </SurfaceCard>
    </>
  )
}

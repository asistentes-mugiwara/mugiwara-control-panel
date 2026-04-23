import { PageHeader } from '@/shared/ui/app-shell/PageHeader'
import { SurfaceCard } from '@/shared/ui/cards/SurfaceCard'
import { StatusBadge } from '@/shared/ui/status/StatusBadge'

export default function MemoryPage() {
  return (
    <>
      <PageHeader
        eyebrow="Memory"
        title="Memoria operativa"
        subtitle="Módulo dedicado a memoria. Permanece separado de Vault por diseño."
      />
      <SurfaceCard title="Separación de dominios">
        <p style={{ marginTop: 0 }}>
          Esta vista representa solo memoria. Vault mantiene su ruta y experiencia independientes.
        </p>
        <StatusBadge status="operativo" />
      </SurfaceCard>
    </>
  )
}

import { PageHeader } from '@/shared/ui/app-shell/PageHeader'
import { SurfaceCard } from '@/shared/ui/cards/SurfaceCard'
import { StatusBadge } from '@/shared/ui/status/StatusBadge'

export default function DashboardPage() {
  return (
    <>
      <PageHeader
        eyebrow="Dashboard"
        title="Estado del barco"
        subtitle="Vista inicial del control plane con señales de navegación y salud general del sistema."
      />

      <section
        style={{
          display: 'grid',
          gap: '14px',
          gridTemplateColumns: 'repeat(auto-fit, minmax(260px, 1fr))',
        }}
      >
        <SurfaceCard title="Señales del sistema" elevated>
          <p style={{ marginTop: 0 }}>Backend principal en monitoreo interno. API pública sin exposición.</p>
          <StatusBadge status="operativo" />
        </SurfaceCard>

        <SurfaceCard title="Incidencias recientes">
          <p style={{ marginTop: 0 }}>Sin incidencias críticas en esta fase.</p>
          <StatusBadge status="sin-datos" />
        </SurfaceCard>

        <SurfaceCard title="Tripulación activa">
          <p style={{ marginTop: 0, marginBottom: '8px' }}>
            Shell base activo para Dashboard, Mugiwaras, Skills, Memory, Vault y Healthcheck.
          </p>
          <StatusBadge status="revision" />
        </SurfaceCard>
      </section>
    </>
  )
}

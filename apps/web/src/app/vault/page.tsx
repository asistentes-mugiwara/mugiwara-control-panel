import { PageHeader } from '@/shared/ui/app-shell/PageHeader'
import { SurfaceCard } from '@/shared/ui/cards/SurfaceCard'
import { StatusBadge } from '@/shared/ui/status/StatusBadge'

export default function VaultPage() {
  return (
    <>
      <PageHeader
        eyebrow="Vault"
        title="Vault"
        subtitle="Repositorio documental curado y separado explícitamente de Memory."
      />
      <SurfaceCard title="Módulo en construcción">
        <p style={{ marginTop: 0 }}>
          Placeholder de navegación para la superficie de lectura documental de Vault.
        </p>
        <StatusBadge status="revision" />
      </SurfaceCard>
    </>
  )
}

import Link from 'next/link'

import { vaultIndexFixture } from '@/modules/vault/view-models/vault-index.fixture'
import { PageHeader } from '@/shared/ui/app-shell/PageHeader'
import { SurfaceCard } from '@/shared/ui/cards/SurfaceCard'
import { StatusBadge } from '@/shared/ui/status/StatusBadge'
import { appTheme } from '@/shared/theme/tokens'

function getVaultFreshnessStatus(state: 'fresh' | 'stale') {
  return state === 'stale' ? 'stale' : 'operativo'
}

export default function VaultPage() {
  const index = vaultIndexFixture

  return (
    <>
      <PageHeader
        eyebrow="Vault"
        title="Vault"
        subtitle="Índice read-only allowlisted con breadcrumbs y frescura visible, separado explícitamente de Memory."
      />

      <SurfaceCard title="Contexto del índice">
        <div style={{ display: 'flex', gap: '10px', flexWrap: 'wrap', alignItems: 'center', marginBottom: '10px' }}>
          <StatusBadge status={getVaultFreshnessStatus(index.freshness.state)} />
          <span style={{ color: appTheme.colors.textSecondary, fontSize: '13px' }}>{index.freshness.label}</span>
          <span style={{ color: appTheme.colors.textMuted, fontSize: '13px' }}>
            Última actualización: {index.freshness.updated_at}
          </span>
        </div>

        <nav id="index-root" aria-label="Breadcrumbs de Vault" style={{ display: 'flex', gap: '8px', flexWrap: 'wrap' }}>
          {index.breadcrumbs.map((breadcrumb, breadcrumbIndex) => (
            <span key={breadcrumb.href} style={{ color: appTheme.colors.textSecondary, fontSize: '13px' }}>
              <Link href={breadcrumb.href} style={{ color: appTheme.colors.brandSky500, textDecoration: 'none' }}>
                {breadcrumb.label}
              </Link>
              {breadcrumbIndex < index.breadcrumbs.length - 1 ? ' / ' : ''}
            </span>
          ))}
        </nav>
      </SurfaceCard>

      <section
        style={{
          marginTop: '14px',
          display: 'grid',
          gap: '14px',
          gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))',
        }}
      >
        {index.entries.map((entry) => (
          <SurfaceCard key={entry.id} title={entry.label} elevated>
            <div style={{ display: 'grid', gap: '10px' }}>
              <div style={{ display: 'flex', gap: '10px', flexWrap: 'wrap', alignItems: 'center' }}>
                <StatusBadge status={entry.kind === 'directory' ? 'operativo' : 'revision'} />
                <span style={{ color: appTheme.colors.textSecondary, fontSize: '13px' }}>{entry.path_segment}</span>
              </div>

              <p style={{ margin: 0, color: appTheme.colors.textSecondary }}>{entry.summary}</p>

              <Link
                href={entry.anchor}
                style={{ color: appTheme.colors.brandSky500, textDecoration: 'none', fontWeight: 600 }}
              >
                Ir al bloque allowlisted
              </Link>

              <div
                id={entry.anchor.slice(1)}
                style={{
                  borderTop: `1px solid ${appTheme.colors.borderSubtle}`,
                  paddingTop: '10px',
                  color: appTheme.colors.textMuted,
                  fontSize: '13px',
                }}
              >
                {entry.kind === 'directory'
                  ? 'Directorio visible en esta fase. El detalle por ruta queda fuera de alcance.'
                  : 'Documento allowlisted visible solo a nivel de índice en esta fase.'}
              </div>
            </div>
          </SurfaceCard>
        ))}
      </section>
    </>
  )
}

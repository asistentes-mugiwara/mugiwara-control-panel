import { memoryAgentSummaryFixture } from '@/modules/memory/view-models/memory-agent-summary.fixture'
import { PageHeader } from '@/shared/ui/app-shell/PageHeader'
import { SurfaceCard } from '@/shared/ui/cards/SurfaceCard'
import { StatusBadge } from '@/shared/ui/status/StatusBadge'
import { appTheme } from '@/shared/theme/tokens'

function formatMugiwaraLabel(slug: string) {
  return slug.charAt(0).toUpperCase() + slug.slice(1)
}

export default function MemoryPage() {
  return (
    <>
      <PageHeader
        eyebrow="Memory"
        title="Memoria operativa"
        subtitle="Resumen read-only por Mugiwara con facts visibles y última actualización, sin mezclarse con Vault."
      />

      <SurfaceCard title="Separación de dominios">
        <p style={{ marginTop: 0, marginBottom: '10px', color: appTheme.colors.textSecondary }}>
          Memory muestra continuidad resumida por Mugiwara. Vault conserva su propio índice documental y no
          comparte su modelo de lectura con esta vista.
        </p>
        <StatusBadge status="operativo" />
      </SurfaceCard>

      <section
        style={{
          marginTop: '14px',
          display: 'grid',
          gap: '14px',
          gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))',
        }}
      >
        {memoryAgentSummaryFixture.map((agent) => (
          <SurfaceCard key={agent.mugiwara_slug} title={formatMugiwaraLabel(agent.mugiwara_slug)} elevated>
            <p style={{ marginTop: 0, marginBottom: '12px', color: appTheme.colors.textSecondary }}>
              {agent.summary}
            </p>

            <div style={{ display: 'flex', gap: '10px', flexWrap: 'wrap', marginBottom: '12px' }}>
              <StatusBadge status={agent.fact_count >= 6 ? 'operativo' : 'revision'} />
              <span style={{ color: appTheme.colors.textSecondary, fontSize: '13px' }}>
                {agent.fact_count} facts visibles
              </span>
              <span style={{ color: appTheme.colors.textMuted, fontSize: '13px' }}>
                Última actualización: {agent.last_updated}
              </span>
            </div>

            <div style={{ display: 'flex', flexWrap: 'wrap', gap: '8px' }}>
              {agent.badges.map((badge) => (
                <span
                  key={badge}
                  style={{
                    border: `1px solid ${appTheme.colors.borderSubtle}`,
                    borderRadius: '999px',
                    padding: '4px 10px',
                    color: appTheme.colors.textSecondary,
                    fontSize: '12px',
                    background: appTheme.colors.bgSurface1,
                  }}
                >
                  {badge}
                </span>
              ))}
            </div>
          </SurfaceCard>
        ))}
      </section>
    </>
  )
}

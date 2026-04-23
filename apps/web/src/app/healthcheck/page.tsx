import {
  getHealthcheckSeverityLabel,
  getHealthcheckStatusLabel,
  mapHealthcheckSeverityToBadgeStatus,
  mapHealthcheckStatusToBadgeStatus,
} from '@/modules/healthcheck/view-models/healthcheck-mappers'
import { healthcheckSummaryFixture } from '@/modules/healthcheck/view-models/healthcheck-summary.fixture'
import { PageHeader } from '@/shared/ui/app-shell/PageHeader'
import { SurfaceCard } from '@/shared/ui/cards/SurfaceCard'
import { StatusBadge } from '@/shared/ui/status/StatusBadge'
import { appTheme } from '@/shared/theme/tokens'

export default function HealthcheckPage() {
  return (
    <>
      <PageHeader
        eyebrow="Healthcheck"
        title="Salud del sistema"
        subtitle="Checks saneados en modo lectura con separación explícita entre severidad y estado operativo."
      />

      <SurfaceCard title="Resumen de checks">
        <p style={{ marginTop: 0, color: appTheme.colors.textSecondary }}>
          Vista read-only de checks sanitizados. No se exponen salidas crudas ni metadata sensible del host.
        </p>

        <div style={{ display: 'grid', gap: '10px' }}>
          {healthcheckSummaryFixture.map((check) => (
            <article
              key={check.check_id}
              style={{
                border: `1px solid ${appTheme.colors.borderSubtle}`,
                borderRadius: appTheme.radius.md,
                padding: '12px',
                display: 'grid',
                gap: '8px',
              }}
            >
              <div style={{ display: 'flex', justifyContent: 'space-between', gap: '10px', flexWrap: 'wrap' }}>
                <strong>{check.label}</strong>
                <code style={{ fontSize: '12px', color: appTheme.colors.textMuted }}>{check.check_id}</code>
              </div>

              <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap', alignItems: 'center' }}>
                <span style={{ color: appTheme.colors.textSecondary, fontSize: '12px' }}>
                  Estado: {getHealthcheckStatusLabel(check.status)}
                </span>
                <StatusBadge status={mapHealthcheckStatusToBadgeStatus(check.status)} />

                <span style={{ color: appTheme.colors.textSecondary, fontSize: '12px' }}>
                  Severidad: {getHealthcheckSeverityLabel(check.severity)}
                </span>
                <StatusBadge status={mapHealthcheckSeverityToBadgeStatus(check.severity)} />
              </div>

              <p style={{ margin: 0, color: appTheme.colors.textSecondary }}>
                <strong>Freshness:</strong> {check.freshness.label} ({check.freshness.updated_at})
              </p>
              <p style={{ margin: 0 }}>
                <strong>Warning:</strong> {check.warning_text}
              </p>
              <p style={{ margin: 0, color: appTheme.colors.textSecondary }}>
                <strong>Source:</strong> {check.source_label}
              </p>
            </article>
          ))}
        </div>
      </SurfaceCard>
    </>
  )
}

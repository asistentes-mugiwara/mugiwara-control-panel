import {
  getHealthcheckSeverityLabel,
  getHealthcheckStatusLabel,
  mapHealthcheckSeverityToBadgeStatus,
  mapHealthcheckStatusToBadgeStatus,
} from '@/modules/healthcheck/view-models/healthcheck-mappers'
import { healthcheckWorkspaceFixture } from '@/modules/healthcheck/view-models/healthcheck-summary.fixture'
import { PageHeader } from '@/shared/ui/app-shell/PageHeader'
import { SurfaceCard } from '@/shared/ui/cards/SurfaceCard'
import { StatusBadge } from '@/shared/ui/status/StatusBadge'
import { appTheme } from '@/shared/theme/tokens'

function formatTimestamp(value: string) {
  const date = new Date(value)

  if (Number.isNaN(date.getTime())) {
    return value
  }

  return new Intl.DateTimeFormat('es-ES', {
    dateStyle: 'short',
    timeStyle: 'short',
  }).format(date)
}

export default function HealthcheckPage() {
  const workspace = healthcheckWorkspaceFixture

  return (
    <>
      <PageHeader
        eyebrow="Healthcheck"
        title="Salud del sistema"
        subtitle="Resumen operativo del perímetro: estado general, módulos, eventos recientes y señales saneadas sin exponer metadata sensible del host."
      />

      <SurfaceCard title="Health summary bar" elevated>
        <div
          style={{
            display: 'grid',
            gap: '12px',
            gridTemplateColumns: 'repeat(auto-fit, minmax(180px, 1fr))',
          }}
        >
          <div style={{ display: 'grid', gap: '8px' }}>
            <span style={{ color: appTheme.colors.textMuted, fontSize: '13px' }}>Estado general</span>
            <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap', alignItems: 'center' }}>
              <StatusBadge status={mapHealthcheckStatusToBadgeStatus(workspace.summary_bar.overall_status)} />
              <span style={{ color: appTheme.colors.textSecondary }}>{getHealthcheckStatusLabel(workspace.summary_bar.overall_status)}</span>
            </div>
          </div>

          <div style={{ display: 'grid', gap: '8px' }}>
            <span style={{ color: appTheme.colors.textMuted, fontSize: '13px' }}>Checks</span>
            <strong style={{ fontSize: '24px' }}>{workspace.summary_bar.checks_total}</strong>
          </div>

          <div style={{ display: 'grid', gap: '8px' }}>
            <span style={{ color: appTheme.colors.textMuted, fontSize: '13px' }}>Warnings</span>
            <strong style={{ fontSize: '24px' }}>{workspace.summary_bar.warnings}</strong>
          </div>

          <div style={{ display: 'grid', gap: '8px' }}>
            <span style={{ color: appTheme.colors.textMuted, fontSize: '13px' }}>Incidencias</span>
            <strong style={{ fontSize: '24px' }}>{workspace.summary_bar.incidents}</strong>
          </div>

          <div style={{ display: 'grid', gap: '8px' }}>
            <span style={{ color: appTheme.colors.textMuted, fontSize: '13px' }}>Updated at</span>
            <span style={{ color: appTheme.colors.textSecondary }}>{formatTimestamp(workspace.summary_bar.updated_at)}</span>
          </div>
        </div>
      </SurfaceCard>

      <section
        style={{
          marginTop: '14px',
          display: 'grid',
          gap: '14px',
          gridTemplateColumns: 'repeat(auto-fit, minmax(240px, 1fr))',
        }}
      >
        {workspace.modules.map((module) => (
          <SurfaceCard key={module.module_id} title={module.label} elevated>
            <div style={{ display: 'grid', gap: '10px' }}>
              <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap', alignItems: 'center' }}>
                <StatusBadge status={mapHealthcheckStatusToBadgeStatus(module.status)} />
                <StatusBadge status={mapHealthcheckSeverityToBadgeStatus(module.severity)} />
              </div>
              <span style={{ color: appTheme.colors.textSecondary, fontSize: '13px' }}>
                Estado: <strong>{getHealthcheckStatusLabel(module.status)}</strong>
              </span>
              <span style={{ color: appTheme.colors.textSecondary, fontSize: '13px' }}>
                Severidad: <strong>{getHealthcheckSeverityLabel(module.severity)}</strong>
              </span>
              <span style={{ color: appTheme.colors.textMuted, fontSize: '13px' }}>
                Última señal: {formatTimestamp(module.updated_at)}
              </span>
              <p style={{ margin: 0, color: appTheme.colors.textSecondary }}>{module.summary}</p>
            </div>
          </SurfaceCard>
        ))}
      </section>

      <section
        style={{
          marginTop: '14px',
          display: 'grid',
          gap: '14px',
          gridTemplateColumns: 'minmax(0, 1.3fr) minmax(280px, 0.7fr)',
          alignItems: 'start',
        }}
      >
        <SurfaceCard title="Eventos recientes" elevated>
          <div style={{ display: 'grid', gap: '10px' }}>
            {workspace.events.map((event) => (
              <article
                key={event.event_id}
                style={{
                  border: `1px solid ${appTheme.colors.borderSubtle}`,
                  borderRadius: appTheme.radius.md,
                  padding: '12px',
                  display: 'grid',
                  gap: '8px',
                }}
              >
                <div style={{ display: 'flex', justifyContent: 'space-between', gap: '10px', flexWrap: 'wrap' }}>
                  <strong>{event.source}</strong>
                  <StatusBadge status={mapHealthcheckStatusToBadgeStatus(event.status)} />
                </div>
                <span style={{ color: appTheme.colors.textMuted, fontSize: '12px' }}>{formatTimestamp(event.timestamp)}</span>
                <p style={{ margin: 0, color: appTheme.colors.textSecondary }}>{event.detail}</p>
              </article>
            ))}
          </div>
        </SurfaceCard>

        <div style={{ display: 'grid', gap: '14px' }}>
          <SurfaceCard title="Señales del sistema" elevated>
            <div style={{ display: 'grid', gap: '10px' }}>
              {workspace.signals.map((check) => (
                <div
                  key={check.check_id}
                  style={{
                    border: `1px solid ${appTheme.colors.borderSubtle}`,
                    borderRadius: '12px',
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
                    <StatusBadge status={mapHealthcheckStatusToBadgeStatus(check.status)} />
                    <StatusBadge status={mapHealthcheckSeverityToBadgeStatus(check.severity)} />
                  </div>
                  <span style={{ color: appTheme.colors.textSecondary, fontSize: '13px' }}>{check.warning_text}</span>
                  <span style={{ color: appTheme.colors.textMuted, fontSize: '12px' }}>
                    {check.source_label} · {check.freshness.label}
                  </span>
                </div>
              ))}
            </div>
          </SurfaceCard>

          <SurfaceCard title="Principios de seguridad" elevated>
            <div style={{ display: 'flex', flexWrap: 'wrap', gap: '8px' }}>
              {workspace.principles.map((principle) => (
                <span
                  key={principle}
                  style={{
                    border: `1px solid ${appTheme.colors.borderSubtle}`,
                    borderRadius: '999px',
                    padding: '6px 12px',
                    background: appTheme.colors.bgSurface1,
                    color: appTheme.colors.textSecondary,
                    fontSize: '12px',
                    fontWeight: 600,
                  }}
                >
                  {principle}
                </span>
              ))}
            </div>
          </SurfaceCard>
        </div>
      </section>
    </>
  )
}

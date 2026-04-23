import {
  getHealthcheckSeverityLabel,
  getHealthcheckStatusLabel,
  mapHealthcheckSeverityToBadgeStatus,
  mapHealthcheckStatusToBadgeStatus,
} from '@/modules/healthcheck/view-models/healthcheck-mappers'
import { healthcheckWorkspaceFixture } from '@/modules/healthcheck/view-models/healthcheck-summary.fixture'
import { PageHeader } from '@/shared/ui/app-shell/PageHeader'
import { SurfaceCard } from '@/shared/ui/cards/SurfaceCard'
import { StatePanel } from '@/shared/ui/state/StatePanel'
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
  const healthSummaryNotice =
    workspace.summary_bar.incidents > 0
      ? {
          status: 'incidencia' as const,
          title: 'Hay incidencias abiertas en el perímetro',
          description: 'El resumen general ya no se limita a métricas: la página hace explícito que existen checks degradados que requieren atención prioritaria antes de considerar el sistema estable.',
          detail: `${workspace.summary_bar.incidents} incidencia(s) · ${workspace.summary_bar.warnings} warning(s) activas`,
        }
      : workspace.summary_bar.warnings > 0 || workspace.summary_bar.overall_status === 'stale'
        ? {
            status: workspace.summary_bar.overall_status === 'stale' ? ('stale' as const) : ('revision' as const),
            title: 'Hay advertencias operativas pendientes',
            description: 'La superficie sigue siendo utilizable, pero conviene revisar los módulos marcados antes de cerrar la ventana de observación.',
            detail: `${workspace.summary_bar.warnings} warning(s) activas`,
          }
        : null

  return (
    <>
      <PageHeader
        eyebrow="Healthcheck"
        title="Salud del sistema"
        subtitle="Resumen operativo del perímetro: estado general, módulos, eventos recientes y señales saneadas sin exponer metadata sensible del host."
      />

      <SurfaceCard title="Health summary bar" elevated>
        <div style={{ display: 'grid', gap: '14px' }}>
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

          {healthSummaryNotice ? (
            <StatePanel
              status={healthSummaryNotice.status}
              title={healthSummaryNotice.title}
              description={healthSummaryNotice.description}
              detail={healthSummaryNotice.detail}
              eyebrow="Estado agregado"
            />
          ) : null}
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
          {workspace.events.length > 0 ? (
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
          ) : (
            <StatePanel
              status="sin-datos"
              title="Sin eventos recientes"
              description="No hay eventos saneados visibles para esta ventana de observación. La ausencia de eventos debe expresarse explícitamente en vez de dejar un panel vacío."
              eyebrow="Estado vacío"
            />
          )}
        </SurfaceCard>

        <div style={{ display: 'grid', gap: '14px' }}>
          <SurfaceCard title="Señales del sistema" elevated>
            {workspace.signals.length > 0 ? (
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
            ) : (
              <StatePanel
                status="sin-datos"
                title="Sin señales visibles"
                description="Todavía no hay checks saneados para este bloque. El módulo debe conservar el marco de lectura sin fingir datos inexistentes."
                eyebrow="Estado vacío"
              />
            )}
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

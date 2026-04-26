import {
  getHealthcheckSeverityLabel,
  getHealthcheckStatusLabel,
  getHealthcheckTriageRank,
  mapHealthcheckSeverityToBadgeStatus,
  mapHealthcheckStatusToBadgeStatus,
  shouldRenderSeparateSeverityBadge,
} from '@/modules/healthcheck/view-models/healthcheck-mappers'
import { fetchHealthcheckWorkspace, HealthcheckApiError } from '@/modules/healthcheck/api/healthcheck-http'
import {
  healthcheckWorkspaceFixture,
  type HealthcheckModuleCard,
  type HealthcheckSummaryItem,
  type HealthcheckWorkspace,
} from '@/modules/healthcheck/view-models/healthcheck-summary.fixture'
import type { AppStatus } from '@/shared/theme/tokens'
import { PageHeader } from '@/shared/ui/app-shell/PageHeader'
import { SurfaceCard } from '@/shared/ui/cards/SurfaceCard'
import { StatePanel } from '@/shared/ui/state/StatePanel'
import { SourceStatePills } from '@/shared/ui/status/SourceStatePills'
import { StatusBadge } from '@/shared/ui/status/StatusBadge'
import { appTheme } from '@/shared/theme/tokens'

type HealthcheckPageNotice = {
  status: AppStatus
  title: string
  description: string
  detail?: string
}

export const dynamic = 'force-dynamic'

async function getInitialHealthcheckData(): Promise<{ workspace: HealthcheckWorkspace; apiNotice: HealthcheckPageNotice | null }> {
  try {
    const response = await fetchHealthcheckWorkspace()

    if (response.status !== 'ready') {
      return {
        workspace: healthcheckWorkspaceFixture,
        apiNotice: {
          status: 'revision',
          title: 'Healthcheck en modo fallback local',
          description: 'La API respondió sin catálogo disponible. Se muestra un snapshot local saneado para conservar la lectura, pero no representa señales en tiempo real.',
          detail: `Estado técnico: ${response.status}`,
        },
      }
    }

    return { workspace: response.data as HealthcheckWorkspace, apiNotice: null }
  } catch (error) {
    const apiError = error instanceof HealthcheckApiError ? error : null

    return {
      workspace: healthcheckWorkspaceFixture,
      apiNotice: {
        status: apiError?.code === 'not_configured' ? 'revision' : 'incidencia',
        title:
          apiError?.code === 'not_configured'
            ? 'Healthcheck en modo fallback local'
            : apiError?.code === 'invalid_config'
              ? 'Configuración server-only de Healthcheck inválida'
              : 'API Healthcheck no disponible',
        description:
          apiError?.code === 'not_configured'
            ? 'Mostrando snapshot local saneado. Estos checks mantienen la navegación, pero no son lectura real ni tiempo real.'
            : 'La página mantiene fallback saneado local. No se muestran comandos, logs crudos ni detalles internos del host.',
        detail: apiError?.code ? `Estado técnico: ${apiError.code}` : undefined,
      },
    }
  }
}


function getHealthcheckAccent(status: HealthcheckModuleCard['status'], severity: HealthcheckModuleCard['severity']) {
  if (status === 'fail' || severity === 'critical' || severity === 'high') {
    return 'danger' as const
  }

  if (status === 'warn' || severity === 'medium') {
    return 'warning' as const
  }

  if (status === 'stale') {
    return 'gold' as const
  }

  return 'sky' as const
}

function getHealthcheckCardTone(status: HealthcheckModuleCard['status'], severity: HealthcheckModuleCard['severity']) {
  if (status === 'pass' && severity === 'low') {
    return {
      borderColor: 'rgba(255,255,255,0.08)',
      background: 'rgba(255,255,255,0.015)',
      opacity: 0.86,
    }
  }

  if (status === 'fail' || severity === 'critical' || severity === 'high') {
    return {
      borderColor: 'rgba(201,65,40,0.55)',
      background: 'rgba(201,65,40,0.08)',
      opacity: 1,
    }
  }

  return {
    borderColor: appTheme.colors.borderSubtle,
    background: appTheme.colors.bgSurface1,
    opacity: 1,
  }
}

function sortByHealthcheckTriage<T extends { status: HealthcheckModuleCard['status']; severity: HealthcheckModuleCard['severity']; updated_at?: string; freshness?: { updated_at: string } }>(items: T[]) {
  return [...items].sort((left, right) => {
    const rankDelta = getHealthcheckTriageRank(right.status, right.severity) - getHealthcheckTriageRank(left.status, left.severity)

    if (rankDelta !== 0) {
      return rankDelta
    }

    const leftDate = new Date(left.updated_at ?? left.freshness?.updated_at ?? '').getTime()
    const rightDate = new Date(right.updated_at ?? right.freshness?.updated_at ?? '').getTime()

    return (Number.isNaN(rightDate) ? 0 : rightDate) - (Number.isNaN(leftDate) ? 0 : leftDate)
  })
}

function getPriorityCopy(module: HealthcheckModuleCard | null) {
  if (!module) {
    return null
  }

  if (module.status === 'fail' || module.severity === 'critical' || module.severity === 'high') {
    return {
      status: 'incidencia' as const,
      title: `Prioridad actual: ${module.label}`,
      description: module.summary,
      detail: `${getHealthcheckStatusLabel(module.status)} · Severidad ${getHealthcheckSeverityLabel(module.severity)} · ${formatTimestamp(module.updated_at)}`,
    }
  }

  if (module.status === 'warn' || module.status === 'stale' || module.severity === 'medium') {
    return {
      status: module.status === 'stale' ? ('stale' as const) : ('revision' as const),
      title: `Acción requerida: revisar ${module.label}`,
      description: module.summary,
      detail: `${getHealthcheckStatusLabel(module.status)} · Severidad ${getHealthcheckSeverityLabel(module.severity)} · ${formatTimestamp(module.updated_at)}`,
    }
  }

  return null
}

function HealthcheckStatusBadges({ status, severity }: Pick<HealthcheckModuleCard | HealthcheckSummaryItem, 'status' | 'severity'>) {
  const statusBadge = mapHealthcheckStatusToBadgeStatus(status)
  const severityBadge = mapHealthcheckSeverityToBadgeStatus(severity)

  return (
    <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap', alignItems: 'center' }}>
      <StatusBadge status={statusBadge} />
      {shouldRenderSeparateSeverityBadge(status, severity) ? <StatusBadge status={severityBadge} /> : null}
      <span style={{ color: appTheme.colors.textMuted, fontSize: '12px', fontWeight: 700 }}>
        Severidad {getHealthcheckSeverityLabel(severity)}
      </span>
    </div>
  )
}

function formatTimestamp(value: string | null) {
  if (!value) {
    return 'Sin actualización'
  }

  const date = new Date(value)

  if (Number.isNaN(date.getTime())) {
    return value
  }

  return new Intl.DateTimeFormat('es-ES', {
    dateStyle: 'short',
    timeStyle: 'short',
  }).format(date)
}

export default async function HealthcheckPage() {
  const { workspace, apiNotice } = await getInitialHealthcheckData()
  const sortedModules = sortByHealthcheckTriage(workspace.modules)
  const sortedSignals = sortByHealthcheckTriage(workspace.signals)
  const priorityNotice = getPriorityCopy(sortedModules[0] ?? null)
  const healthSummaryNotice =
    workspace.summary_bar.incidents > 0
      ? {
          status: 'incidencia' as const,
          title: 'Hay incidencias abiertas en el perímetro',
          description: 'El resumen general ya no se limita a métricas: la página hace explícito que existen checks degradados que requieren atención prioritaria antes de considerar el sistema estable.',
          detail: `${workspace.summary_bar.incidents} incidencia(s) · ${workspace.summary_bar.warnings} advertencia(s) activas`,
        }
      : workspace.summary_bar.warnings > 0 || workspace.summary_bar.overall_status === 'stale'
        ? {
            status: workspace.summary_bar.overall_status === 'stale' ? ('stale' as const) : ('revision' as const),
            title: 'Hay advertencias operativas pendientes',
            description: 'La superficie sigue siendo utilizable, pero conviene revisar los módulos marcados antes de cerrar la ventana de observación.',
            detail: `${workspace.summary_bar.warnings} advertencia(s) activas`,
          }
        : null

  return (
    <>
      <PageHeader
        eyebrow="Healthcheck"
        title="Salud del sistema"
        subtitle="Resumen operativo del perímetro: estado general, módulos, eventos recientes y señales saneadas sin exponer metadata sensible del host."
        mugiwaraSlug="chopper"
        detailPills={['Perímetro', 'Señales saneadas', 'Respuesta priorizada']}
      />

      {apiNotice ? (
        <StatePanel
          status={apiNotice.status}
          title={apiNotice.title}
          description={apiNotice.description}
          detail={apiNotice.detail}
          eyebrow="Estado de fuente"
        >
          <SourceStatePills
            items={[
              { label: 'Modo fallback local', tone: 'fallback' },
              { label: 'Snapshot saneado', tone: 'snapshot' },
              { label: 'No tiempo real', tone: 'not-realtime' },
            ]}
          />
        </StatePanel>
      ) : null}

      <SurfaceCard title="Resumen de salud" elevated eyebrow="Puesto médico" accent="danger">
        <div style={{ display: 'grid', gap: '14px' }}>
          <div className="layout-grid layout-grid--cards-180" style={{ gap: '12px' }}>
            <div style={{ display: 'grid', gap: '8px' }}>
              <span style={{ color: appTheme.colors.textMuted, fontSize: '13px' }}>Estado general</span>
              <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap', alignItems: 'center' }}>
                <StatusBadge status={mapHealthcheckStatusToBadgeStatus(workspace.summary_bar.overall_status)} />
                <span style={{ color: appTheme.colors.textSecondary }}>{getHealthcheckStatusLabel(workspace.summary_bar.overall_status)}</span>
              </div>
            </div>

            <div style={{ display: 'grid', gap: '8px' }}>
              <span style={{ color: appTheme.colors.textMuted, fontSize: '13px' }}>Comprobaciones</span>
              <strong style={{ fontSize: '24px' }}>{workspace.summary_bar.checks_total}</strong>
            </div>

            <div style={{ display: 'grid', gap: '8px' }}>
              <span style={{ color: appTheme.colors.textMuted, fontSize: '13px' }}>Advertencias</span>
              <strong style={{ fontSize: '24px' }}>{workspace.summary_bar.warnings}</strong>
            </div>

            <div style={{ display: 'grid', gap: '8px' }}>
              <span style={{ color: appTheme.colors.textMuted, fontSize: '13px' }}>Incidencias</span>
              <strong style={{ fontSize: '24px' }}>{workspace.summary_bar.incidents}</strong>
            </div>

            <div style={{ display: 'grid', gap: '8px' }}>
              <span style={{ color: appTheme.colors.textMuted, fontSize: '13px' }}>Actualizado</span>
              <span style={{ color: appTheme.colors.textSecondary }}>{formatTimestamp(workspace.summary_bar.updated_at)}</span>
            </div>
          </div>

          {priorityNotice ? (
            <StatePanel
              status={priorityNotice.status}
              title={priorityNotice.title}
              description={priorityNotice.description}
              detail={priorityNotice.detail}
              eyebrow="Acción requerida"
            />
          ) : healthSummaryNotice ? (
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

      <section className="section-block layout-grid layout-grid--cards-240" aria-label="Checks priorizados">
        {sortedModules.map((module, index) => {
          const tone = getHealthcheckCardTone(module.status, module.severity)

          return (
            <div
              key={module.module_id}
              style={{
                border: `1px solid ${tone.borderColor}`,
                borderRadius: appTheme.radius.lg,
                background: tone.background,
                opacity: tone.opacity,
              }}
            >
              <SurfaceCard title={module.label} elevated={index < 3} eyebrow={index === 0 ? 'Prioridad actual' : 'Check'} accent={getHealthcheckAccent(module.status, module.severity)}>
                <div style={{ display: 'grid', gap: '10px' }}>
                  <HealthcheckStatusBadges status={module.status} severity={module.severity} />
                  <span style={{ color: appTheme.colors.textSecondary, fontSize: '13px' }}>
                    Estado: <strong>{getHealthcheckStatusLabel(module.status)}</strong>
                  </span>
                  <span style={{ color: appTheme.colors.textMuted, fontSize: '13px' }}>
                    Última señal: {formatTimestamp(module.updated_at)}
                  </span>
                  <p style={{ margin: 0, color: module.status === 'pass' && module.severity === 'low' ? appTheme.colors.textMuted : appTheme.colors.textSecondary }}>{module.summary}</p>
                </div>
              </SurfaceCard>
            </div>
          )
        })}
      </section>

      <section className="section-block layout-grid layout-grid--content-aside">
        <SurfaceCard title="Eventos recientes" elevated eyebrow="Bitácora" accent="gold">
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
          <SurfaceCard title="Señales del sistema" elevated eyebrow="Diagnóstico" accent="sky">
            {workspace.signals.length > 0 ? (
              <div style={{ display: 'grid', gap: '10px' }}>
                {sortedSignals.map((check) => (
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
                    <HealthcheckStatusBadges status={check.status} severity={check.severity} />
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

          <SurfaceCard title="Principios de seguridad" elevated eyebrow="Doctrina" accent="gold">
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

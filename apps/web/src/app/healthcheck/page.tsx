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
  type HealthcheckOperationalCheck,
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
          description: 'La API respondió sin catálogo operativo disponible. Se muestra un snapshot local saneado para conservar la lectura, pero no representa señales en tiempo real.',
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
      opacity: 0.9,
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

function sortByHealthcheckTriage<T extends { status: HealthcheckModuleCard['status']; severity: HealthcheckModuleCard['severity']; updated_at?: string | null; freshness?: { updated_at: string | null } }>(items: T[]): T[] {
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

function HealthcheckStatusBadges({ status, severity, isSnapshotMode = false }: Pick<HealthcheckOperationalCheck, 'status' | 'severity'> & { isSnapshotMode?: boolean }) {
  const statusBadge = mapHealthcheckStatusToBadgeStatus(status)
  const severityBadge = mapHealthcheckSeverityToBadgeStatus(severity)

  return (
    <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap', alignItems: 'center' }}>
      <StatusBadge
        status={statusBadge}
        label={isSnapshotMode && statusBadge === 'operativo' ? 'Operativo en último corte' : undefined}
      />
      {shouldRenderSeparateSeverityBadge(status, severity) ? <StatusBadge status={severityBadge} /> : null}
      <span style={{ color: appTheme.colors.textMuted, fontSize: '12px', fontWeight: 700 }}>
        Severidad {getHealthcheckSeverityLabel(severity)}
      </span>
    </div>
  )
}

function getOperationalHeadline(workspace: HealthcheckWorkspace, checks: HealthcheckOperationalCheck[]) {
  const degraded = checks.filter((check) => check.status !== 'pass')
  const isHealthy = workspace.summary_bar.incidents === 0 && workspace.summary_bar.warnings === 0

  if (isHealthy || degraded.length === 0) {
    return {
      status: 'operativo' as const,
      title: 'Perímetro operativo sin degradación activa',
      description: 'Los seis checks saneados están en estado operativo. La lectura es live por request cuando la API está disponible.',
      detail: `${workspace.summary_bar.checks_total} checks operativos`,
    }
  }

  const incidents = degraded.filter((check) => check.status === 'fail').length
  return {
    status: incidents > 0 ? ('incidencia' as const) : ('revision' as const),
    title: incidents > 0 ? 'Incidencias operativas detectadas' : 'Revisión operativa pendiente',
    description: `${degraded.length} de ${checks.length} checks requieren atención. Revisa las cards saneadas para ver contadores, fallos y enlaces seguros disponibles.`,
    detail: `${incidents} incidencias · ${Math.max(degraded.length - incidents, 0)} advertencias/revisiones`,
  }
}

export default async function HealthcheckPage() {
  const { workspace, apiNotice } = await getInitialHealthcheckData()
  const isSnapshotMode = Boolean(apiNotice)
  const operationalChecks = sortByHealthcheckTriage(workspace.operational_checks ?? workspace.modules.map((module) => ({
    check_id: module.module_id,
    label: module.label,
    status: module.status,
    severity: module.severity,
    updated_at: module.updated_at,
    summary: module.summary,
    freshness: { updated_at: module.updated_at, label: formatTimestamp(module.updated_at), state: module.status === 'stale' ? 'stale' : 'fresh' },
    display_text: module.summary,
  })))
  const headline = getOperationalHeadline(workspace, operationalChecks)

  return (
    <>
      <PageHeader
        eyebrow="Healthcheck"
        title="Panel operativo"
        subtitle="Seis checks vivos y saneados para leer el estado actual de Mugiwara sin historial, logs ni detalles internos del host."
        detailPills={['Live por request', '6 checks', 'Sin datos sensibles']}
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

      <SurfaceCard title="Estado operativo actual" elevated eyebrow="Lectura live" accent={headline.status === 'incidencia' ? 'danger' : headline.status === 'revision' ? 'warning' : 'sky'}>
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
              <span style={{ color: appTheme.colors.textMuted, fontSize: '13px' }}>Checks</span>
              <strong style={{ fontSize: '24px' }}>{operationalChecks.length}</strong>
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
              <span style={{ color: appTheme.colors.textMuted, fontSize: '13px' }}>{isSnapshotMode ? 'Corte del snapshot' : 'Actualizado'}</span>
              <span style={{ color: appTheme.colors.textSecondary }}>{formatTimestamp(workspace.summary_bar.updated_at)}</span>
            </div>
          </div>

          <StatePanel
            status={headline.status}
            title={headline.title}
            description={headline.description}
            detail={headline.detail}
            eyebrow="Resumen operativo"
            ariaRole={headline.status === 'incidencia' ? 'alert' : 'region'}
            ariaLabel="Resumen operativo actual de Healthcheck"
          />
        </div>
      </SurfaceCard>

      <section className="section-block layout-grid layout-grid--cards-240" aria-label="Checks operativos">
        {operationalChecks.map((check) => {
          const tone = getHealthcheckCardTone(check.status, check.severity)
          return (
            <div
              key={check.check_id}
              style={{
                border: `1px solid ${tone.borderColor}`,
                borderRadius: appTheme.radius.lg,
                background: tone.background,
                opacity: tone.opacity,
              }}
            >
              <SurfaceCard title={check.label} elevated eyebrow="Check operativo" accent={getHealthcheckAccent(check.status, check.severity)}>
                <div style={{ display: 'grid', gap: '10px' }}>
                  <HealthcheckStatusBadges status={check.status} severity={check.severity} isSnapshotMode={isSnapshotMode} />
                  {check.metric_label && check.metric_value ? (
                    <div style={{ display: 'grid', gap: '4px' }}>
                      <span style={{ color: appTheme.colors.textMuted, fontSize: '12px', fontWeight: 700 }}>{check.metric_label}</span>
                      <strong style={{ color: appTheme.colors.textPrimary, fontSize: '22px' }}>{check.metric_value}</strong>
                    </div>
                  ) : null}
                  <span style={{ color: appTheme.colors.textSecondary, fontSize: '13px' }}>
                    Estado: <strong>{getHealthcheckStatusLabel(check.status)}</strong>
                  </span>
                  <span style={{ color: appTheme.colors.textSecondary, fontSize: '13px', fontWeight: 600 }}>
                    Última señal: {formatTimestamp(check.updated_at)} · {check.freshness.label}
                  </span>
                  <p style={{ margin: 0, color: check.status === 'pass' && check.severity === 'low' ? appTheme.colors.textMuted : appTheme.colors.textSecondary }}>{check.display_text ?? check.summary}</p>
                  {check.failing_items?.length ? (
                    <div style={{ display: 'grid', gap: '6px' }}>
                      <span style={{ color: appTheme.colors.textMuted, fontSize: '12px', fontWeight: 700 }}>Fallo en</span>
                      <div style={{ display: 'flex', gap: '6px', flexWrap: 'wrap' }}>
                        {check.failing_items.map((item) => (
                          <StatusBadge key={item.id} status={mapHealthcheckStatusToBadgeStatus(item.status)} label={item.label} />
                        ))}
                      </div>
                    </div>
                  ) : null}
                  {check.items?.length ? (
                    <div style={{ display: 'flex', gap: '6px', flexWrap: 'wrap' }}>
                      {check.items.map((item) => (
                        <StatusBadge key={item.id} status={mapHealthcheckStatusToBadgeStatus(item.status)} label={item.label} />
                      ))}
                    </div>
                  ) : null}
                  {check.facts?.length ? (
                    <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap' }}>
                      {check.facts.map((fact) => (
                        <span key={`${fact.label}-${fact.value}`} style={{ color: appTheme.colors.textSecondary, fontSize: '12px', fontWeight: 700 }}>
                          {fact.label}: {fact.value}
                        </span>
                      ))}
                    </div>
                  ) : null}
                  {check.links?.length ? (
                    <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap' }}>
                      {check.links.map((link) => (
                        <a key={link.href} href={link.href} rel="noreferrer" target="_blank" style={{ color: appTheme.colors.brandSky500, fontSize: '13px', fontWeight: 700 }}>
                          {link.label}
                        </a>
                      ))}
                    </div>
                  ) : null}
                </div>
              </SurfaceCard>
            </div>
          )
        })}
      </section>
    </>
  )
}

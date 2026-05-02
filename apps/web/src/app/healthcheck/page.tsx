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
  const priority = checks[0]
  const isHealthy = workspace.summary_bar.incidents === 0 && workspace.summary_bar.warnings === 0

  if (!priority || isHealthy) {
    return {
      status: 'operativo' as const,
      title: 'Perímetro operativo sin degradación activa',
      description: 'Los seis checks saneados están en estado operativo. La lectura es live por request cuando la API está disponible.',
      detail: `${workspace.summary_bar.checks_total} checks operativos`,
    }
  }

  return {
    status: priority.status === 'fail' ? ('incidencia' as const) : priority.status === 'stale' ? ('stale' as const) : ('revision' as const),
    title: `Prioridad actual: ${priority.label}`,
    description: priority.summary,
    detail: `${getHealthcheckStatusLabel(priority.status)} · Severidad ${getHealthcheckSeverityLabel(priority.severity)} · ${priority.freshness.label}`,
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
            eyebrow="Prioridad actual"
            ariaRole={headline.status === 'incidencia' ? 'alert' : 'region'}
            ariaLabel="Prioridad operativa actual de Healthcheck"
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
                  <span style={{ color: appTheme.colors.textSecondary, fontSize: '13px' }}>
                    Estado: <strong>{getHealthcheckStatusLabel(check.status)}</strong>
                  </span>
                  <span style={{ color: appTheme.colors.textSecondary, fontSize: '13px', fontWeight: 600 }}>
                    Última señal: {formatTimestamp(check.updated_at)} · {check.freshness.label}
                  </span>
                  <p style={{ margin: 0, color: check.status === 'pass' && check.severity === 'low' ? appTheme.colors.textMuted : appTheme.colors.textSecondary }}>{check.summary}</p>
                </div>
              </SurfaceCard>
            </div>
          )
        })}
      </section>
    </>
  )
}

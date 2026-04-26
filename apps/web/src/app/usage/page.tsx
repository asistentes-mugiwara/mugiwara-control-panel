import type { ResourceStatus } from '@contracts/resource'
import type { UsageCurrent, UsageWindowStatus } from '@contracts/read-models'

import { fetchUsageCurrent, UsageApiError } from '@/modules/usage/api/usage-http'
import { usageCurrentFixture } from '@/modules/usage/view-models/usage-current.fixture'
import { PageHeader } from '@/shared/ui/app-shell/PageHeader'
import { SurfaceCard } from '@/shared/ui/cards/SurfaceCard'
import { StatePanel } from '@/shared/ui/state/StatePanel'
import { SourceStatePills } from '@/shared/ui/status/SourceStatePills'
import { StatusBadge } from '@/shared/ui/status/StatusBadge'
import { appTheme, statusColorMap, type AppStatus } from '@/shared/theme/tokens'

export const dynamic = 'force-dynamic'

type UsageNotice = {
  status: AppStatus
  title: string
  description: string
  detail?: string
  sourceStateItems: Array<{ label: string; tone: 'connected' | 'fallback' | 'snapshot' | 'not-realtime' | 'not-configured' | 'degraded' }>
}

type UsagePageData = {
  usage: UsageCurrent
  resourceStatus: ResourceStatus | 'fallback'
  notice: UsageNotice | null
  isSnapshotMode: boolean
}

const windowStatusMap: Record<UsageWindowStatus, { appStatus: AppStatus; label: string; accent: 'sky' | 'gold' | 'success' | 'warning' | 'danger' }> = {
  normal: { appStatus: 'operativo', label: 'Normal', accent: 'success' },
  high: { appStatus: 'revision', label: 'Alto', accent: 'warning' },
  critical: { appStatus: 'incidencia', label: 'Crítico', accent: 'danger' },
  limit_reached: { appStatus: 'incidencia', label: 'Límite alcanzado', accent: 'danger' },
  unknown: { appStatus: 'sin-datos', label: 'Sin datos', accent: 'sky' },
}

const recommendationStatusMap: Record<UsageCurrent['recommendation']['state'], AppStatus> = {
  normal: 'operativo',
  alto: 'revision',
  critico: 'incidencia',
  limite_alcanzado: 'incidencia',
  datos_antiguos: 'stale',
  sin_datos: 'sin-datos',
}

async function getInitialUsageData(): Promise<UsagePageData> {
  try {
    const response = await fetchUsageCurrent()
    const usage = response.data

    if (response.status !== 'ready') {
      return {
        usage,
        resourceStatus: response.status,
        isSnapshotMode: response.status === 'stale',
        notice: noticeFromResourceStatus(response.status),
      }
    }

    return {
      usage,
      resourceStatus: response.status,
      notice: null,
      isSnapshotMode: false,
    }
  } catch (error) {
    const apiError = error instanceof UsageApiError ? error : null

    return {
      usage: usageCurrentFixture,
      resourceStatus: 'fallback',
      isSnapshotMode: true,
      notice: {
        status: apiError?.code === 'not_configured' ? 'revision' : 'incidencia',
        title:
          apiError?.code === 'not_configured'
            ? 'Usage en modo fallback local'
            : apiError?.code === 'invalid_config'
              ? 'Configuración server-only de Usage inválida'
              : 'API Usage no disponible',
        description:
          apiError?.code === 'not_configured'
            ? 'Mostrando snapshot local saneado. Estos datos sostienen la navegación, pero no representan lectura real ni tiempo real.'
            : 'La página mantiene fallback saneado local. No se muestran detalles internos del backend ni salidas operativas crudas.',
        detail: apiError?.code ? `Estado técnico: ${apiError.code}` : undefined,
        sourceStateItems: [
          { label: 'Modo fallback local', tone: 'fallback' },
          { label: 'Snapshot saneado', tone: 'snapshot' },
          { label: 'No tiempo real', tone: 'not-realtime' },
        ],
      },
    }
  }
}

function noticeFromResourceStatus(status: ResourceStatus): UsageNotice | null {
  if (status === 'ready') {
    return null
  }

  if (status === 'stale') {
    return {
      status: 'stale',
      title: 'Usage con datos antiguos',
      description: 'El snapshot existe, pero no es reciente. La lectura sigue siendo saneada y read-only; revisa el timer si el estado persiste.',
      detail: 'Estado técnico: stale',
      sourceStateItems: [
        { label: 'API real conectada', tone: 'connected' },
        { label: 'Snapshot saneado', tone: 'snapshot' },
        { label: 'Datos antiguos', tone: 'not-realtime' },
      ],
    }
  }

  if (status === 'not_configured') {
    return {
      status: 'revision',
      title: 'Usage sin fuente configurada',
      description: 'Aún no hay snapshot disponible para Usage. La página se mantiene en modo solo lectura y sin detalles internos del host.',
      detail: 'Estado técnico: not_configured',
      sourceStateItems: [
        { label: 'Fuente no configurada', tone: 'not-configured' },
        { label: 'No tiempo real', tone: 'not-realtime' },
      ],
    }
  }

  return {
    status: 'revision',
    title: 'Usage degradado',
    description: 'La API respondió sin lectura lista. Se muestra el estado degradado sin filtrar detalles internos.',
    detail: `Estado técnico: ${status}`,
    sourceStateItems: [
      { label: 'Error/degradado', tone: 'degraded' },
      { label: 'No tiempo real', tone: 'not-realtime' },
    ],
  }
}

function formatTimestamp(value: string | null) {
  if (!value) {
    return 'Fecha no disponible'
  }

  const date = new Date(value)
  if (Number.isNaN(date.getTime())) {
    return 'Fecha no disponible'
  }

  return new Intl.DateTimeFormat('es-ES', {
    dateStyle: 'medium',
    timeStyle: 'short',
  }).format(date)
}

function formatPercent(value: number | null) {
  if (value === null) {
    return '—'
  }

  return `${Math.round(value)}%`
}

function formatResetAfter(seconds: number | null) {
  if (seconds === null) {
    return 'Tiempo restante no disponible'
  }

  if (seconds <= 0) {
    return 'Reset pendiente de refresco'
  }

  const hours = Math.floor(seconds / 3600)
  const minutes = Math.floor((seconds % 3600) / 60)

  if (hours > 0) {
    return `${hours} h ${minutes} min restantes`
  }

  return `${minutes} min restantes`
}

function formatBoolean(value: boolean | null) {
  if (value === null) {
    return 'No disponible'
  }

  return value ? 'Sí' : 'No'
}

function windowStatusToBadge(status: UsageWindowStatus) {
  return windowStatusMap[status]
}

function UsageProgressBar({ value, status }: { value: number | null; status: UsageWindowStatus }) {
  const width = value === null ? 0 : Math.max(0, Math.min(100, value))
  const badge = windowStatusToBadge(status)
  const color = statusColorMap[badge.appStatus]

  return (
    <div
      aria-label={`Uso actual ${formatPercent(value)}`}
      role="progressbar"
      aria-valuemin={0}
      aria-valuemax={100}
      aria-valuenow={value ?? undefined}
      style={{
        width: '100%',
        height: '10px',
        borderRadius: '999px',
        background: 'rgba(255,255,255,0.10)',
        overflow: 'hidden',
        margin: '12px 0',
      }}
    >
      <div
        style={{
          width: `${width}%`,
          height: '100%',
          borderRadius: '999px',
          background: color,
        }}
      />
    </div>
  )
}

function WindowCard({
  title,
  window,
  emphasis = false,
}: {
  title: string
  window: UsageCurrent['primary_window'] | UsageCurrent['secondary_cycle']
  emphasis?: boolean
}) {
  const status = windowStatusToBadge(window.status)

  return (
    <SurfaceCard title={title} eyebrow={window.label} accent={emphasis ? 'gold' : status.accent} elevated={emphasis}>
      <p style={{ margin: '0 0 8px', fontSize: emphasis ? '34px' : '30px', fontWeight: 800 }}>{formatPercent(window.used_percent)}</p>
      <UsageProgressBar value={window.used_percent} status={window.status} />
      <div style={{ display: 'grid', gap: '8px', color: appTheme.colors.textSecondary }}>
        <p style={{ margin: 0 }}>Rango: {formatTimestamp(window.started_at)} → {formatTimestamp(window.reset_at)}</p>
        <p style={{ margin: 0 }}>Reset: {formatResetAfter(window.reset_after_seconds)}</p>
      </div>
      <div style={{ marginTop: '12px' }}>
        <StatusBadge status={status.appStatus} label={status.label} />
      </div>
    </SurfaceCard>
  )
}

export default async function UsagePage() {
  const { usage, notice, isSnapshotMode } = await getInitialUsageData()
  const recommendationStatus = recommendationStatusMap[usage.recommendation.state]

  return (
    <>
      <PageHeader
        eyebrow="Uso"
        title="Uso Codex/Hermes"
        subtitle="Cuota Codex, ciclos de reset y actividad local saneada. Primera vista read-only centrada en el snapshot actual."
        mugiwaraSlug="franky"
        detailPills={[
          `Plan: ${usage.plan.type}`,
          `${isSnapshotMode ? 'Corte del snapshot' : 'Última actualización'}: ${formatTimestamp(usage.current_snapshot.captured_at)}`,
          usage.current_snapshot.source_label,
          'Solo lectura',
        ]}
      />

      {notice ? (
        <StatePanel
          status={notice.status}
          title={notice.title}
          description={notice.description}
          detail={notice.detail}
          eyebrow="Estado de fuente"
          ariaRole={notice.status === 'incidencia' ? 'alert' : 'region'}
          ariaLabel="Estado de fuente Usage"
        >
          <SourceStatePills items={notice.sourceStateItems} />
        </StatePanel>
      ) : null}

      <StatePanel
        status="revision"
        title="El ciclo semanal Codex no es calendario lunes-domingo"
        description={usage.methodology.cycle_copy}
        eyebrow="Metodología"
      />

      <section className="layout-grid layout-grid--dashboard-metrics section-block" aria-label="Estado actual de Usage">
        <WindowCard title="Ventana 5h" window={usage.primary_window} />
        <WindowCard title="Ciclo semanal Codex" window={usage.secondary_cycle} emphasis />
        <SurfaceCard title="Plan" eyebrow="Cuenta Codex" accent="sky">
          <dl style={{ margin: 0, display: 'grid', gap: '10px' }}>
            <div>
              <dt style={{ color: appTheme.colors.textMuted, fontSize: '12px', textTransform: 'uppercase', letterSpacing: '0.08em' }}>Tipo</dt>
              <dd style={{ margin: 0, fontSize: '26px', fontWeight: 800 }}>{usage.plan.type}</dd>
            </div>
            <div>
              <dt style={{ color: appTheme.colors.textMuted, fontSize: '12px', textTransform: 'uppercase', letterSpacing: '0.08em' }}>Permitido</dt>
              <dd style={{ margin: 0 }}>{formatBoolean(usage.plan.allowed)}</dd>
            </div>
            <div>
              <dt style={{ color: appTheme.colors.textMuted, fontSize: '12px', textTransform: 'uppercase', letterSpacing: '0.08em' }}>Límite alcanzado</dt>
              <dd style={{ margin: 0 }}>{formatBoolean(usage.plan.limit_reached)}</dd>
            </div>
          </dl>
        </SurfaceCard>
        <SurfaceCard title="Recomendación actual" eyebrow="Prioridad" accent={recommendationStatus === 'incidencia' ? 'danger' : recommendationStatus === 'revision' ? 'warning' : 'success'} elevated>
          <p style={{ margin: '0 0 10px', fontSize: '24px', fontWeight: 800 }}>{usage.recommendation.label}</p>
          <p style={{ margin: 0, color: appTheme.colors.textSecondary, lineHeight: 1.5 }}>{usage.recommendation.message}</p>
          <div style={{ marginTop: '12px' }}>
            <StatusBadge status={recommendationStatus} />
          </div>
        </SurfaceCard>
      </section>

      <section className="section-block layout-grid layout-grid--content-aside">
        <SurfaceCard title="Qué entra en esta vista" eyebrow="Alcance Phase 17.2" accent="gold">
          <ul style={{ margin: 0, paddingLeft: '18px', color: appTheme.colors.textSecondary, lineHeight: 1.6 }}>
            <li>Snapshot actual saneado de Codex usage.</li>
            <li>Ventana 5h y ciclo semanal Codex con rangos calculados por reset.</li>
            <li>Estado de fuente y recomendación operativa sin datos por conversación.</li>
            <li>Calendario, ventanas históricas y actividad Hermes agregada quedan para 17.3/17.4.</li>
          </ul>
        </SurfaceCard>
        <SurfaceCard title="Seguridad de datos" eyebrow="Deny by default" accent="sky">
          <p style={{ marginTop: 0, color: appTheme.colors.textSecondary, lineHeight: 1.6 }}>{usage.methodology.privacy}</p>
          <p style={{ marginBottom: 0, color: appTheme.colors.textSecondary, lineHeight: 1.6 }}>
            Fórmulas: {usage.methodology.primary_window_formula}; {usage.methodology.secondary_cycle_formula}.
          </p>
        </SurfaceCard>
      </section>
    </>
  )
}

import type { ResourceStatus } from '@contracts/resource'
import type { UsageActivityLevel, UsageCalendar, UsageCalendarDayStatus, UsageCurrent, UsageFiveHourWindows, UsageHermesActivity, UsageWindowStatus } from '@contracts/read-models'

import { fetchUsageCalendar, fetchUsageCurrent, fetchUsageFiveHourWindows, fetchUsageHermesActivity, UsageApiError } from '@/modules/usage/api/usage-http'
import { usageCalendarFixture } from '@/modules/usage/view-models/usage-calendar.fixture'
import { usageCurrentFixture } from '@/modules/usage/view-models/usage-current.fixture'
import { usageFiveHourWindowsFixture } from '@/modules/usage/view-models/usage-five-hour-windows.fixture'
import { usageHermesActivityFixture } from '@/modules/usage/view-models/usage-hermes-activity.fixture'
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

type HermesActivityNotice = {
  status: AppStatus
  title: string
  description: string
  detail: string
}

type UsagePageData = {
  usage: UsageCurrent
  calendar: UsageCalendar
  fiveHourWindows: UsageFiveHourWindows
  hermesActivity: UsageHermesActivity
  resourceStatus: ResourceStatus | 'fallback'
  notice: UsageNotice | null
  hermesActivityNotice: HermesActivityNotice | null
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

const calendarStatusMap: Record<UsageCalendarDayStatus, { appStatus: AppStatus; label: string; accent: 'sky' | 'success' | 'warning' | 'danger' }> = {
  normal: { appStatus: 'operativo', label: 'Normal', accent: 'success' },
  high: { appStatus: 'revision', label: 'Alto', accent: 'warning' },
  critical: { appStatus: 'incidencia', label: 'Crítico', accent: 'danger' },
  unknown: { appStatus: 'sin-datos', label: 'Sin datos', accent: 'sky' },
}

const activityLevelMap: Record<UsageActivityLevel, { label: string; appStatus: AppStatus; accent: 'sky' | 'success' | 'warning' | 'danger' }> = {
  low: { label: 'Baja', appStatus: 'operativo', accent: 'success' },
  medium: { label: 'Media', appStatus: 'revision', accent: 'warning' },
  high: { label: 'Alta', appStatus: 'incidencia', accent: 'danger' },
}

async function getInitialUsageData(): Promise<UsagePageData> {
  try {
    const [currentResponse, calendarResponse, fiveHourWindowsResponse, hermesActivityResponse] = await Promise.all([
      fetchUsageCurrent(),
      fetchUsageCalendar('current_cycle'),
      fetchUsageFiveHourWindows(8),
      fetchUsageHermesActivity('7d'),
    ])
    const usage = currentResponse.data
    const calendar = calendarResponse.data
    const fiveHourWindows = fiveHourWindowsResponse.data
    const hermesActivity = hermesActivityResponse.data

    const usageCoreStatus = currentResponse.status !== 'ready'
      ? currentResponse.status
      : calendarResponse.status !== 'ready'
        ? calendarResponse.status
        : fiveHourWindowsResponse.status !== 'ready'
          ? fiveHourWindowsResponse.status
          : 'ready'

    if (usageCoreStatus !== 'ready') {
      return {
        usage,
        calendar,
        fiveHourWindows,
        hermesActivity,
        resourceStatus: usageCoreStatus,
        isSnapshotMode: usageCoreStatus === 'stale',
        notice: noticeFromResourceStatus(usageCoreStatus),
        hermesActivityNotice: noticeFromHermesActivityStatus(hermesActivityResponse.status),
      }
    }

    return {
      usage,
      calendar,
      fiveHourWindows,
      hermesActivity,
      resourceStatus: currentResponse.status,
      notice: null,
      hermesActivityNotice: noticeFromHermesActivityStatus(hermesActivityResponse.status),
      isSnapshotMode: false,
    }
  } catch (error) {
    const apiError = error instanceof UsageApiError ? error : null

    return {
      usage: usageCurrentFixture,
      calendar: usageCalendarFixture,
      fiveHourWindows: usageFiveHourWindowsFixture,
      hermesActivity: usageHermesActivityFixture,
      resourceStatus: 'fallback',
      isSnapshotMode: true,
      hermesActivityNotice: null,
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

function noticeFromHermesActivityStatus(status: ResourceStatus): HermesActivityNotice | null {
  if (status === 'ready') {
    return null
  }

  if (status === 'not_configured') {
    return {
      status: 'revision',
      title: 'Actividad Hermes no configurada',
      description: 'La fuente agregada de actividad Hermes no está disponible. Usage Codex sigue conectado si el snapshot principal, el calendario y las ventanas 5h están listos.',
      detail: 'Estado técnico de hermes-activity: not_configured',
    }
  }

  if (status === 'stale') {
    return {
      status: 'stale',
      title: 'Actividad Hermes con datos antiguos',
      description: 'La correlación Hermes puede estar desactualizada. La lectura Codex principal mantiene su propio estado independiente.',
      detail: 'Estado técnico de hermes-activity: stale',
    }
  }

  return {
    status: 'revision',
    title: 'Actividad Hermes degradada',
    description: 'La sección Hermes no está lista. Se mantiene localizada para no ocultar el estado real de Usage Codex.',
    detail: `Estado técnico de hermes-activity: ${status}`,
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

function formatNaturalDate(value: string) {
  const [year, month, day] = value.split('-').map(Number)
  const date = new Date(Date.UTC(year, month - 1, day))
  if (Number.isNaN(date.getTime())) {
    return value
  }

  return new Intl.DateTimeFormat('es-ES', {
    weekday: 'short',
    day: '2-digit',
    month: 'short',
  }).format(date)
}

function formatDeltaPercent(value: number | null) {
  if (value === null) {
    return '—'
  }

  return `+${Math.round(value)}%`
}

function calendarPartialCopy(reason: UsageCalendar['days'][number]['codex_segment']['reason']) {
  if (reason === 'cycle_started_today') {
    return 'Tramo parcial: inicio del ciclo semanal Codex'
  }

  if (reason === 'cycle_resets_today') {
    return 'Tramo parcial: reset del ciclo semanal Codex'
  }

  return 'Día completo dentro del ciclo semanal Codex'
}

function formatSamples(value: number) {
  if (value === 1) {
    return '1 muestra'
  }

  return `${value} muestras`
}

function formatPeakPrimary(value: number | null) {
  if (value === null) {
    return 'Sin pico 5h'
  }

  return `${Math.round(value)}% pico 5h`
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

function UsageWindowsPanel({ windows, isSnapshotMode }: { windows: UsageFiveHourWindows; isSnapshotMode: boolean }) {
  const items = windows.windows.slice(0, 8)

  return (
    <SurfaceCard title="Ventanas 5h históricas" eyebrow="Últimas ventanas Codex · saneado" accent="sky" elevated>
      <div style={{ display: 'grid', gap: '12px' }}>
        <p style={{ margin: 0, color: appTheme.colors.textSecondary, lineHeight: 1.6 }}>
          Lectura dedicada de ventanas 5h: pico, delta positivo intra-ventana y muestras agregadas desde la SQLite saneada. No incluye actividad Hermes ni atribución causal por perfil.
        </p>
        {isSnapshotMode ? (
          <p style={{ margin: 0, color: appTheme.colors.brandGold400, lineHeight: 1.5 }}>
            Ventanas mostradas desde snapshot/fallback saneado: sirven para validar composición visual, no para decidir consumo real.
          </p>
        ) : null}
        <div className="usage-windows-list" role="list" aria-label="Últimas ventanas 5h de Usage">
          {items.length > 0 ? (
            items.map((window) => {
              const status = windowStatusToBadge(window.status)
              return (
                <article className="usage-window-row" key={`${window.started_at}-${window.ended_at}`} role="listitem" aria-label={`Ventana 5h ${formatTimestamp(window.started_at)}: ${status.label}`}>
                  <div className="usage-window-row__main">
                    <div>
                      <p style={{ margin: 0, color: appTheme.colors.textMuted, fontSize: '12px', textTransform: 'uppercase', letterSpacing: '0.08em' }}>Ventana 5h</p>
                      <h3 style={{ margin: '4px 0 0', fontSize: '18px' }}>{formatTimestamp(window.started_at)} → {formatTimestamp(window.ended_at)}</h3>
                    </div>
                    <StatusBadge status={status.appStatus} label={status.label} />
                  </div>
                  <dl className="usage-window-row__metrics">
                    <div>
                      <dt>Pico</dt>
                      <dd>{formatPercent(window.peak_used_percent)}</dd>
                    </div>
                    <div>
                      <dt>Delta intra-ventana</dt>
                      <dd>{formatDeltaPercent(window.delta_percent)}</dd>
                    </div>
                    <div>
                      <dt>Muestras</dt>
                      <dd>{formatSamples(window.samples_count)}</dd>
                    </div>
                  </dl>
                  <UsageProgressBar value={window.peak_used_percent} status={window.status} />
                </article>
              )
            })
          ) : (
            <StatePanel
              status="sin-datos"
              title="Ventanas 5h sin datos"
              description={windows.empty_reason === 'not_configured' ? 'La fuente de ventanas Usage aún no está configurada.' : 'No hay ventanas suficientes para componer el historial saneado.'}
              eyebrow="Usage windows"
              ariaRole="region"
              ariaLabel="Ventanas 5h Usage sin datos"
            />
          )}
        </div>
      </div>
    </SurfaceCard>
  )
}

function UsageCalendarPanel({ calendar, isSnapshotMode }: { calendar: UsageCalendar; isSnapshotMode: boolean }) {
  const days = calendar.days.slice(-10)

  return (
    <SurfaceCard title="Calendario por fecha natural" eyebrow={`Ciclo semanal Codex · ${calendar.timezone}`} accent="gold" elevated>
      <div style={{ display: 'grid', gap: '12px' }}>
        <p style={{ margin: 0, color: appTheme.colors.textSecondary, lineHeight: 1.6 }}>
          Primera lectura histórica saneada: agrupa por fecha natural Europe/Madrid, sin contenido privado ni actividad Hermes. El delta diario se calcula por segmentos continuos del ciclo semanal Codex para no contar resets como consumo.
        </p>
        {isSnapshotMode ? (
          <p style={{ margin: 0, color: appTheme.colors.brandGold400, lineHeight: 1.5 }}>
            Calendario mostrado desde snapshot/fallback saneado: útil para validar composición visual, no para decidir consumo real.
          </p>
        ) : null}
        <div className="usage-calendar-grid" role="list" aria-label="Calendario Usage por fecha natural">
          {days.length > 0 ? (
            days.map((day) => {
              const status = calendarStatusMap[day.status]
              return (
                <article className="usage-calendar-day" key={day.date} role="listitem" aria-label={`${formatNaturalDate(day.date)}: ${status.label}`}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', gap: '10px', alignItems: 'flex-start' }}>
                    <div>
                      <p style={{ margin: 0, color: appTheme.colors.textMuted, fontSize: '12px', textTransform: 'uppercase', letterSpacing: '0.08em' }}>{day.date}</p>
                      <h3 style={{ margin: '4px 0 0', fontSize: '18px' }}>{formatNaturalDate(day.date)}</h3>
                    </div>
                    <StatusBadge status={status.appStatus} label={status.label} />
                  </div>
                  <dl className="usage-calendar-day__metrics">
                    <div>
                      <dt>Delta ciclo</dt>
                      <dd>{formatDeltaPercent(day.secondary_delta_percent)}</dd>
                    </div>
                    <div>
                      <dt>Ventanas 5h</dt>
                      <dd>{day.primary_windows_count}</dd>
                    </div>
                    <div>
                      <dt>Pico diario</dt>
                      <dd>{formatPeakPrimary(day.peak_primary_used_percent)}</dd>
                    </div>
                  </dl>
                  <p style={{ margin: 0, color: day.codex_segment.partial ? appTheme.colors.brandGold400 : appTheme.colors.textSecondary, lineHeight: 1.5 }}>
                    {calendarPartialCopy(day.codex_segment.reason)}
                  </p>
                </article>
              )
            })
          ) : (
            <StatePanel
              status="sin-datos"
              title="Calendario sin datos"
              description={calendar.empty_reason === 'not_configured' ? 'La fuente Usage calendar aún no está configurada.' : 'No hay días suficientes para componer el calendario saneado.'}
              eyebrow="Usage calendar"
              ariaRole="region"
              ariaLabel="Calendario Usage sin datos"
            />
          )}
        </div>
      </div>
    </SurfaceCard>
  )
}

function formatActivityCount(value: number) {
  return new Intl.NumberFormat('es-ES').format(value)
}

function formatProfileName(profile: string | null) {
  if (!profile) {
    return 'Sin perfil dominante'
  }

  return profile.charAt(0).toUpperCase() + profile.slice(1)
}

function UsageHermesActivityPanel({ activity, notice, isSnapshotMode }: { activity: UsageHermesActivity; notice: HermesActivityNotice | null; isSnapshotMode: boolean }) {
  const profiles = activity.profiles.slice(0, 8)
  const dominantProfile = formatProfileName(activity.totals.dominant_profile)

  return (
    <SurfaceCard title="Actividad Hermes agregada" eyebrow="Últimos 7 días · correlación orientativa" accent="gold" elevated>
      <div style={{ display: 'grid', gap: '14px' }}>
        <p style={{ margin: 0, color: appTheme.colors.textSecondary, lineHeight: 1.6 }}>
          Lectura read-only de actividad local Hermes por perfiles Mugiwara allowlisted. Es una correlación orientativa con el ritmo Codex: no atribuye causalidad exacta ni muestra actividad por sesión.
        </p>
        {isSnapshotMode ? (
          <p style={{ margin: 0, color: appTheme.colors.brandGold400, lineHeight: 1.5 }}>
            Actividad mostrada desde fallback saneado: valida composición visual, no representa lectura real.
          </p>
        ) : null}
        {notice ? (
          <StatePanel
            status={notice.status}
            title={notice.title}
            description={notice.description}
            detail={notice.detail}
            eyebrow="Estado de actividad Hermes"
            ariaRole="region"
            ariaLabel="Estado localizado de actividad Hermes"
          />
        ) : null}
        <dl className="usage-hermes-activity-summary" aria-label="Resumen agregado de actividad Hermes">
          <div>
            <dt>Perfiles activos</dt>
            <dd>{formatActivityCount(activity.totals.profiles_count)}</dd>
          </div>
          <div>
            <dt>Sesiones</dt>
            <dd>{formatActivityCount(activity.totals.sessions_count)}</dd>
          </div>
          <div>
            <dt>Mensajes</dt>
            <dd>{formatActivityCount(activity.totals.messages_count)}</dd>
          </div>
          <div>
            <dt>Tool calls</dt>
            <dd>{formatActivityCount(activity.totals.tool_calls_count)}</dd>
          </div>
        </dl>
        <div style={{ display: 'flex', flexWrap: 'wrap', gap: '10px', alignItems: 'center' }}>
          <StatusBadge status={activity.totals.dominant_profile ? 'revision' : 'sin-datos'} label={`Perfil dominante: ${dominantProfile}`} />
          <span style={{ color: appTheme.colors.textSecondary }}>Rango: {formatTimestamp(activity.range.started_at)} → {formatTimestamp(activity.range.ended_at)}</span>
        </div>
        <div className="usage-hermes-activity-list" role="list" aria-label="Actividad Hermes agregada por perfil">
          {profiles.length > 0 ? (
            profiles.map((profile) => {
              const level = activityLevelMap[profile.activity_level]
              return (
                <article className="usage-hermes-activity-row" key={profile.profile} role="listitem" aria-label={`${formatProfileName(profile.profile)}: actividad ${level.label.toLowerCase()}`}>
                  <div className="usage-hermes-activity-row__main">
                    <div>
                      <p style={{ margin: 0, color: appTheme.colors.textMuted, fontSize: '12px', textTransform: 'uppercase', letterSpacing: '0.08em' }}>Perfil Mugiwara</p>
                      <h3 style={{ margin: '4px 0 0', fontSize: '18px' }}>{formatProfileName(profile.profile)}</h3>
                    </div>
                    <StatusBadge status={level.appStatus} label={`Actividad ${level.label}`} />
                  </div>
                  <dl className="usage-hermes-activity-row__metrics">
                    <div>
                      <dt>Sesiones</dt>
                      <dd>{formatActivityCount(profile.sessions_count)}</dd>
                    </div>
                    <div>
                      <dt>Mensajes</dt>
                      <dd>{formatActivityCount(profile.messages_count)}</dd>
                    </div>
                    <div>
                      <dt>Tool calls</dt>
                      <dd>{formatActivityCount(profile.tool_calls_count)}</dd>
                    </div>
                  </dl>
                  <p style={{ margin: 0, color: appTheme.colors.textSecondary, lineHeight: 1.5 }}>
                    Primera/última señal agregada: {formatTimestamp(profile.first_activity_at)} → {formatTimestamp(profile.last_activity_at)}.
                  </p>
                </article>
              )
            })
          ) : (
            <StatePanel
              status="sin-datos"
              title="Actividad Hermes sin datos"
              description={activity.empty_reason === 'not_configured' ? 'La fuente de actividad Hermes aún no está configurada en backend.' : 'No hay actividad agregada suficiente para este rango.'}
              eyebrow="Actividad Hermes"
              ariaRole="region"
              ariaLabel="Actividad Hermes agregada sin datos"
            />
          )}
        </div>
      </div>
    </SurfaceCard>
  )
}

export default async function UsagePage() {
  const { usage, calendar, fiveHourWindows, hermesActivity, notice, hermesActivityNotice, isSnapshotMode } = await getInitialUsageData()
  const recommendationStatus = recommendationStatusMap[usage.recommendation.state]

  return (
    <>
      <PageHeader
        eyebrow="Uso"
        title="Uso Codex/Hermes"
        subtitle="Cuota Codex, ciclos de reset, ventanas 5h y actividad local agregada saneada."
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

      <SurfaceCard title="Ciclo semanal Codex" eyebrow="Metodología" accent="sky">
        <p style={{ margin: 0, color: appTheme.colors.textSecondary, lineHeight: 1.6 }}>{usage.methodology.cycle_copy}</p>
      </SurfaceCard>

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

      <section className="section-block" aria-label="Calendario Usage">
        <UsageCalendarPanel calendar={calendar} isSnapshotMode={isSnapshotMode} />
      </section>

      <section className="section-block" aria-label="Ventanas 5h Usage">
        <UsageWindowsPanel windows={fiveHourWindows} isSnapshotMode={isSnapshotMode} />
      </section>

      <section className="section-block" aria-label="Actividad Hermes Usage">
        <UsageHermesActivityPanel activity={hermesActivity} notice={hermesActivityNotice} isSnapshotMode={isSnapshotMode} />
      </section>

      <section className="section-block layout-grid layout-grid--content-aside">
        <SurfaceCard title="Qué entra en esta vista" eyebrow="Alcance Phase 17.4d" accent="gold">
          <ul style={{ margin: 0, paddingLeft: '18px', color: appTheme.colors.textSecondary, lineHeight: 1.6 }}>
            <li>Snapshot actual saneado de Codex usage.</li>
            <li>Ventana 5h y ciclo semanal Codex con rangos calculados por reset.</li>
            <li>Calendario por fecha natural Europe/Madrid con delta diario, ventanas 5h y pico diario saneados.</li>
            <li>Ventanas 5h históricas dedicadas con pico, delta intra-ventana y muestras.</li>
            <li>Actividad Hermes agregada por perfil y rango, tratada como correlación orientativa.</li>
          </ul>
        </SurfaceCard>
        <SurfaceCard title="Seguridad de datos" eyebrow="Deny by default" accent="sky">
          <p style={{ marginTop: 0, color: appTheme.colors.textSecondary, lineHeight: 1.6 }}>{usage.methodology.privacy}</p>
          <p style={{ margin: '10px 0 0', color: appTheme.colors.textSecondary, lineHeight: 1.6 }}>
            La actividad Hermes se muestra solo como agregados saneados. No se enseñan contenidos, identificadores privados, rutas internas, secretos, cabeceras, cookies, logs ni payloads crudos.
          </p>
          <p style={{ marginBottom: 0, color: appTheme.colors.textSecondary, lineHeight: 1.6 }}>
            Fórmulas: {usage.methodology.primary_window_formula}; {usage.methodology.secondary_cycle_formula}.
          </p>
        </SurfaceCard>
      </section>
    </>
  )
}

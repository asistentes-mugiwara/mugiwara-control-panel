'use client'

import { useMemo, useState } from 'react'
import type { UsageFiveHourWindowDays, UsageWindowStatus } from '@contracts/read-models'

import { StatePanel } from '@/shared/ui/state/StatePanel'
import { StatusBadge } from '@/shared/ui/status/StatusBadge'
import { appTheme, type AppStatus } from '@/shared/theme/tokens'

const windowStatusMap: Record<UsageWindowStatus, { appStatus: AppStatus; label: string }> = {
  normal: { appStatus: 'operativo', label: 'Normal' },
  high: { appStatus: 'revision', label: 'Alto' },
  critical: { appStatus: 'incidencia', label: 'Crítico' },
  limit_reached: { appStatus: 'incidencia', label: 'Límite alcanzado' },
  unknown: { appStatus: 'sin-datos', label: 'Sin datos' },
}

function formatTimestamp(value: string | null) {
  if (!value) return 'Fecha no disponible'
  const date = new Date(value)
  if (Number.isNaN(date.getTime())) return 'Fecha no disponible'
  const formatted = new Intl.DateTimeFormat('es-ES', {
    weekday: 'long',
    day: 'numeric',
    month: 'short',
    year: 'numeric',
    hour: 'numeric',
    minute: '2-digit',
    timeZone: 'Europe/Madrid',
  }).format(date)
  return formatted.charAt(0).toUpperCase() + formatted.slice(1)
}

function formatDayLabel(dateValue: string, relativeLabel: 'hoy' | 'ayer' | null) {
  const [year, month, day] = dateValue.split('-').map(Number)
  const date = new Date(Date.UTC(year, month - 1, day))
  const base = Number.isNaN(date.getTime())
    ? dateValue
    : new Intl.DateTimeFormat('es-ES', { weekday: 'short', day: '2-digit', month: 'short', timeZone: 'UTC' }).format(date)
  return relativeLabel ? `${base} (${relativeLabel})` : base
}

function formatPercent(value: number | null) {
  return value === null ? '—' : `${Math.round(value)}%`
}

function formatDeltaPercent(value: number | null) {
  return value === null ? '—' : `+${Math.round(value)}%`
}

function formatSamples(value: number) {
  return value === 1 ? '1 muestra' : `${value} muestras`
}

export function UsageWindowDaysSelector({ windowDays, isSnapshotMode }: { windowDays: UsageFiveHourWindowDays; isSnapshotMode: boolean }) {
  const initialDate = useMemo(() => {
    const today = windowDays.days.find((day) => day.relative_label === 'hoy')
    return today?.date ?? windowDays.days.at(-1)?.date ?? ''
  }, [windowDays.days])
  const [selectedDate, setSelectedDate] = useState(initialDate)
  const selectedDay = windowDays.days.find((day) => day.date === selectedDate) ?? windowDays.days.at(-1)

  return (
    <div style={{ display: 'grid', gap: '12px' }}>
      <p style={{ margin: 0, color: appTheme.colors.textSecondary, lineHeight: 1.6 }}>
        Elige un día natural en Europe/Madrid y revisa solo las ventanas 5h asignadas a ese día. Si una ventana cruza medianoche, queda en el día donde aporta más duración.
      </p>
      {isSnapshotMode ? (
        <p style={{ margin: 0, color: appTheme.colors.brandGold400, lineHeight: 1.5 }}>
          Ventanas mostradas desde snapshot/fallback saneado: sirven para validar composición visual, no para decidir consumo real.
        </p>
      ) : null}
      <div className="usage-window-day-selector" role="tablist" aria-label="Últimos 7 días de ventanas 5h">
        {windowDays.days.map((day) => {
          const selected = day.date === selectedDay?.date
          return (
            <button
              type="button"
              role="tab"
              aria-selected={selected}
              aria-controls={`usage-window-day-${day.date}`}
              className="usage-window-day-selector__button"
              data-selected={selected ? 'true' : 'false'}
              key={day.date}
              onClick={() => setSelectedDate(day.date)}
            >
              {formatDayLabel(day.date, day.relative_label)}
            </button>
          )
        })}
      </div>
      <div id={selectedDay ? `usage-window-day-${selectedDay.date}` : undefined} className="usage-windows-list usage-windows-list--scroll" role="tabpanel" aria-label={selectedDay ? `Ventanas 5h de ${selectedDay.date}` : 'Ventanas 5h por día'}>
        {selectedDay && selectedDay.windows.length > 0 ? (
          selectedDay.windows.map((window) => {
            const status = windowStatusMap[window.status]
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
                  <div><dt>Pico</dt><dd>{formatPercent(window.peak_used_percent)}</dd></div>
                  <div><dt>Delta intra-ventana</dt><dd>{formatDeltaPercent(window.delta_percent)}</dd></div>
                  <div><dt>Muestras</dt><dd>{formatSamples(window.samples_count)}</dd></div>
                </dl>
              </article>
            )
          })
        ) : (
          <StatePanel
            status="sin-datos"
            title="Sin ventanas 5h para este día"
            description={windowDays.empty_reason === 'not_configured' ? 'La fuente de ventanas Usage aún no está configurada.' : 'Selecciona otro día para revisar ventanas históricas disponibles.'}
            eyebrow="Usage windows"
            ariaRole="region"
            ariaLabel="Ventanas 5h Usage sin datos para el día seleccionado"
          />
        )}
      </div>
    </div>
  )
}

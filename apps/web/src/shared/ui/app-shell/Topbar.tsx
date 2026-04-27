'use client'

import type { RefObject } from 'react'

import type { HeaderSystemMetrics } from './system-metrics'
import { appTheme } from '@/shared/theme/tokens'
import { StatusBadge } from '@/shared/ui/status/StatusBadge'

type TopbarProps = {
  navId: string
  menuButtonRef: RefObject<HTMLButtonElement | null>
  isMobileNavOpen: boolean
  systemMetrics: HeaderSystemMetrics
  onToggleNavigation: () => void
}

type CapacityMetric = HeaderSystemMetrics['ram']
type UptimeMetric = HeaderSystemMetrics['uptime']

function formatBytes(value: number | null) {
  if (value === null) {
    return '—'
  }

  const gibibytes = value / 1024 ** 3
  if (gibibytes >= 10) {
    return `${Math.round(gibibytes)} GB`
  }

  return `${gibibytes.toFixed(1)} GB`
}

function formatPercent(value: number | null) {
  if (value === null) {
    return '—'
  }

  return `${Math.round(value)}%`
}

function formatCapacityValue(metric: CapacityMetric) {
  if (metric.used_bytes === null || metric.total_bytes === null) {
    return '—'
  }

  return `${formatBytes(metric.used_bytes)} / ${formatBytes(metric.total_bytes)}`
}

function formatUptimeValue(metric: UptimeMetric) {
  if (metric.days === null || metric.hours === null || metric.minutes === null) {
    return '—'
  }

  return `${metric.days}d ${metric.hours}h ${metric.minutes}m`
}

function metricTitle(label: string, state: CapacityMetric['source_state'] | UptimeMetric['source_state']) {
  return state === 'live' ? label : `${label} no disponible`
}

function SystemMetricChip({ label, value, detail, muted }: { label: string; value: string; detail?: string; muted?: boolean }) {
  return (
    <span
      className="topbar__metric-chip"
      style={{
        border: `1px solid ${muted ? 'rgba(255, 255, 255, 0.08)' : 'rgba(90, 157, 219, 0.24)'}`,
        borderRadius: appTheme.radius.md,
        background: muted ? 'rgba(255, 255, 255, 0.025)' : 'rgba(90, 157, 219, 0.08)',
        color: muted ? appTheme.colors.textMuted : appTheme.colors.textPrimary,
        padding: '7px 9px',
      }}
      title={detail ? `${label}: ${value} · ${detail}` : `${label}: ${value}`}
    >
      <span className="topbar__metric-label">{label}</span>
      <strong className="topbar__metric-value">{value}</strong>
      {detail ? <span className="topbar__metric-detail">{detail}</span> : null}
    </span>
  )
}

function HeaderSystemMetricsStrip({ metrics }: { metrics: HeaderSystemMetrics }) {
  const isUnavailable = metrics.sourceState === 'not_configured' || metrics.sourceState === 'unavailable'
  const ramPercent = formatPercent(metrics.ram.used_percent)
  const diskPercent = formatPercent(metrics.disk.used_percent)

  return (
    <div
      className="topbar__metrics-strip"
      aria-label="Métricas resumidas del sistema"
      style={{
        display: 'flex',
        alignItems: 'stretch',
        justifyContent: 'flex-end',
        gap: '8px',
        minWidth: 0,
      }}
    >
      <SystemMetricChip
        label={metricTitle('RAM', metrics.ram.source_state)}
        value={ramPercent}
        detail={formatCapacityValue(metrics.ram)}
        muted={isUnavailable || metrics.ram.source_state !== 'live'}
      />
      <SystemMetricChip
        label={metricTitle('Disco', metrics.disk.source_state)}
        value={diskPercent}
        detail={formatCapacityValue(metrics.disk)}
        muted={isUnavailable || metrics.disk.source_state !== 'live'}
      />
      <SystemMetricChip
        label={metricTitle('Uptime', metrics.uptime.source_state)}
        value={formatUptimeValue(metrics.uptime)}
        muted={isUnavailable || metrics.uptime.source_state !== 'live'}
      />
    </div>
  )
}

function statusForMetrics(sourceState: HeaderSystemMetrics['sourceState']) {
  if (sourceState === 'live') {
    return 'operativo'
  }

  if (sourceState === 'degraded') {
    return 'revision'
  }

  return 'sin-datos'
}

export function Topbar({ navId, menuButtonRef, isMobileNavOpen, systemMetrics, onToggleNavigation }: TopbarProps) {
  return (
    <header
      style={{
        position: 'sticky',
        top: 0,
        zIndex: 30,
        borderBottom: `1px solid ${appTheme.colors.borderSubtle}`,
        background: appTheme.colors.bgApp,
      }}
    >
      <div
        className="topbar"
        style={{
          margin: '0 auto',
          maxWidth: `calc(${appTheme.layout.maxContentWidth} + 48px)`,
          padding: '14px 24px',
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          gap: '12px',
        }}
      >
        <div className="topbar__brand">
          <button
            type="button"
            className="topbar__menu-button"
            ref={menuButtonRef}
            aria-label={isMobileNavOpen ? 'Cerrar navegación principal' : 'Abrir navegación principal'}
            aria-expanded={isMobileNavOpen}
            aria-controls={navId}
            onClick={onToggleNavigation}
            style={{
              border: `1px solid ${appTheme.colors.borderSubtle}`,
              borderRadius: appTheme.radius.md,
              background: appTheme.colors.bgSurface1,
              color: appTheme.colors.textPrimary,
              padding: '8px 10px',
              cursor: 'pointer',
            }}
          >
            ☰
          </button>

          <div className="topbar__identity">
            <p style={{ margin: 0, color: appTheme.colors.textSecondary, fontSize: '12px' }}>Control plane privado</p>
            <strong style={{ display: 'block', marginTop: '2px' }}>Mugiwara / Hermes</strong>
          </div>
        </div>

        <div className="topbar__status-group" style={{ display: 'flex', alignItems: 'center', justifyContent: 'flex-end', gap: '10px', flexWrap: 'wrap', minWidth: 0 }}>
          <HeaderSystemMetricsStrip metrics={systemMetrics} />
          <span
            className="topbar__command-chip"
            style={{
              border: `1px solid ${appTheme.colors.borderSubtle}`,
              borderRadius: appTheme.radius.md,
              padding: '6px 10px',
              color: appTheme.colors.textMuted,
              fontSize: '12px',
            }}
          >
            ⌘K command (soon)
          </span>
          <StatusBadge status={statusForMetrics(systemMetrics.sourceState)} />
        </div>
      </div>
    </header>
  )
}

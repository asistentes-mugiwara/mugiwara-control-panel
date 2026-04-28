import { appTheme, statusColorMap, type AppStatus } from '@/shared/theme/tokens'

type StatusBadgeProps = {
  status: AppStatus
  label?: string
  detail?: string
}

const statusLabelMap: Record<AppStatus, string> = {
  operativo: 'Operativo',
  revision: 'En revisión',
  incidencia: 'Incidencia',
  stale: 'Desactualizado',
  'sin-datos': 'Sin datos',
}

export function StatusBadge({ status, label, detail }: StatusBadgeProps) {
  const color = statusColorMap[status]
  const displayLabel = label ?? statusLabelMap[status]
  const displayText = detail ? `${displayLabel} (${detail})` : displayLabel

  return (
    <span
      className="status-badge"
      style={{
        border: `1px solid ${color}`,
        color,
        borderRadius: '999px',
        padding: '4px 10px',
        fontSize: '12px',
        fontWeight: 700,
        letterSpacing: '0.01em',
        background: appTheme.colors.bgSurface2,
      }}
      aria-label={`Estado ${displayText}`}
    >
      {displayText}
    </span>
  )
}

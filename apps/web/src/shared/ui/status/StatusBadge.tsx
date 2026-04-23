import { appTheme, statusColorMap, type AppStatus } from '@/shared/theme/tokens'

type StatusBadgeProps = {
  status: AppStatus
}

const statusLabelMap: Record<AppStatus, string> = {
  operativo: 'Operativo',
  revision: 'En revisión',
  incidencia: 'Incidencia',
  stale: 'Desactualizado',
  'sin-datos': 'Sin datos',
}

export function StatusBadge({ status }: StatusBadgeProps) {
  const color = statusColorMap[status]

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
      aria-label={`Estado ${statusLabelMap[status]}`}
    >
      {statusLabelMap[status]}
    </span>
  )
}

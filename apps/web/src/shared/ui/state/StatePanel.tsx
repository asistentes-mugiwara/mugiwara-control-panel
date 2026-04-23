import type { ReactNode } from 'react'

import { StatusBadge } from '@/shared/ui/status/StatusBadge'
import { appTheme, statusColorMap, type AppStatus } from '@/shared/theme/tokens'

type StatePanelProps = {
  status: AppStatus
  title: string
  description: string
  detail?: string | null
  eyebrow?: string
  children?: ReactNode
}

export function StatePanel({ status, title, description, detail, eyebrow, children }: StatePanelProps) {
  const accentColor = statusColorMap[status]

  return (
    <div
      role="status"
      style={{
        display: 'grid',
        gap: '10px',
        padding: '14px',
        borderRadius: appTheme.radius.md,
        border: `1px solid ${accentColor}`,
        background: appTheme.colors.bgSurface1,
      }}
    >
      <div style={{ display: 'flex', justifyContent: 'space-between', gap: '10px', flexWrap: 'wrap', alignItems: 'center' }}>
        <div style={{ display: 'grid', gap: '4px' }}>
          {eyebrow ? <span style={{ color: appTheme.colors.textMuted, fontSize: '12px', fontWeight: 700, letterSpacing: '0.04em', textTransform: 'uppercase' }}>{eyebrow}</span> : null}
          <strong style={{ fontSize: '16px', letterSpacing: '-0.01em' }}>{title}</strong>
        </div>
        <StatusBadge status={status} />
      </div>

      <p style={{ margin: 0, color: appTheme.colors.textSecondary, lineHeight: 1.5 }}>{description}</p>
      {detail ? <span style={{ color: appTheme.colors.textSecondary, fontSize: '13px' }}>{detail}</span> : null}

      {children ? (
        <div
          style={{
            display: 'grid',
            gap: '8px',
            paddingTop: '10px',
            borderTop: `1px solid ${appTheme.colors.borderSubtle}`,
          }}
        >
          {children}
        </div>
      ) : null}
    </div>
  )
}

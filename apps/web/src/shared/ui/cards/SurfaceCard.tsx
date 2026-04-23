import type { ReactNode } from 'react'

import { appTheme } from '@/shared/theme/tokens'

type SurfaceCardAccent = 'sky' | 'gold' | 'success' | 'warning' | 'danger'

const accentColorMap: Record<SurfaceCardAccent, string> = {
  sky: appTheme.colors.brandSky500,
  gold: appTheme.colors.brandGold400,
  success: appTheme.colors.stateSuccess,
  warning: appTheme.colors.stateWarning,
  danger: appTheme.colors.stateDanger,
}

type SurfaceCardProps = {
  children: ReactNode
  title?: string
  eyebrow?: string
  elevated?: boolean
  accent?: SurfaceCardAccent
}

export function SurfaceCard({ children, title, eyebrow, elevated = false, accent }: SurfaceCardProps) {
  const accentColor = accent ? accentColorMap[accent] : null

  return (
    <article
      style={{
        background: elevated ? appTheme.colors.bgSurface2 : appTheme.colors.bgSurface1,
        border: `1px solid ${accentColor ?? appTheme.colors.borderSubtle}`,
        borderRadius: appTheme.radius.lg,
        padding: '18px',
        boxShadow: accentColor ? `inset 3px 0 0 ${accentColor}` : 'none',
      }}
    >
      {eyebrow ? (
        <p
          style={{
            margin: '0 0 8px',
            color: accentColor ?? appTheme.colors.brandSky500,
            fontWeight: 700,
            fontSize: '11px',
            textTransform: 'uppercase',
            letterSpacing: '0.08em',
          }}
        >
          {eyebrow}
        </p>
      ) : null}
      {title ? <h2 style={{ marginTop: 0, marginBottom: '12px', fontSize: '18px' }}>{title}</h2> : null}
      {children}
    </article>
  )
}

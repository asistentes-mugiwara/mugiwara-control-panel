import type { ReactNode } from 'react'

import { appTheme } from '@/shared/theme/tokens'

type SurfaceCardProps = {
  children: ReactNode
  title?: string
  elevated?: boolean
}

export function SurfaceCard({ children, title, elevated = false }: SurfaceCardProps) {
  return (
    <article
      style={{
        background: elevated ? appTheme.colors.bgSurface2 : appTheme.colors.bgSurface1,
        border: `1px solid ${appTheme.colors.borderSubtle}`,
        borderRadius: appTheme.radius.lg,
        padding: '18px',
      }}
    >
      {title ? <h2 style={{ marginTop: 0, marginBottom: '12px', fontSize: '18px' }}>{title}</h2> : null}
      {children}
    </article>
  )
}

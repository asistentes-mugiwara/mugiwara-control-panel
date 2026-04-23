import type { ReactNode } from 'react'

import { appTheme } from '@/shared/theme/tokens'

type PageHeaderProps = {
  title: string
  subtitle?: string
  eyebrow?: string
  actions?: ReactNode
}

export function PageHeader({ title, subtitle, eyebrow, actions }: PageHeaderProps) {
  return (
    <section
      style={{
        display: 'flex',
        justifyContent: 'space-between',
        alignItems: 'flex-end',
        gap: '16px',
        marginBottom: '18px',
      }}
    >
      <div>
        {eyebrow ? (
          <p
            style={{
              margin: '0 0 8px',
              color: appTheme.colors.brandSky500,
              fontWeight: 600,
              fontSize: '12px',
              textTransform: 'uppercase',
              letterSpacing: '0.08em',
            }}
          >
            {eyebrow}
          </p>
        ) : null}

        <h1 style={{ margin: 0, fontSize: '32px', lineHeight: 1.2 }}>{title}</h1>

        {subtitle ? (
          <p style={{ margin: '10px 0 0', color: appTheme.colors.textSecondary, maxWidth: '72ch' }}>
            {subtitle}
          </p>
        ) : null}
      </div>

      {actions ? <div>{actions}</div> : null}
    </section>
  )
}

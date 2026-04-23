import type { ReactNode } from 'react'

import type { MugiwaraSlug } from '@/shared/mugiwara/crest-map'
import { MugiwaraCrest } from '@/shared/mugiwara/MugiwaraCrest'
import { appTheme } from '@/shared/theme/tokens'

type PageHeaderProps = {
  title: string
  subtitle?: string
  eyebrow?: string
  actions?: ReactNode
  mugiwaraSlug?: MugiwaraSlug
  detailPills?: string[]
}

export function PageHeader({ title, subtitle, eyebrow, actions, mugiwaraSlug, detailPills = [] }: PageHeaderProps) {
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
      <div style={{ display: 'grid', gap: '12px' }}>
        <div>
          {eyebrow || mugiwaraSlug ? (
            <div style={{ display: 'flex', alignItems: 'center', gap: '10px', flexWrap: 'wrap', marginBottom: '8px' }}>
              {mugiwaraSlug ? <MugiwaraCrest slug={mugiwaraSlug} size="sm" accent /> : null}
              {eyebrow ? (
                <p
                  style={{
                    margin: 0,
                    color: appTheme.colors.brandSky500,
                    fontWeight: 700,
                    fontSize: '12px',
                    textTransform: 'uppercase',
                    letterSpacing: '0.08em',
                  }}
                >
                  {eyebrow}
                </p>
              ) : null}
            </div>
          ) : null}

          <h1 style={{ margin: 0, fontSize: '34px', lineHeight: 1.15, letterSpacing: '-0.02em' }}>{title}</h1>

          {subtitle ? (
            <p style={{ margin: '10px 0 0', color: appTheme.colors.textSecondary, maxWidth: '72ch', lineHeight: 1.6 }}>
              {subtitle}
            </p>
          ) : null}
        </div>

        {detailPills.length > 0 ? (
          <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap' }}>
            {detailPills.map((pill) => (
              <span
                key={pill}
                style={{
                  borderRadius: '999px',
                  padding: '4px 10px',
                  border: `1px solid ${appTheme.colors.borderSubtle}`,
                  background: appTheme.colors.bgSurface1,
                  color: appTheme.colors.textPrimary,
                  fontSize: '12px',
                  fontWeight: 700,
                }}
              >
                {pill}
              </span>
            ))}
          </div>
        ) : null}
      </div>

      {actions ? <div>{actions}</div> : null}
    </section>
  )
}

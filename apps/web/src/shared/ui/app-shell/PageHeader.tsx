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
    <section className="page-header">
      <div className="page-header__body">
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

          <h1 className="page-header__title">{title}</h1>

          {subtitle ? (
            <p className="page-header__subtitle" style={{ color: appTheme.colors.textSecondary }}>
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

      {actions ? <div className="page-header__actions">{actions}</div> : null}
    </section>
  )
}

import Link from 'next/link'

import {
  getMugiwaraStatusLabel,
  mapMugiwaraStatusToBadgeStatus,
} from '@/modules/mugiwaras/view-models/mugiwara-card.mappers'
import { mugiwaraCardFixture } from '@/modules/mugiwaras/view-models/mugiwara-card.fixture'
import { getMugiwaraProfile } from '@/shared/mugiwara/crest-map'
import { MugiwaraCrest } from '@/shared/mugiwara/MugiwaraCrest'
import { PageHeader } from '@/shared/ui/app-shell/PageHeader'
import { SurfaceCard } from '@/shared/ui/cards/SurfaceCard'
import { StatusBadge } from '@/shared/ui/status/StatusBadge'
import { appTheme } from '@/shared/theme/tokens'

export default function MugiwarasPage() {
  return (
    <>
      <PageHeader
        eyebrow="Mugiwaras"
        title="Tripulación"
        subtitle="Vista read-only de identidad, estado, skills enlazadas y señales de memoria por Mugiwara."
      />

      <SurfaceCard title="Superficie de lectura">
        <p style={{ marginTop: 0, marginBottom: '10px', color: appTheme.colors.textSecondary }}>
          Esta vista agrega solo resúmenes saneados por agente. No abre detalle por ruta ni expone controles de edición.
        </p>
        <StatusBadge status="operativo" />
      </SurfaceCard>

      <section
        style={{
          marginTop: '14px',
          display: 'grid',
          gap: '14px',
          gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))',
        }}
      >
        {mugiwaraCardFixture.map((mugiwara) => {
          const profile = getMugiwaraProfile(mugiwara.slug)

          return (
            <SurfaceCard key={mugiwara.slug} title={mugiwara.name} elevated>
              <div style={{ display: 'grid', gap: '12px' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', gap: '10px', flexWrap: 'wrap' }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                    <MugiwaraCrest slug={mugiwara.slug} size="md" accent />
                    <div style={{ display: 'grid', gap: '2px' }}>
                      <span style={{ color: appTheme.colors.textSecondary, fontSize: '13px' }}>slug: {mugiwara.slug}</span>
                      <span style={{ color: appTheme.colors.textMuted, fontSize: '12px' }}>{profile.role}</span>
                    </div>
                  </div>
                  <StatusBadge status={mapMugiwaraStatusToBadgeStatus(mugiwara.status)} />
                </div>

                <p style={{ margin: 0, color: appTheme.colors.textSecondary }}>
                  Estado visible: <strong>{getMugiwaraStatusLabel(mugiwara.status)}</strong>
                </p>

                <div>
                  <p style={{ margin: '0 0 8px', fontSize: '13px', color: appTheme.colors.textMuted }}>Skills enlazadas</p>
                  <div style={{ display: 'flex', flexWrap: 'wrap', gap: '8px' }}>
                    {mugiwara.skills.map((skill) => (
                      <span
                        key={skill}
                        style={{
                          border: `1px solid ${appTheme.colors.borderSubtle}`,
                          borderRadius: '999px',
                          padding: '4px 10px',
                          fontSize: '12px',
                          color: appTheme.colors.textSecondary,
                        }}
                      >
                        {skill}
                      </span>
                    ))}
                  </div>
                </div>

                <div>
                  <p style={{ margin: '0 0 8px', fontSize: '13px', color: appTheme.colors.textMuted }}>Memory badge</p>
                  <span
                    style={{
                      display: 'inline-flex',
                      alignItems: 'center',
                      borderRadius: '999px',
                      padding: '4px 10px',
                      background: appTheme.colors.bgSurface1,
                      border: `1px solid ${appTheme.colors.borderSubtle}`,
                      color: appTheme.colors.brandSky500,
                      fontSize: '12px',
                      fontWeight: 600,
                    }}
                  >
                    {mugiwara.memory_badge}
                  </span>
                </div>

                <div style={{ display: 'flex', gap: '10px', flexWrap: 'wrap' }}>
                  {mugiwara.links.map((link) => (
                    <Link
                      key={`${mugiwara.slug}-${link.href}`}
                      href={link.href}
                      style={{ color: appTheme.colors.brandSky500, textDecoration: 'none', fontWeight: 600 }}
                    >
                      {link.label}
                    </Link>
                  ))}
                </div>
              </div>
            </SurfaceCard>
          )
        })}
      </section>
    </>
  )
}

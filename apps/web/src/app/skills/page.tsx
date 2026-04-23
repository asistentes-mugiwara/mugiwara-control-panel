import Link from 'next/link'

import {
  getSkillExposureLabel,
  mapSkillSurfaceStatusToBadgeStatus,
} from '@/modules/skills/view-models/skill-surface.mappers'
import { skillSurfaceFixture } from '@/modules/skills/view-models/skill-surface.fixture'
import { PageHeader } from '@/shared/ui/app-shell/PageHeader'
import { SurfaceCard } from '@/shared/ui/cards/SurfaceCard'
import { StatusBadge } from '@/shared/ui/status/StatusBadge'
import { appTheme } from '@/shared/theme/tokens'

export default function SkillsPage() {
  const surface = skillSurfaceFixture

  return (
    <>
      <PageHeader
        eyebrow="Skills"
        title="Skills"
        subtitle="Superficie read-only con frontera explícita de edición permitida, allowlist y auditoría mínima visible."
      />

      <section
        style={{
          display: 'grid',
          gap: '14px',
          gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))',
        }}
      >
        <SurfaceCard title="Frontera de edición" elevated>
          <div id="edit-boundary" style={{ display: 'grid', gap: '10px' }}>
            <p style={{ margin: 0, color: appTheme.colors.textSecondary }}>
              Skills sigue siendo la única superficie potencialmente editable del MVP, pero en esta fase la UI solo
              expone lectura saneada y deja clara la política deny-by-default.
            </p>
            <StatusBadge status="operativo" />
            <ul style={{ margin: 0, paddingLeft: '18px', color: appTheme.colors.textSecondary, display: 'grid', gap: '8px' }}>
              {surface.boundary_rules.map((rule) => (
                <li key={rule}>{rule}</li>
              ))}
            </ul>
          </div>
        </SurfaceCard>

        <SurfaceCard title="Auditoría mínima" elevated>
          <div id="audit-minimum" style={{ display: 'grid', gap: '10px' }}>
            <p style={{ margin: 0, color: appTheme.colors.textSecondary }}>
              Antes de habilitar guardado real, el backend debe poder reconstruir quién tocó qué skill y con qué diff
              resumido. Git ayuda, pero no sustituye esta capa operacional.
            </p>
            <StatusBadge status="revision" />
            <ul style={{ margin: 0, paddingLeft: '18px', color: appTheme.colors.textSecondary, display: 'grid', gap: '8px' }}>
              {surface.audit_minimum.map((item) => (
                <li key={item}>{item}</li>
              ))}
            </ul>
          </div>
        </SurfaceCard>

        <SurfaceCard title="Patrones denegados" elevated>
          <div style={{ display: 'grid', gap: '10px' }}>
            <p style={{ margin: 0, color: appTheme.colors.textSecondary }}>
              Esta frontera impide convertir la UI en un editor libre del filesystem o del runtime. Lo que no esté
              allowlisted permanece fuera de alcance.
            </p>
            <StatusBadge status="operativo" />
            <ul style={{ margin: 0, paddingLeft: '18px', color: appTheme.colors.textSecondary, display: 'grid', gap: '8px' }}>
              {surface.denied_patterns.map((item) => (
                <li key={item}>{item}</li>
              ))}
            </ul>
          </div>
        </SurfaceCard>
      </section>

      <section
        style={{
          marginTop: '14px',
          display: 'grid',
          gap: '14px',
          gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))',
        }}
      >
        {surface.cards.map((skill) => (
          <SurfaceCard key={skill.skill_id} title={skill.title} elevated>
            <div style={{ display: 'grid', gap: '12px' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', gap: '10px', flexWrap: 'wrap' }}>
                <span style={{ color: appTheme.colors.textSecondary, fontSize: '13px' }}>skill_id: {skill.skill_id}</span>
                <StatusBadge status={mapSkillSurfaceStatusToBadgeStatus(skill.status)} />
              </div>

              <p style={{ margin: 0, color: appTheme.colors.textSecondary }}>{skill.summary}</p>

              <div style={{ display: 'grid', gap: '6px' }}>
                <span style={{ color: appTheme.colors.textMuted, fontSize: '13px' }}>Owner</span>
                <strong>{skill.owner}</strong>
              </div>

              <div style={{ display: 'grid', gap: '6px' }}>
                <span style={{ color: appTheme.colors.textMuted, fontSize: '13px' }}>Exposición</span>
                <span
                  style={{
                    display: 'inline-flex',
                    alignItems: 'center',
                    width: 'fit-content',
                    borderRadius: '999px',
                    padding: '4px 10px',
                    background: appTheme.colors.bgSurface1,
                    border: `1px solid ${appTheme.colors.borderSubtle}`,
                    color: appTheme.colors.brandSky500,
                    fontSize: '12px',
                    fontWeight: 600,
                  }}
                >
                  {getSkillExposureLabel(skill.exposure)}
                </span>
              </div>

              <div style={{ display: 'grid', gap: '6px' }}>
                <span style={{ color: appTheme.colors.textMuted, fontSize: '13px' }}>Diff requerido</span>
                <span style={{ color: appTheme.colors.textSecondary }}>{skill.diff_mode}</span>
              </div>

              <span style={{ color: appTheme.colors.textMuted, fontSize: '13px' }}>
                Última revisión: {skill.last_reviewed}
              </span>

              <div style={{ display: 'flex', gap: '10px', flexWrap: 'wrap' }}>
                {skill.links.map((link) => (
                  <Link
                    key={`${skill.skill_id}-${link.href}`}
                    href={link.href}
                    style={{ color: appTheme.colors.brandSky500, textDecoration: 'none', fontWeight: 600 }}
                  >
                    {link.label}
                  </Link>
                ))}
              </div>
            </div>
          </SurfaceCard>
        ))}
      </section>
    </>
  )
}

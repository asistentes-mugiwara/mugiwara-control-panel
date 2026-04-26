import Link from 'next/link'

import type { CrewRulesDocument, MugiwaraCard } from '@contracts/read-models'

import {
  getMugiwaraStatusLabel,
  mapMugiwaraStatusToBadgeStatus,
} from '@/modules/mugiwaras/view-models/mugiwara-card.mappers'
import { fetchMugiwarasCatalog, getMugiwarasApiBaseUrl, MugiwarasApiError } from '@/modules/mugiwaras/api/mugiwaras-http'
import { mugiwaraCardFixture } from '@/modules/mugiwaras/view-models/mugiwara-card.fixture'
import { getMugiwaraProfile, isMugiwaraSlug } from '@/shared/mugiwara/crest-map'
import { MugiwaraCrest } from '@/shared/mugiwara/MugiwaraCrest'
import { PageHeader } from '@/shared/ui/app-shell/PageHeader'
import { SurfaceCard } from '@/shared/ui/cards/SurfaceCard'
import { StatePanel } from '@/shared/ui/state/StatePanel'
import { SourceStatePills } from '@/shared/ui/status/SourceStatePills'
import { StatusBadge } from '@/shared/ui/status/StatusBadge'
import { appTheme, type AppStatus } from '@/shared/theme/tokens'

export const dynamic = 'force-dynamic'

type MugiwarasViewState = 'ready' | 'fallback' | 'error' | 'not_configured'

type MugiwarasViewModel = {
  state: MugiwarasViewState
  cards: MugiwaraCard[]
  crewRulesDocument: CrewRulesDocument | null
  notice: {
    status: AppStatus
    title: string
    description: string
    detail: string | null
  } | null
}

function getMugiwarasConfigNotice(error: MugiwarasApiError | null): MugiwarasViewModel {
  return {
    state: 'not_configured',
    cards: mugiwaraCardFixture,
    crewRulesDocument: null,
    notice: {
      status: error?.code === 'invalid_config' ? 'incidencia' : 'revision',
      title: error?.code === 'invalid_config' ? 'Configuración server-only de Mugiwara inválida' : 'Tripulación en modo fallback local',
      description:
        'Mostrando fixture saneado de tripulación. Mantiene la navegación, pero AGENTS.md canónico solo aparece cuando la API allowlisted está conectada.',
      detail: error?.code ? `Estado técnico: ${error.code}` : 'Estado técnico: not_configured',
    },
  }
}

async function getMugiwarasViewModel(): Promise<MugiwarasViewModel> {
  try {
    const apiBaseUrl = getMugiwarasApiBaseUrl()

    if (!apiBaseUrl) {
      return getMugiwarasConfigNotice(null)
    }

    const response = await fetchMugiwarasCatalog()
    return {
      state: 'ready',
      cards: response.data.items,
      crewRulesDocument: response.data.crew_rules_document,
      notice: null,
    }
  } catch (error) {
    if (error instanceof MugiwarasApiError && error.code === 'invalid_config') {
      return getMugiwarasConfigNotice(error)
    }

    const errorCode = error instanceof MugiwarasApiError ? error.code : 'fetch_failed'
    return {
      state: 'error',
      cards: mugiwaraCardFixture,
      crewRulesDocument: null,
      notice: {
        status: 'incidencia',
        title: 'No se pudo cargar la API read-only de Mugiwara',
        description:
          'La UI cae al fixture saneado para no romper el shell. No se muestra AGENTS.md si la fuente backend no está disponible y no se exponen detalles host.',
        detail: `Estado técnico: ${errorCode}`,
      },
    }
  }
}

function getSafeProfile(card: MugiwaraCard) {
  return isMugiwaraSlug(card.slug) ? getMugiwaraProfile(card.slug) : null
}

function formatLineCount(markdown: string) {
  return markdown.length === 0 ? 0 : markdown.split('\n').length
}

export default async function MugiwarasPage() {
  const viewModel = await getMugiwarasViewModel()

  return (
    <>
      <PageHeader
        eyebrow="Mugiwaras"
        title="Tripulación"
        subtitle="Vista de solo lectura de identidad, estado, skills enlazadas, señales de memoria y canon operativo Mugiwara."
        mugiwaraSlug="luffy"
        detailPills={['Índice de tripulación', 'Emblemas activos', 'Documento canónico read-only']}
      />

      <SurfaceCard title="Superficie de lectura" eyebrow="Roster" accent="gold">
        <p style={{ marginTop: 0, marginBottom: '10px', color: appTheme.colors.textSecondary }}>
          Esta vista agrega solo resúmenes saneados por agente. No abre controles de edición y solo muestra el AGENTS.md canónico de crew-core cuando llega desde la API allowlisted.
        </p>
        <StatusBadge status={viewModel.state === 'ready' ? 'operativo' : 'revision'} />
      </SurfaceCard>

      {viewModel.notice ? (
        <section className="section-block">
          <StatePanel
            status={viewModel.notice.status}
            title={viewModel.notice.title}
            description={viewModel.notice.description}
            detail={viewModel.notice.detail}
            eyebrow="Estado de fuente"
          >
            <SourceStatePills
              items={[
                { label: 'Modo fallback local', tone: 'fallback' },
                { label: 'Snapshot saneado', tone: 'snapshot' },
                { label: viewModel.state === 'error' ? 'Error/degradado' : 'Fuente no configurada', tone: viewModel.state === 'error' ? 'degraded' : 'not-configured' },
              ]}
            />
          </StatePanel>
        </section>
      ) : null}

      {viewModel.crewRulesDocument ? (
        <section className="section-block">
          <SurfaceCard title={viewModel.crewRulesDocument.title} eyebrow="Canon operativo" accent="sky" elevated>
            <div style={{ display: 'grid', gap: '12px' }}>
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: '10px', flexWrap: 'wrap' }}>
                <div style={{ display: 'grid', gap: '4px' }}>
                  <span style={{ color: appTheme.colors.textSecondary, fontSize: '14px', fontWeight: 700 }}>{viewModel.crewRulesDocument.display_path}</span>
                  <span id="crew-rules-scroll-hint" style={{ color: appTheme.colors.textSecondary, fontSize: '13px' }}>
                    {viewModel.crewRulesDocument.source_label} · {formatLineCount(viewModel.crewRulesDocument.markdown)} líneas · contenido desplazable
                  </span>
                </div>
                <div style={{ display: 'flex', gap: '8px', alignItems: 'center', flexWrap: 'wrap' }}>
                  <span
                    aria-label="Documento en modo solo lectura"
                    style={{
                      border: `1px solid ${appTheme.colors.borderSubtle}`,
                      borderRadius: '999px',
                      padding: '4px 10px',
                      color: appTheme.colors.textSecondary,
                      background: appTheme.colors.bgSurface1,
                      fontSize: '12px',
                      fontWeight: 700,
                    }}
                  >
                    🔒 Solo lectura
                  </span>
                  <StatusBadge status={viewModel.crewRulesDocument.read_only ? 'operativo' : 'revision'} />
                </div>
              </div>

              <pre
                className="canonical-document-viewer"
                aria-describedby="crew-rules-scroll-hint"
                aria-label="Contenido de AGENTS.md canónico de crew-core"
                tabIndex={0}
                style={{
                  margin: 0,
                  maxHeight: '420px',
                  overflow: 'auto',
                  whiteSpace: 'pre-wrap',
                  wordBreak: 'break-word',
                  border: `1px solid ${appTheme.colors.borderSubtle}`,
                  borderRadius: appTheme.radius.md,
                  background: appTheme.colors.bgSurface1,
                  color: appTheme.colors.textPrimary,
                  padding: '16px',
                  fontSize: '13px',
                  lineHeight: 1.65,
                  boxShadow: `inset 0 -18px 24px ${appTheme.colors.bgSurface2}`,
                }}
              >
                {viewModel.crewRulesDocument.markdown}
              </pre>
              <span style={{ color: appTheme.colors.textSecondary, fontSize: '13px' }}>
                Fin de ventana visible: usa scroll dentro del documento para leer el canon completo. Sin edición desde el panel.
              </span>
            </div>
          </SurfaceCard>
        </section>
      ) : null}

      <section className="section-block layout-grid layout-grid--cards-280">
        {viewModel.cards.map((mugiwara) => {
          const profile = getSafeProfile(mugiwara)

          return (
            <SurfaceCard key={mugiwara.slug} title={mugiwara.name} elevated eyebrow="Agente" accent="sky">
              <div style={{ display: 'grid', gap: '12px' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', gap: '10px', flexWrap: 'wrap' }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                    {profile ? <MugiwaraCrest slug={profile.slug} size="md" accent /> : null}
                    <div style={{ display: 'grid', gap: '2px' }}>
                      <span style={{ color: appTheme.colors.textSecondary, fontSize: '13px' }}>slug: {mugiwara.slug}</span>
                      <span style={{ color: appTheme.colors.textMuted, fontSize: '12px' }}>{profile?.role ?? 'Mugiwara'}</span>
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

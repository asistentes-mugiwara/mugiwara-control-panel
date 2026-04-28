import type { ReactNode } from 'react'
import Link from 'next/link'

import type { CrewRulesDocument, MugiwaraCard, SafeLink } from '@contracts/read-models'

import { mapMugiwaraStatusToBadgeStatus } from '@/modules/mugiwaras/view-models/mugiwara-card.mappers'
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

type MarkdownBlock =
  | { type: 'heading'; level: 1 | 2 | 3; text: string }
  | { type: 'paragraph'; text: string }
  | { type: 'list'; ordered: boolean; items: string[] }
  | { type: 'code'; text: string }
  | { type: 'rule' }

function getMugiwarasConfigNotice(error: MugiwarasApiError | null): MugiwarasViewModel {
  return {
    state: 'not_configured',
    cards: mugiwaraCardFixture,
    crewRulesDocument: null,
    notice: {
      status: error?.code === 'invalid_config' ? 'incidencia' : 'revision',
      title: error?.code === 'invalid_config' ? 'Configuración server-only de Mugiwara inválida' : 'Tripulación en modo fallback local',
      description:
        'Mostrando fixture saneado de tripulación. Mantiene la navegación, pero AGENTS.md canónico solo aparece cuando la API allowlisted está conectada mediante MUGIWARA_CONTROL_PANEL_API_URL server-only.',
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

function getSafeHref(href: string): string | null {
  if (href.startsWith('/') && !href.startsWith('//')) return href

  try {
    const parsed = new URL(href)
    return parsed.protocol === 'https:' || parsed.protocol === 'http:' ? href : null
  } catch {
    return null
  }
}

function renderInlineMarkdown(text: string): ReactNode[] {
  const nodes: ReactNode[] = []
  const inlinePattern = /(\[[^\]]+\]\([^\s)]+\)|\*\*[^*]+\*\*|`[^`]+`)/g
  let cursor = 0
  let match: RegExpExecArray | null

  while ((match = inlinePattern.exec(text)) !== null) {
    if (match.index > cursor) nodes.push(text.slice(cursor, match.index))

    const token = match[0]
    const linkMatch = /^\[([^\]]+)\]\(([^\s)]+)\)$/.exec(token)
    if (linkMatch) {
      const safeHref = getSafeHref(linkMatch[2])
      nodes.push(
        safeHref ? (
          <a key={`${match.index}-link`} href={safeHref} style={{ color: appTheme.colors.brandSky500, fontWeight: 700 }}>
            {linkMatch[1]}
          </a>
        ) : (
          linkMatch[1]
        ),
      )
    } else if (token.startsWith('**')) {
      nodes.push(<strong key={`${match.index}-strong`}>{token.slice(2, -2)}</strong>)
    } else if (token.startsWith('`')) {
      nodes.push(
        <code
          key={`${match.index}-code`}
          style={{
            border: `1px solid ${appTheme.colors.borderSubtle}`,
            borderRadius: '6px',
            background: appTheme.colors.bgSurface2,
            padding: '1px 5px',
            fontSize: '0.92em',
          }}
        >
          {token.slice(1, -1)}
        </code>,
      )
    }

    cursor = match.index + token.length
  }

  if (cursor < text.length) nodes.push(text.slice(cursor))
  return nodes
}

function parseConservativeMarkdown(markdown: string): MarkdownBlock[] {
  const blocks: MarkdownBlock[] = []
  const lines = markdown.replace(/\r\n/g, '\n').split('\n')
  let paragraph: string[] = []
  let listItems: string[] = []
  let listOrdered = false
  let codeFence: string[] | null = null

  const flushParagraph = () => {
    if (paragraph.length > 0) {
      blocks.push({ type: 'paragraph', text: paragraph.join(' ') })
      paragraph = []
    }
  }
  const flushList = () => {
    if (listItems.length > 0) {
      blocks.push({ type: 'list', ordered: listOrdered, items: listItems })
      listItems = []
      listOrdered = false
    }
  }

  for (const rawLine of lines) {
    const line = rawLine.trimEnd()

    if (line.trim().startsWith('```')) {
      flushParagraph()
      flushList()
      if (codeFence) {
        blocks.push({ type: 'code', text: codeFence.join('\n') })
        codeFence = null
      } else {
        codeFence = []
      }
      continue
    }

    if (codeFence) {
      codeFence.push(rawLine)
      continue
    }

    if (line.trim() === '') {
      flushParagraph()
      flushList()
      continue
    }

    const headingMatch = /^(#{1,3})\s+(.+)$/.exec(line)
    if (headingMatch) {
      flushParagraph()
      flushList()
      blocks.push({ type: 'heading', level: headingMatch[1].length as 1 | 2 | 3, text: headingMatch[2] })
      continue
    }

    if (/^[-*_]{3,}$/.test(line.trim())) {
      flushParagraph()
      flushList()
      blocks.push({ type: 'rule' })
      continue
    }

    const unorderedMatch = /^[-*+]\s+(.+)$/.exec(line)
    const orderedMatch = /^\d+[.)]\s+(.+)$/.exec(line)
    if (unorderedMatch || orderedMatch) {
      flushParagraph()
      const ordered = Boolean(orderedMatch)
      if (listItems.length > 0 && listOrdered !== ordered) flushList()
      listOrdered = ordered
      listItems.push((unorderedMatch ?? orderedMatch)?.[1] ?? '')
      continue
    }

    flushList()
    paragraph.push(line.trim())
  }

  if (codeFence) blocks.push({ type: 'code', text: codeFence.join('\n') })
  flushParagraph()
  flushList()
  return blocks
}

function MarkdownDocument({ markdown }: { markdown: string }) {
  const blocks = parseConservativeMarkdown(markdown)

  return (
    <div
      className="canonical-document-viewer"
      aria-describedby="crew-rules-scroll-hint"
      aria-label="Contenido de AGENTS.md canónico de crew-core renderizado como Markdown seguro"
      tabIndex={0}
      style={{
        margin: 0,
        maxHeight: '520px',
        overflow: 'auto',
        border: `1px solid ${appTheme.colors.borderSubtle}`,
        borderRadius: appTheme.radius.md,
        background: appTheme.colors.bgSurface1,
        color: appTheme.colors.textPrimary,
        padding: '18px',
        lineHeight: 1.7,
        boxShadow: `inset 0 -18px 24px ${appTheme.colors.bgSurface2}`,
      }}
    >
      {blocks.map((block, index) => {
        if (block.type === 'heading') {
          const Heading = (`h${block.level}` as 'h1' | 'h2' | 'h3')
          return (
            <Heading key={index} style={{ margin: index === 0 ? '0 0 10px' : '20px 0 10px', lineHeight: 1.2 }}>
              {renderInlineMarkdown(block.text)}
            </Heading>
          )
        }
        if (block.type === 'list') {
          const List = block.ordered ? 'ol' : 'ul'
          return (
            <List key={index} style={{ margin: '8px 0 14px', paddingLeft: '22px' }}>
              {block.items.map((item, itemIndex) => (
                <li key={`${index}-${itemIndex}`} style={{ marginBottom: '5px' }}>
                  {renderInlineMarkdown(item)}
                </li>
              ))}
            </List>
          )
        }
        if (block.type === 'code') {
          return (
            <pre
              key={index}
              style={{
                overflowX: 'auto',
                whiteSpace: 'pre-wrap',
                border: `1px solid ${appTheme.colors.borderSubtle}`,
                borderRadius: appTheme.radius.md,
                background: appTheme.colors.bgSurface2,
                padding: '12px',
                fontSize: '13px',
              }}
            >
              <code>{block.text}</code>
            </pre>
          )
        }
        if (block.type === 'rule') {
          return <hr key={index} style={{ border: 0, borderTop: `1px solid ${appTheme.colors.borderSubtle}`, margin: '18px 0' }} />
        }
        return (
          <p key={index} style={{ margin: '0 0 12px', color: appTheme.colors.textSecondary }}>
            {renderInlineMarkdown(block.text)}
          </p>
        )
      })}
    </div>
  )
}

function renderCrewLink(mugiwara: MugiwaraCard, link: SafeLink) {
  return (
    <Link
      key={`${mugiwara.slug}-${link.href}`}
      href={link.href}
      style={{
        display: 'inline-flex',
        alignItems: 'center',
        justifyContent: 'center',
        border: `1px solid ${appTheme.colors.borderSubtle}`,
        borderRadius: '999px',
        background: appTheme.colors.bgSurface1,
        color: appTheme.colors.brandSky500,
        padding: '8px 12px',
        textDecoration: 'none',
        fontSize: '13px',
        fontWeight: 800,
      }}
    >
      {link.label}
    </Link>
  )
}

export default async function MugiwarasPage() {
  const viewModel = await getMugiwarasViewModel()
  const isSnapshotMode = viewModel.state !== 'ready'

  return (
    <>
      <PageHeader
        eyebrow="Mugiwaras"
        title="Tripulación"
        subtitle="Vista de solo lectura de la tripulación, con descripción humana por agente y canon operativo AGENTS.md renderizado como Markdown seguro."
        detailPills={['Índice de tripulación', 'Descripción humana', 'AGENTS.md read-only']}
      />

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

      <section className="section-block layout-grid layout-grid--cards-280">
        {viewModel.cards.map((mugiwara) => {
          const profile = getSafeProfile(mugiwara)

          return (
            <SurfaceCard key={mugiwara.slug} title={mugiwara.name} elevated eyebrow={profile?.role ?? 'Mugiwara'} accent="sky">
              <div style={{ display: 'grid', gap: '14px' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', gap: '10px', flexWrap: 'wrap' }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                    {profile ? <MugiwaraCrest slug={profile.slug} size="md" accent /> : null}
                  </div>
                  <StatusBadge
                    status={mapMugiwaraStatusToBadgeStatus(mugiwara.status)}
                    label={isSnapshotMode && mapMugiwaraStatusToBadgeStatus(mugiwara.status) === 'operativo' ? 'Operativo en último corte' : undefined}
                  />
                </div>

                <p style={{ margin: 0, color: appTheme.colors.textSecondary, fontSize: '15px', lineHeight: 1.6 }}>
                  {mugiwara.description}
                </p>

                <div style={{ display: 'flex', gap: '10px', flexWrap: 'wrap', paddingTop: '2px' }}>
                  {mugiwara.links.map((link) => renderCrewLink(mugiwara, link))}
                </div>
              </div>
            </SurfaceCard>
          )
        })}
      </section>

      {viewModel.crewRulesDocument ? (
        <section className="section-block">
          <SurfaceCard title={viewModel.crewRulesDocument.title} eyebrow="Canon operativo" accent="gold" elevated>
            <div style={{ display: 'grid', gap: '12px' }}>
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: '10px', flexWrap: 'wrap' }}>
                <div style={{ display: 'grid', gap: '4px' }}>
                  <span style={{ color: appTheme.colors.textSecondary, fontSize: '14px', fontWeight: 700 }}>{viewModel.crewRulesDocument.display_path}</span>
                  <span id="crew-rules-scroll-hint" style={{ color: appTheme.colors.textSecondary, fontSize: '13px' }}>
                    {viewModel.crewRulesDocument.source_label} · {formatLineCount(viewModel.crewRulesDocument.markdown)} líneas · Markdown read-only desplazable
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

              <MarkdownDocument markdown={viewModel.crewRulesDocument.markdown} />
              <span style={{ color: appTheme.colors.textSecondary, fontSize: '13px' }}>
                Render Markdown conservador: headings, listas, código, negritas y enlaces seguros. Sin edición desde el panel.
              </span>
            </div>
          </SurfaceCard>
        </section>
      ) : null}
    </>
  )
}

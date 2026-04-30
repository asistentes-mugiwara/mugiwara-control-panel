'use client'

import { useState, type ReactNode } from 'react'
import Link from 'next/link'

import type { MugiwaraCard, SafeLink } from '@contracts/read-models'

import { mapMugiwaraStatusToBadgeStatus } from '@/modules/mugiwaras/view-models/mugiwara-card.mappers'
import { getMugiwaraProfile, isMugiwaraSlug } from '@/shared/mugiwara/crest-map'
import { MugiwaraCrest } from '@/shared/mugiwara/MugiwaraCrest'
import { SurfaceCard } from '@/shared/ui/cards/SurfaceCard'
import { StatusBadge } from '@/shared/ui/status/StatusBadge'
import { appTheme } from '@/shared/theme/tokens'

type MugiwarasClientProps = {
  cards: MugiwaraCard[]
  isSnapshotMode: boolean
}

type MarkdownBlock =
  | { type: 'heading'; level: 1 | 2 | 3; text: string }
  | { type: 'paragraph'; text: string }
  | { type: 'list'; ordered: boolean; items: string[] }
  | { type: 'code'; text: string }
  | { type: 'rule' }

function getSafeProfile(card: MugiwaraCard) {
  return isMugiwaraSlug(card.slug) ? getMugiwaraProfile(card.slug) : null
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

function CompactMarkdownDocument({ markdown, labelId }: { markdown: string; labelId: string }) {
  const blocks = parseConservativeMarkdown(markdown)

  return (
    <div
      className="soul-document-viewer"
      aria-labelledby={labelId}
      tabIndex={0}
      style={{
        maxHeight: '340px',
        overflow: 'auto',
        border: `1px solid ${appTheme.colors.borderSubtle}`,
        borderRadius: appTheme.radius.md,
        background: appTheme.colors.bgSurface1,
        color: appTheme.colors.textPrimary,
        padding: '14px',
        lineHeight: 1.65,
        boxShadow: `inset 0 -14px 20px ${appTheme.colors.bgSurface2}`,
      }}
    >
      {blocks.map((block, index) => {
        if (block.type === 'heading') {
          const Heading = (`h${block.level}` as 'h1' | 'h2' | 'h3')
          return (
            <Heading key={index} style={{ margin: index === 0 ? '0 0 8px' : '16px 0 8px', lineHeight: 1.2, fontSize: block.level === 1 ? '18px' : '16px' }}>
              {renderInlineMarkdown(block.text)}
            </Heading>
          )
        }
        if (block.type === 'list') {
          const List = block.ordered ? 'ol' : 'ul'
          return (
            <List key={index} style={{ margin: '8px 0 12px', paddingLeft: '20px' }}>
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
                padding: '10px',
                fontSize: '12px',
              }}
            >
              <code>{block.text}</code>
            </pre>
          )
        }
        if (block.type === 'rule') {
          return <hr key={index} style={{ border: 0, borderTop: `1px solid ${appTheme.colors.borderSubtle}`, margin: '14px 0' }} />
        }
        return (
          <p key={index} style={{ margin: '0 0 10px', color: appTheme.colors.textSecondary }}>
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

export function MugiwarasClient({ cards, isSnapshotMode }: MugiwarasClientProps) {
  const [openSoulSlug, setOpenSoulSlug] = useState<string | null>(null)

  return (
    <section className="section-block layout-grid layout-grid--cards-280">
      {cards.map((mugiwara) => {
        const profile = getSafeProfile(mugiwara)
        const soulPanelId = `soul-panel-${mugiwara.slug}`
        const soulTitleId = `soul-title-${mugiwara.slug}`
        const isSoulOpen = openSoulSlug === mugiwara.slug
        const hasSoul = Boolean(mugiwara.soul_document?.markdown)

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
                <button
                  type="button"
                  aria-expanded={isSoulOpen}
                  aria-controls={hasSoul ? soulPanelId : undefined}
                  disabled={!hasSoul}
                  onClick={() => setOpenSoulSlug(isSoulOpen ? null : mugiwara.slug)}
                  style={{
                    display: 'inline-flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    border: `1px solid ${isSoulOpen ? appTheme.colors.brandSky500 : appTheme.colors.borderSubtle}`,
                    borderRadius: '999px',
                    background: isSoulOpen ? appTheme.colors.bgSurface2 : appTheme.colors.bgSurface1,
                    color: hasSoul ? appTheme.colors.brandSky500 : appTheme.colors.textMuted,
                    padding: '8px 12px',
                    fontSize: '13px',
                    fontWeight: 800,
                    cursor: hasSoul ? 'pointer' : 'not-allowed',
                  }}
                >
                  SOUL.md
                </button>
              </div>

              {hasSoul && isSoulOpen ? (
                <div id={soulPanelId} style={{ display: 'grid', gap: '8px', minWidth: 0 }}>
                  <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: '8px', flexWrap: 'wrap' }}>
                    <span id={soulTitleId} style={{ color: appTheme.colors.textPrimary, fontSize: '14px', fontWeight: 900 }}>
                      {mugiwara.soul_document?.title}
                    </span>
                    <span style={{ color: appTheme.colors.textSecondary, fontSize: '12px', fontWeight: 700 }}>
                      {mugiwara.soul_document?.display_path} · Solo lectura
                    </span>
                  </div>
                  <CompactMarkdownDocument markdown={mugiwara.soul_document?.markdown ?? ''} labelId={soulTitleId} />
                </div>
              ) : null}
            </div>
          </SurfaceCard>
        )
      })}
    </section>
  )
}

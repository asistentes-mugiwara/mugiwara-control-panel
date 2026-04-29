'use client'

import Link from 'next/link'
import { useMemo, useState, type ReactNode } from 'react'

import type { VaultExplorerNode, VaultExplorerTree, VaultMarkdownDocument } from '@/modules/vault/view-models/vault-explorer.fixture'
import { appTheme } from '@/shared/theme/tokens'
import { PageHeader } from '@/shared/ui/app-shell/PageHeader'
import { StatePanel } from '@/shared/ui/state/StatePanel'
import { SourceStatePills } from '@/shared/ui/status/SourceStatePills'
import { StatusBadge } from '@/shared/ui/status/StatusBadge'

type MarkdownBlock =
  | { type: 'frontmatter'; text: string }
  | { type: 'heading'; level: 1 | 2 | 3 | 4; text: string }
  | { type: 'paragraph'; text: string }
  | { type: 'blockquote'; text: string }
  | { type: 'list'; ordered: boolean; items: string[] }
  | { type: 'code'; text: string }
  | { type: 'rule' }
  | { type: 'table'; headers: string[]; rows: string[][] }

type VaultClientProps = {
  tree: VaultExplorerTree
  document: VaultMarkdownDocument | null
  selectedPath: string | null
  notice: {
    status: 'ready' | 'fallback'
    code?: string
  }
}

function vaultDocumentHref(relativePath: string) {
  return `/vault?path=${encodeURIComponent(relativePath)}`
}

function formatTimestamp(value?: string | null) {
  if (!value) return 'Fecha no disponible'
  const date = new Date(value)
  if (Number.isNaN(date.getTime())) return 'Fecha no disponible'
  return new Intl.DateTimeFormat('es-ES', { dateStyle: 'medium', timeStyle: 'short' }).format(date)
}

function formatBytes(value?: number | null) {
  if (typeof value !== 'number' || !Number.isFinite(value)) return 'Tamaño no disponible'
  if (value < 1024) return `${value} B`
  if (value < 1024 * 1024) return `${(value / 1024).toFixed(1)} KB`
  return `${(value / (1024 * 1024)).toFixed(1)} MB`
}

function isUnsafeText(value: string) {
  const lower = value.toLowerCase()
  return lower.includes('/srv/') || lower.includes('/home/') || lower.includes('mugiwara_control_panel_api_url') || lower.includes('next_public')
}

function safeText(value: string) {
  return isUnsafeText(value) ? 'Contenido saneado' : value
}

function getSafeHref(href: string): string | null {
  const trimmed = href.trim()
  if (!trimmed || /[\u0000-\u001f]/.test(trimmed)) return null
  if (trimmed.startsWith('/') && !trimmed.startsWith('//')) return trimmed
  if (trimmed.startsWith('#')) return trimmed

  try {
    const parsed = new URL(trimmed)
    if (parsed.protocol === 'https:' || parsed.protocol === 'http:') return trimmed
  } catch {
    return null
  }

  return null
}

function renderInlineMarkdown(text: string): ReactNode[] {
  const nodes: ReactNode[] = []
  const inlinePattern = /(\[[^\]]+\]\([^\s)]+\)|\*\*[^*]+\*\*|`[^`]+`)/g
  let cursor = 0
  let match: RegExpExecArray | null

  while ((match = inlinePattern.exec(text)) !== null) {
    if (match.index > cursor) nodes.push(safeText(text.slice(cursor, match.index)))

    const token = match[0]
    const linkMatch = /^\[([^\]]+)\]\(([^\s)]+)\)$/.exec(token)
    if (linkMatch) {
      const safeHref = getSafeHref(linkMatch[2])
      const label = safeText(linkMatch[1])
      nodes.push(
        safeHref ? (
          <a key={`${match.index}-link`} href={safeHref} rel="noreferrer noopener" style={{ color: appTheme.colors.brandSky500, fontWeight: 800 }} target={safeHref.startsWith('http') ? '_blank' : undefined}>
            {label}
          </a>
        ) : (
          label
        ),
      )
    } else if (token.startsWith('**')) {
      nodes.push(<strong key={`${match.index}-strong`}>{safeText(token.slice(2, -2))}</strong>)
    } else if (token.startsWith('`')) {
      nodes.push(<code key={`${match.index}-code`} className="vault-markdown-inline-code">{safeText(token.slice(1, -1))}</code>)
    }

    cursor = match.index + token.length
  }

  if (cursor < text.length) nodes.push(safeText(text.slice(cursor)))
  return nodes
}

function parseTable(lines: string[], start: number) {
  if (start + 1 >= lines.length) return null
  const headerLine = lines[start].trim()
  const separatorLine = lines[start + 1].trim()
  if (!headerLine.includes('|') || !/^\|?\s*:?-{3,}:?\s*(\|\s*:?-{3,}:?\s*)+\|?$/.test(separatorLine)) return null

  const splitRow = (line: string) => line.replace(/^\|/, '').replace(/\|$/, '').split('|').map((cell) => cell.trim())
  const headers = splitRow(headerLine)
  const rows: string[][] = []
  let index = start + 2
  while (index < lines.length && lines[index].includes('|') && lines[index].trim() !== '') {
    rows.push(splitRow(lines[index]))
    index += 1
  }
  return { block: { type: 'table' as const, headers, rows }, nextIndex: index }
}

function parseConservativeMarkdown(markdown: string): MarkdownBlock[] {
  const blocks: MarkdownBlock[] = []
  const lines = markdown.replace(/\r\n/g, '\n').split('\n')
  let paragraph: string[] = []
  let listItems: string[] = []
  let listOrdered = false
  let codeFence: string[] | null = null
  let index = 0

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

  if (lines[0]?.trim() === '---') {
    const closing = lines.slice(1).findIndex((line) => line.trim() === '---')
    if (closing >= 0) {
      blocks.push({ type: 'frontmatter', text: lines.slice(0, closing + 2).join('\n') })
      index = closing + 2
    }
  }

  for (; index < lines.length; index += 1) {
    const rawLine = lines[index]
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

    const table = parseTable(lines, index)
    if (table) {
      flushParagraph()
      flushList()
      blocks.push(table.block)
      index = table.nextIndex - 1
      continue
    }

    const headingMatch = /^(#{1,4})\s+(.+)$/.exec(line)
    if (headingMatch) {
      flushParagraph()
      flushList()
      blocks.push({ type: 'heading', level: headingMatch[1].length as 1 | 2 | 3 | 4, text: headingMatch[2] })
      continue
    }

    if (/^[-*_]{3,}$/.test(line.trim())) {
      flushParagraph()
      flushList()
      blocks.push({ type: 'rule' })
      continue
    }

    const quoteMatch = /^>\s?(.+)$/.exec(line)
    if (quoteMatch) {
      flushParagraph()
      flushList()
      blocks.push({ type: 'blockquote', text: quoteMatch[1] })
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

function MarkdownReader({ markdown }: { markdown: string }) {
  const blocks = useMemo(() => parseConservativeMarkdown(markdown), [markdown])

  if (blocks.length === 0) {
    return <StatePanel eyebrow="Documento vacío" status="sin-datos" title="Markdown sin contenido" description="El documento existe, pero no contiene texto renderizable." />
  }

  return (
    <article className="vault-markdown-reader" aria-label="Documento Markdown renderizado de forma saneada">
      {blocks.map((block, index) => {
        if (block.type === 'frontmatter') {
          return <pre key={index} className="vault-markdown-code vault-markdown-frontmatter"><code>{safeText(block.text)}</code></pre>
        }
        if (block.type === 'heading') {
          const Heading = (`h${block.level}` as 'h1' | 'h2' | 'h3' | 'h4')
          return <Heading key={index}>{renderInlineMarkdown(block.text)}</Heading>
        }
        if (block.type === 'paragraph') {
          return <p key={index}>{renderInlineMarkdown(block.text)}</p>
        }
        if (block.type === 'blockquote') {
          return <blockquote key={index}>{renderInlineMarkdown(block.text)}</blockquote>
        }
        if (block.type === 'list') {
          const List = block.ordered ? 'ol' : 'ul'
          return <List key={index}>{block.items.map((item, itemIndex) => <li key={`${index}-${itemIndex}`}>{renderInlineMarkdown(item)}</li>)}</List>
        }
        if (block.type === 'code') {
          return <pre key={index} className="vault-markdown-code"><code>{safeText(block.text)}</code></pre>
        }
        if (block.type === 'rule') {
          return <hr key={index} />
        }
        return (
          <div key={index} className="vault-markdown-table-wrap">
            <table>
              <thead><tr>{block.headers.map((header, cellIndex) => <th key={cellIndex}>{renderInlineMarkdown(header)}</th>)}</tr></thead>
              <tbody>{block.rows.map((row, rowIndex) => <tr key={rowIndex}>{row.map((cell, cellIndex) => <td key={cellIndex}>{renderInlineMarkdown(cell)}</td>)}</tr>)}</tbody>
            </table>
          </div>
        )
      })}
    </article>
  )
}

function isNodeHidden(node: VaultExplorerNode, collapsedDirectories: Set<string>) {
  const parts = node.relative_path.split('/')
  for (let index = 1; index < parts.length; index += 1) {
    const ancestor = parts.slice(0, index).join('/')
    if (collapsedDirectories.has(ancestor)) return true
  }
  return false
}

function VaultExplorer({ nodes, selectedPath }: { nodes: VaultExplorerNode[]; selectedPath: string | null }) {
  const directoryPaths = useMemo(() => new Set(nodes.filter((node) => node.kind === 'directory').map((node) => node.relative_path)), [nodes])
  const [collapsedDirectories, setCollapsedDirectories] = useState<Set<string>>(new Set())
  const visibleNodes = nodes.filter((node) => !isNodeHidden(node, collapsedDirectories))

  if (nodes.length === 0) {
    return <StatePanel eyebrow="Vault vacío" status="sin-datos" title="No hay documentos visibles" description="El backend no ha devuelto nodos Markdown permitidos para este vault." />
  }

  return (
    <nav className="vault-explorer-tree" aria-label="Explorador de archivos del Vault">
      {visibleNodes.map((node) => {
        const isDirectory = node.kind === 'directory'
        const isCollapsed = collapsedDirectories.has(node.relative_path)
        const isActive = node.relative_path === selectedPath
        const indent = `${8 + node.depth * 18}px`

        if (isDirectory) {
          return (
            <button
              key={node.id}
              type="button"
              className="vault-tree-row vault-tree-row--directory"
              aria-expanded={!isCollapsed}
              onClick={() => {
                setCollapsedDirectories((current) => {
                  const next = new Set(current)
                  if (next.has(node.relative_path)) next.delete(node.relative_path)
                  else next.add(node.relative_path)
                  return next
                })
              }}
              style={{ paddingLeft: indent }}
            >
              <span aria-hidden="true">{isCollapsed ? '▸' : '▾'}</span>
              <span aria-hidden="true">📁</span>
              <span className="vault-tree-row__name">{node.name}</span>
            </button>
          )
        }

        return (
          <Link
            key={node.id}
            className="vault-tree-row vault-tree-row--document"
            data-active={isActive ? 'true' : 'false'}
            href={vaultDocumentHref(node.relative_path)}
            style={{ paddingLeft: indent }}
          >
            <span aria-hidden="true">{directoryPaths.has(node.relative_path) ? '▾' : ' '}</span>
            <span aria-hidden="true">📄</span>
            <span className="vault-tree-row__name">{node.name}</span>
          </Link>
        )
      })}
    </nav>
  )
}

function getFallbackNotice(code?: string) {
  const isNotConfigured = code === 'not_configured'
  return {
    status: isNotConfigured ? ('revision' as const) : ('incidencia' as const),
    title: isNotConfigured ? 'Vault en modo fallback local' : 'Vault en fallback saneado',
    description: isNotConfigured
      ? 'La API privada no está configurada para esta ejecución. Se muestra un snapshot Markdown local saneado, sin lectura real del filesystem.'
      : 'La lectura real del Vault no está disponible. La página conserva el explorador y lector sobre un fallback local sin exponer rutas internas ni errores crudos.',
    detail: code ? `Estado técnico: ${code}` : undefined,
  }
}

export function VaultClient({ tree, document, selectedPath, notice }: VaultClientProps) {
  const apiNotice = notice.status === 'fallback' ? getFallbackNotice(notice.code) : null

  return (
    <>
      <PageHeader eyebrow="Vault" title="Vault · Solo lectura" subtitle="Explorador de archivos del vault canónico y lector Markdown renderizado. Sin edición, sin escritura y sin rutas absolutas del host en la UI." detailPills={['Explorador', 'Markdown saneado', 'Read-only']} />

      {apiNotice ? (
        <div className="section-block">
          <StatePanel status={apiNotice.status} title={apiNotice.title} description={apiNotice.description} detail={apiNotice.detail} eyebrow="Estado de fuente">
            <SourceStatePills items={[{ label: 'Modo fallback local', tone: 'fallback' }, { label: 'Snapshot saneado', tone: 'snapshot' }, { label: 'No tiempo real', tone: 'not-realtime' }]} />
          </StatePanel>
        </div>
      ) : null}

      <section className="layout-grid layout-grid--vault vault-browser-shell" aria-label="Explorador y lector del Vault">
        <aside className="vault-explorer-panel" aria-label="Panel de explorador">
          <div className="vault-panel-header">
            <div>
              <span className="vault-panel-eyebrow">Explorador</span>
              <h2>Archivos</h2>
            </div>
            <StatusBadge status={tree.limits.nodes_truncated ? 'revision' : 'operativo'} label={tree.limits.nodes_truncated ? 'Truncado' : 'Read-only'} />
          </div>
          <VaultExplorer nodes={tree.nodes} selectedPath={selectedPath} />
        </aside>

        <main className="vault-reader-panel" aria-label="Lector Markdown">
          {document ? (
            <>
              <div className="vault-reader-header">
                <div>
                  <span className="vault-panel-eyebrow">Documento seleccionado</span>
                  <h2>{document.name}</h2>
                  <p>{document.relative_path}</p>
                </div>
                <div className="vault-reader-meta" aria-label="Metadata mínima segura del documento">
                  <span>{formatBytes(document.size_bytes)}</span>
                  <span>{formatTimestamp(document.updated_at)}</span>
                  <span>Solo lectura</span>
                </div>
              </div>
              <MarkdownReader markdown={document.markdown} />
            </>
          ) : (
            <StatePanel eyebrow="Sin selección" status="sin-datos" title="Selecciona un documento Markdown" description="El explorador no tiene todavía un documento activo. El lector permanece vacío sin intentar acceder al filesystem desde el navegador." />
          )}
        </main>
      </section>
    </>
  )
}

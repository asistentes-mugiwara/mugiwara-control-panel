'use client'

import { useMemo, useState } from 'react'

import { vaultWorkspaceFixture } from '@/modules/vault/view-models/vault-workspace.fixture'
import { PageHeader } from '@/shared/ui/app-shell/PageHeader'
import { SurfaceCard } from '@/shared/ui/cards/SurfaceCard'
import { StatusBadge } from '@/shared/ui/status/StatusBadge'
import { appTheme } from '@/shared/theme/tokens'

function getVaultFreshnessStatus(state: 'fresh' | 'stale') {
  return state === 'stale' ? 'stale' : 'operativo'
}

function formatTimestamp(value: string) {
  const date = new Date(value)

  if (Number.isNaN(date.getTime())) {
    return value
  }

  return new Intl.DateTimeFormat('es-ES', {
    dateStyle: 'short',
    timeStyle: 'short',
  }).format(date)
}

export default function VaultPage() {
  const workspace = vaultWorkspaceFixture
  const [selectedDocumentId, setSelectedDocumentId] = useState(workspace.active_document_id)

  const activeDocument = useMemo(
    () => workspace.documents.find((document) => document.id === selectedDocumentId) ?? workspace.documents[0],
    [selectedDocumentId, workspace.documents],
  )

  return (
    <>
      <PageHeader
        eyebrow="Vault"
        title="Vault"
        subtitle="Lectura documental y editorial del canon curado, con árbol allowlisted, documento legible y metadatos visibles."
      />

      <section
        style={{
          display: 'grid',
          gap: '14px',
          gridTemplateColumns: 'minmax(260px, 320px) minmax(0, 1fr) minmax(260px, 320px)',
          alignItems: 'start',
        }}
      >
        <div style={{ display: 'grid', gap: '14px' }}>
          <SurfaceCard title="Canon curado" elevated>
            <div style={{ display: 'grid', gap: '10px' }}>
              <p style={{ margin: 0, color: appTheme.colors.textSecondary }}>
                Vault es una capa editorial y navegable. Resume decisiones duraderas y project summaries; no funciona como memoria operativa por fuente.
              </p>
              <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap' }}>
                <StatusBadge status={getVaultFreshnessStatus(workspace.freshness.state)} />
                <span style={{ color: appTheme.colors.textSecondary, fontSize: '13px' }}>{workspace.freshness.label}</span>
              </div>
              <span style={{ color: appTheme.colors.textMuted, fontSize: '13px' }}>
                Última actualización: {formatTimestamp(workspace.freshness.updated_at)}
              </span>
            </div>
          </SurfaceCard>

          <SurfaceCard title="Índice allowlisted" elevated>
            <div id="vault-tree" style={{ display: 'grid', gap: '8px' }}>
              {workspace.tree.map((entry) => {
                const isActive = entry.id === activeDocument.id
                const isSelectable = entry.kind === 'document'

                return (
                  <button
                    key={entry.id}
                    type="button"
                    onClick={() => {
                      if (isSelectable) {
                        setSelectedDocumentId(entry.id)
                      }
                    }}
                    disabled={!isSelectable}
                    style={{
                      textAlign: 'left',
                      borderRadius: '12px',
                      padding: '12px',
                      cursor: isSelectable ? 'pointer' : 'default',
                      border: `1px solid ${isActive ? appTheme.colors.brandSky500 : appTheme.colors.borderSubtle}`,
                      background: isActive ? appTheme.colors.bgSurface2 : appTheme.colors.bgSurface1,
                      color: appTheme.colors.textPrimary,
                      display: 'grid',
                      gap: '6px',
                      paddingLeft: `${12 + entry.depth * 18}px`,
                      opacity: isSelectable ? 1 : 0.9,
                    }}
                  >
                    <div style={{ display: 'flex', justifyContent: 'space-between', gap: '10px', flexWrap: 'wrap' }}>
                      <strong>{entry.label}</strong>
                      <StatusBadge status={entry.kind === 'directory' ? 'revision' : 'operativo'} />
                    </div>
                    <span style={{ color: appTheme.colors.textMuted, fontSize: '12px' }}>{entry.path_segment}</span>
                    <span style={{ color: appTheme.colors.textSecondary, fontSize: '13px' }}>{entry.summary}</span>
                  </button>
                )
              })}
            </div>
          </SurfaceCard>
        </div>

        <div style={{ display: 'grid', gap: '14px' }}>
          <SurfaceCard title="Documento" elevated>
            <div style={{ display: 'grid', gap: '14px' }}>
              <nav aria-label="Breadcrumbs de Vault" style={{ display: 'flex', gap: '8px', flexWrap: 'wrap' }}>
                {activeDocument.breadcrumbs.map((breadcrumb, index) => (
                  <span key={breadcrumb.href} style={{ color: appTheme.colors.textSecondary, fontSize: '13px' }}>
                    <a href={breadcrumb.href} style={{ color: appTheme.colors.brandSky500, textDecoration: 'none' }}>
                      {breadcrumb.label}
                    </a>
                    {index < activeDocument.breadcrumbs.length - 1 ? ' / ' : ''}
                  </span>
                ))}
              </nav>

              <div style={{ display: 'grid', gap: '6px' }}>
                <strong style={{ fontSize: '22px' }}>{activeDocument.title}</strong>
                <p style={{ margin: 0, color: appTheme.colors.textSecondary }}>{activeDocument.summary}</p>
              </div>

              <div
                style={{
                  borderRadius: '12px',
                  border: `1px solid ${appTheme.colors.borderSubtle}`,
                  background: appTheme.colors.bgSurface1,
                  padding: '12px',
                  color: appTheme.colors.textSecondary,
                }}
              >
                {activeDocument.canon_callout}
              </div>

              <article style={{ display: 'grid', gap: '16px' }}>
                {activeDocument.sections.map((section) => (
                  <section key={section.heading}>
                    <h3 style={{ marginTop: 0, marginBottom: '10px', fontSize: '18px' }}>{section.heading}</h3>
                    <div style={{ display: 'grid', gap: '10px' }}>
                      {section.body.map((paragraph) => (
                        <p key={paragraph} style={{ margin: 0, color: appTheme.colors.textSecondary, lineHeight: 1.6 }}>
                          {paragraph}
                        </p>
                      ))}
                    </div>
                  </section>
                ))}
              </article>
            </div>
          </SurfaceCard>
        </div>

        <div style={{ display: 'grid', gap: '14px' }}>
          <SurfaceCard title="Metadatos" elevated>
            <div style={{ display: 'grid', gap: '10px' }}>
              <div style={{ display: 'grid', gap: '6px' }}>
                <span style={{ color: appTheme.colors.textMuted, fontSize: '13px' }}>Path</span>
                <code
                  style={{
                    padding: '10px',
                    borderRadius: '12px',
                    background: appTheme.colors.bgSurface1,
                    color: appTheme.colors.textSecondary,
                    overflowX: 'auto',
                  }}
                >
                  {activeDocument.meta.path}
                </code>
              </div>

              <span style={{ color: appTheme.colors.textSecondary, fontSize: '13px' }}>
                Updated at: {formatTimestamp(activeDocument.meta.updated_at)}
              </span>
              <span style={{ color: appTheme.colors.textSecondary, fontSize: '13px' }}>{activeDocument.meta.context}</span>
            </div>
          </SurfaceCard>

          <SurfaceCard title="TOC" elevated>
            <div style={{ display: 'grid', gap: '8px' }}>
              {activeDocument.meta.toc.map((item) => (
                <div
                  key={item}
                  style={{
                    borderRadius: '12px',
                    padding: '10px 12px',
                    border: `1px solid ${appTheme.colors.borderSubtle}`,
                    color: appTheme.colors.textSecondary,
                    background: appTheme.colors.bgSurface1,
                  }}
                >
                  {item}
                </div>
              ))}
            </div>
          </SurfaceCard>
        </div>
      </section>
    </>
  )
}

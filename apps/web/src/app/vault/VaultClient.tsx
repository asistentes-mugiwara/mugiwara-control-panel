'use client'

import { useMemo, useState } from 'react'

import type { VaultWorkspace } from '@/modules/vault/view-models/vault-workspace.fixture'
import { PageHeader } from '@/shared/ui/app-shell/PageHeader'
import { SurfaceCard } from '@/shared/ui/cards/SurfaceCard'
import { StatePanel } from '@/shared/ui/state/StatePanel'
import { SourceStatePills } from '@/shared/ui/status/SourceStatePills'
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

type VaultClientProps = {
  initialWorkspace: VaultWorkspace
  apiState: 'ready' | 'fallback'
  apiErrorCode?: string
}

function getVaultApiNotice(apiState: VaultClientProps['apiState'], apiErrorCode?: string) {
  if (apiState === 'ready') {
    return null
  }

  const isNotConfigured = apiErrorCode === 'not_configured'

  return {
    status: isNotConfigured ? ('revision' as const) : ('incidencia' as const),
    title: isNotConfigured ? 'Vault en modo fallback local' : 'Vault en fallback saneado',
    description: isNotConfigured
      ? 'Mostrando snapshot documental local saneado. Mantiene la navegación del canon, pero no representa lectura real ni tiempo real de la API.'
      : 'La carga real del Vault no está disponible y la página muestra un fallback documental local. Este estado degradado queda visible sin exponer rutas internas ni detalles del backend.',
    detail: apiErrorCode ? `Estado técnico: ${apiErrorCode}` : null,
  }
}

export function VaultClient({ initialWorkspace, apiState, apiErrorCode }: VaultClientProps) {
  const workspace = initialWorkspace
  const [selectedDocumentId, setSelectedDocumentId] = useState(workspace.active_document_id)
  const apiNotice = getVaultApiNotice(apiState, apiErrorCode)

  const activeDocument = useMemo(
    () => workspace.documents.find((document) => document.id === selectedDocumentId) ?? workspace.documents[0],
    [selectedDocumentId, workspace.documents],
  )

  const freshnessNotice =
    workspace.freshness.state === 'stale'
      ? {
          status: 'stale' as const,
          title: 'Índice documental desactualizado',
          description: 'El vault sigue siendo navegable, pero la frescura del índice no es la ideal. Conviene ejecutar el refresco canónico antes de tratarlo como snapshot reciente.',
          detail: workspace.freshness.label,
        }
      : null

  return (
    <>
      <PageHeader
        eyebrow="Vault"
        title="Vault"
        subtitle="Lectura documental y editorial del canon curado, con árbol allowlisted, documento legible y metadatos visibles."
        mugiwaraSlug="robin"
        detailPills={['Canon curado', 'Lectura editorial', 'Sin memoria viva']}
      />

      <section className="layout-grid layout-grid--vault">
        <div style={{ display: 'grid', gap: '14px' }}>
          {apiNotice ? (
            <StatePanel
              status={apiNotice.status}
              title={apiNotice.title}
              description={apiNotice.description}
              detail={apiNotice.detail}
              eyebrow="Estado de fuente"
            >
              <SourceStatePills
                items={[
                  { label: 'Modo fallback local', tone: 'fallback' },
                  { label: 'Snapshot saneado', tone: 'snapshot' },
                  { label: 'No tiempo real', tone: 'not-realtime' },
                ]}
              />
            </StatePanel>
          ) : null}

          <SurfaceCard title="Canon curado" elevated eyebrow="Archivo" accent="gold">
            <div style={{ display: 'grid', gap: '10px' }}>
              <p style={{ margin: 0, color: appTheme.colors.textSecondary }}>
                Vault es una capa editorial y navegable. Resume decisiones duraderas y project summaries; no funciona como memoria operativa por fuente.
              </p>
              <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap' }}>
                <StatusBadge status={getVaultFreshnessStatus(workspace.freshness.state)} />
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
                    fontWeight: 700,
                  }}
                >
                  Solo lectura documental
                </span>
                <span style={{ color: appTheme.colors.textSecondary, fontSize: '13px' }}>{workspace.freshness.label}</span>
              </div>
              <span style={{ color: appTheme.colors.textMuted, fontSize: '13px' }}>
                Última actualización: {formatTimestamp(workspace.freshness.updated_at)}
              </span>
              {freshnessNotice ? (
                <StatePanel
                  status={freshnessNotice.status}
                  title={freshnessNotice.title}
                  description={freshnessNotice.description}
                  detail={freshnessNotice.detail}
                  eyebrow="Estado documental"
                />
              ) : null}
            </div>
          </SurfaceCard>

          <SurfaceCard title="Índice allowlisted" elevated eyebrow="Mapa" accent="sky">
            <div id="vault-tree" style={{ display: 'grid', gap: '8px' }}>
              {workspace.tree.length > 0 ? (
                workspace.tree.map((entry) => {
                  const isActive = entry.id === activeDocument?.id
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
                      aria-pressed={isSelectable ? isActive : undefined}
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
                })
              ) : (
                <StatePanel
                  status="sin-datos"
                  title="Índice sin entradas allowlisted"
                  description="No hay nodos visibles en el árbol documental. La página debe seguir mostrando el shell y el contexto editorial sin romper la navegación."
                  eyebrow="Estado vacío"
                />
              )}
            </div>
          </SurfaceCard>
        </div>

        <div style={{ display: 'grid', gap: '14px' }}>
          <SurfaceCard title="Documento" elevated eyebrow="Pieza canónica" accent="gold">
            {activeDocument ? (
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

                {activeDocument.sections.length > 0 ? (
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
                ) : (
                  <StatePanel
                    status="sin-datos"
                    title="Documento sin secciones visibles"
                    description="El documento activo no contiene bloques editoriales publicados todavía. La superficie debe seguir siendo estable aunque falte cuerpo documental."
                    eyebrow="Estado vacío"
                  />
                )}
              </div>
            ) : (
              <StatePanel
                status="sin-datos"
                title="Sin documento activo"
                description="No hay un documento allowlisted listo para renderizar. La navegación lateral puede seguir disponible mientras llega contenido canónico."
                eyebrow="Estado vacío"
              />
            )}
          </SurfaceCard>
        </div>

        <div style={{ display: 'grid', gap: '14px' }}>
          <SurfaceCard title="Metadatos" elevated eyebrow="Ficha" accent="sky">
            {activeDocument ? (
              <div style={{ display: 'grid', gap: '10px' }}>
                <div style={{ display: 'grid', gap: '6px' }}>
                  <span style={{ color: appTheme.colors.textMuted, fontSize: '13px' }}>Path</span>
                  <code
                    className="responsive-code"
                    style={{
                      padding: '10px',
                      borderRadius: '12px',
                      background: appTheme.colors.bgSurface1,
                      color: appTheme.colors.textSecondary,
                    }}
                  >
                    {activeDocument.meta.path}
                  </code>
                </div>

                <span style={{ color: appTheme.colors.textSecondary, fontSize: '13px' }}>
                  Actualizado: {formatTimestamp(activeDocument.meta.updated_at)}
                </span>
                <span style={{ color: appTheme.colors.textSecondary, fontSize: '13px' }}>{activeDocument.meta.context}</span>
              </div>
            ) : (
              <StatePanel
                status="sin-datos"
                title="Metadatos no disponibles"
                description="La ficha documental aún no tiene un documento activo del que extraer path, fecha o contexto."
                eyebrow="Estado vacío"
              />
            )}
          </SurfaceCard>

          <SurfaceCard title="TOC" elevated eyebrow="Índice" accent="gold">
            {activeDocument && activeDocument.meta.toc.length > 0 ? (
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
            ) : (
              <StatePanel
                status="sin-datos"
                title="TOC sin entradas"
                description="No hay tabla de contenidos visible para el documento activo. El panel debe expresar el vacío con claridad en lugar de quedarse en blanco."
                eyebrow="Estado vacío"
              />
            )}
          </SurfaceCard>
        </div>
      </section>
    </>
  )
}

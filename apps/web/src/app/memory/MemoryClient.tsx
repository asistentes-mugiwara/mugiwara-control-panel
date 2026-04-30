'use client'

import { useState } from 'react'

import type { MemoryAgentDetail as ApiMemoryAgentDetail, MemoryAgentSummary as ApiMemoryAgentSummary, MemoryDocument } from '@contracts/read-models'
import { memoryAgentSummaryFixture } from '@/modules/memory/view-models/memory-agent-summary.fixture'
import { getMugiwaraProfile, MUGIWARA_SLUGS, type MugiwaraSlug } from '@/shared/mugiwara/crest-map'
import { MugiwaraCrest } from '@/shared/mugiwara/MugiwaraCrest'
import { PageHeader } from '@/shared/ui/app-shell/PageHeader'
import { SurfaceCard } from '@/shared/ui/cards/SurfaceCard'
import { StatePanel } from '@/shared/ui/state/StatePanel'
import { StatusBadge } from '@/shared/ui/status/StatusBadge'
import { appTheme, type AppStatus } from '@/shared/theme/tokens'

function formatTimestamp(value: string | null) {
  if (!value) {
    return 'sin fecha'
  }

  const date = new Date(value)

  if (Number.isNaN(date.getTime())) {
    return value
  }

  return new Intl.DateTimeFormat('es-ES', {
    dateStyle: 'short',
    timeStyle: 'short',
  }).format(date)
}

function formatSize(value: number | null) {
  if (value === null) {
    return 'sin tamaño'
  }

  if (value < 1024) {
    return `${value} B`
  }

  return `${(value / 1024).toFixed(1)} KB`
}

function mapDocumentStatusToAppStatus(status: MemoryDocument['status'] | 'fallback'): AppStatus {
  switch (status) {
    case 'available':
      return 'operativo'
    case 'empty':
      return 'sin-datos'
    case 'absent':
      return 'revision'
    case 'error':
      return 'incidencia'
    case 'fallback':
    default:
      return 'stale'
  }
}

function getDocumentNotice(document: MemoryDocument | null, mugiwaraName: string) {
  if (!document) {
    return {
      status: 'stale' as AppStatus,
      title: 'MEMORY.md no cargado desde API',
      description: `No hay lectura real de MEMORY.md para ${mugiwaraName}. La página mantiene solo el selector allowlisted y el resumen saneado.`,
      detail: 'Configura MUGIWARA_CONTROL_PANEL_API_URL en el runtime server-only para lectura real.',
    }
  }

  if (document.status === 'available') {
    return null
  }

  if (document.status === 'empty') {
    return {
      status: 'sin-datos' as AppStatus,
      title: 'MEMORY.md vacío',
      description: `El fichero MEMORY.md de ${mugiwaraName} existe, pero no contiene texto visible.`,
      detail: document.message,
    }
  }

  if (document.status === 'absent') {
    return {
      status: 'revision' as AppStatus,
      title: 'MEMORY.md ausente',
      description: `No se ha encontrado MEMORY.md para ${mugiwaraName} dentro del catálogo allowlisted del backend.`,
      detail: document.message,
    }
  }

  return {
    status: 'incidencia' as AppStatus,
    title: 'MEMORY.md no legible',
    description: `El backend no puede leer MEMORY.md para ${mugiwaraName} sin exponer detalles internos del host.`,
    detail: document.message,
  }
}

export type MemoryPageNotice = { status: AppStatus; title: string; description: string; detail?: string }

type MemoryClientProps = {
  apiSummaries: ApiMemoryAgentSummary[] | null
  apiDetails: Partial<Record<MugiwaraSlug, ApiMemoryAgentDetail>>
  apiState: 'ready' | 'fallback'
  apiNotice: MemoryPageNotice | null
}

export function MemoryClient({ apiSummaries, apiDetails, apiState, apiNotice }: MemoryClientProps) {
  const [selectedMugiwara, setSelectedMugiwara] = useState<MugiwaraSlug>('zoro')
  const summaries = apiSummaries ?? memoryAgentSummaryFixture
  const selectedProfile = getMugiwaraProfile(selectedMugiwara)
  const selectedSummary = summaries.find((item) => item.mugiwara_slug === selectedMugiwara)
  const selectedDetail = apiDetails[selectedMugiwara] ?? null
  const document = selectedDetail?.memory_document ?? null
  const documentNotice = getDocumentNotice(document, selectedProfile.name)

  return (
    <>
      <PageHeader
        eyebrow="Memory"
        title="MEMORY.md por Mugiwara"
        subtitle="Selector allowlisted y visor read-only del MEMORY.md builtin de cada perfil. Sin Honcho, sin Vault, sin Engram y sin rutas internas visibles."
        detailPills={[apiState === 'ready' ? 'API solo lectura' : 'Fallback saneado', 'Allowlist cerrada', 'Markdown read-only']}
      />

      {apiNotice ? (
        <section className="section-block">
          <StatePanel
            status={apiNotice.status}
            title={apiNotice.title}
            description={apiNotice.description}
            detail={apiNotice.detail}
            eyebrow="Estado de API"
          />
        </section>
      ) : null}

      <section className="layout-grid layout-grid--sidebar-detail">
        <aside style={{ display: 'grid', gap: '14px' }}>
          <SurfaceCard title="Selector de Mugiwara" elevated eyebrow="Tripulación" accent="gold">
            <div style={{ display: 'grid', gap: '10px' }}>
              {MUGIWARA_SLUGS.map((slug) => {
                const profile = getMugiwaraProfile(slug)
                const summary = summaries.find((item) => item.mugiwara_slug === slug)
                const detail = apiDetails[slug]
                const status = mapDocumentStatusToAppStatus(detail?.memory_document.status ?? 'fallback')
                const isSelected = slug === selectedMugiwara

                return (
                  <button
                    key={slug}
                    type="button"
                    onClick={() => setSelectedMugiwara(slug)}
                    aria-pressed={isSelected}
                    style={{
                      textAlign: 'left',
                      borderRadius: '12px',
                      padding: '12px',
                      cursor: 'pointer',
                      border: `1px solid ${isSelected ? appTheme.colors.brandSky500 : appTheme.colors.borderSubtle}`,
                      background: isSelected ? appTheme.colors.bgSurface2 : appTheme.colors.bgSurface1,
                      color: appTheme.colors.textPrimary,
                      display: 'grid',
                      gap: '8px',
                    }}
                  >
                    <div style={{ display: 'flex', justifyContent: 'space-between', gap: '10px', alignItems: 'center' }}>
                      <div style={{ display: 'flex', gap: '10px', alignItems: 'center' }}>
                        <MugiwaraCrest slug={slug} size="sm" accent={isSelected} />
                        <div style={{ display: 'grid', gap: '2px' }}>
                          <strong>{profile.name}</strong>
                          <span style={{ color: appTheme.colors.textMuted, fontSize: '12px' }}>{profile.role}</span>
                        </div>
                      </div>
                      <StatusBadge status={status} />
                    </div>
                    <span style={{ color: appTheme.colors.textSecondary, fontSize: '13px' }}>
                      {summary?.summary ?? 'Sin resumen cargado.'}
                    </span>
                    <span style={{ color: appTheme.colors.textMuted, fontSize: '12px' }}>
                      {detail?.memory_document.display_path ?? `${slug}/MEMORY.md`} · {detail?.memory_document.message ?? 'lectura real no disponible'}
                    </span>
                  </button>
                )
              })}
            </div>
          </SurfaceCard>
        </aside>

        <section aria-labelledby="memory-document-heading" style={{ display: 'grid', gap: '14px' }}>
          <h2
            id="memory-document-heading"
            style={{
              position: 'absolute',
              width: '1px',
              height: '1px',
              padding: 0,
              margin: '-1px',
              overflow: 'hidden',
              clip: 'rect(0, 0, 0, 0)',
              whiteSpace: 'nowrap',
              border: 0,
            }}
          >
            Documento MEMORY.md seleccionado
          </h2>
          <SurfaceCard title="Estado del documento" elevated eyebrow="Read-only" accent="sky">
            <div style={{ display: 'grid', gap: '12px' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', gap: '12px', flexWrap: 'wrap', alignItems: 'center' }}>
                <div style={{ display: 'flex', gap: '12px', alignItems: 'center' }}>
                  <MugiwaraCrest slug={selectedMugiwara} size="md" accent />
                  <div style={{ display: 'grid', gap: '2px' }}>
                    <strong style={{ fontSize: '18px' }}>{selectedProfile.name}</strong>
                    <span style={{ color: appTheme.colors.textMuted, fontSize: '13px' }}>{selectedProfile.role}</span>
                  </div>
                </div>
                <StatusBadge status={mapDocumentStatusToAppStatus(document?.status ?? 'fallback')} />
              </div>

              <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap' }}>
                <span style={pillStyle}>Path seguro: {document?.display_path ?? `${selectedMugiwara}/MEMORY.md`}</span>
                <span style={pillStyle}>Solo lectura</span>
                <span style={pillStyle}>Actualizado: {formatTimestamp(document?.updated_at ?? null)}</span>
                <span style={pillStyle}>Tamaño: {formatSize(document?.size_bytes ?? null)}</span>
              </div>

              <p style={{ margin: 0, color: appTheme.colors.textSecondary }}>
                {document?.message ?? 'La vista conserva el fallback saneado hasta que la API privada esté disponible en runtime server-only.'}
              </p>
            </div>
          </SurfaceCard>

          {documentNotice ? (
            <StatePanel
              status={documentNotice.status}
              title={documentNotice.title}
              description={documentNotice.description}
              detail={documentNotice.detail}
              eyebrow="Estado del fichero"
            />
          ) : null}

          <SurfaceCard title="Visor MEMORY.md" elevated eyebrow="Markdown" accent="gold">
            {document?.markdown ? (
              <article aria-label={`MEMORY.md de ${selectedProfile.name}`} style={{ display: 'grid', gap: '10px' }}>
                <pre
                  style={{
                    margin: 0,
                    whiteSpace: 'pre-wrap',
                    overflowWrap: 'anywhere',
                    color: appTheme.colors.textSecondary,
                    background: appTheme.colors.bgSurface1,
                    border: `1px solid ${appTheme.colors.borderSubtle}`,
                    borderRadius: '14px',
                    padding: '16px',
                    lineHeight: 1.55,
                    maxHeight: '62vh',
                    overflow: 'auto',
                    fontFamily: 'var(--font-geist-mono), ui-monospace, SFMono-Regular, Menlo, Monaco, Consolas, monospace',
                    fontSize: '13px',
                  }}
                >
                  {document.markdown}
                </pre>
              </article>
            ) : (
              <StatePanel
                status={documentNotice?.status ?? 'sin-datos'}
                title="Sin contenido Markdown visible"
                description="El visor queda vacío sin intentar leer rutas desde el navegador ni mostrar errores crudos."
                detail={document?.message}
                eyebrow="Visor vacío"
              />
            )}
          </SurfaceCard>
        </section>
      </section>
    </>
  )
}

const pillStyle = {
  display: 'inline-flex',
  alignItems: 'center',
  borderRadius: '999px',
  padding: '4px 10px',
  background: appTheme.colors.bgSurface1,
  border: `1px solid ${appTheme.colors.borderSubtle}`,
  color: appTheme.colors.textSecondary,
  fontSize: '12px',
  fontWeight: 700,
} as const

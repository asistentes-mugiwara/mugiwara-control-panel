'use client'

import { useState } from 'react'

import type { MemoryAgentDetail as ApiMemoryAgentDetail, MemoryAgentSummary as ApiMemoryAgentSummary } from '@contracts/read-models'
import { memoryAgentDetailFixture, type MemoryAgentDetail, type MemorySourceKey, type MemorySourceSnapshot, type MemorySourceState } from '@/modules/memory/view-models/memory-agent-detail.fixture'
import { memoryAgentSummaryFixture } from '@/modules/memory/view-models/memory-agent-summary.fixture'
import { getMugiwaraProfile, MUGIWARA_SLUGS, type MugiwaraSlug } from '@/shared/mugiwara/crest-map'
import { MugiwaraCrest } from '@/shared/mugiwara/MugiwaraCrest'
import { PageHeader } from '@/shared/ui/app-shell/PageHeader'
import { SurfaceCard } from '@/shared/ui/cards/SurfaceCard'
import { StatePanel } from '@/shared/ui/state/StatePanel'
import { SourceStatePills } from '@/shared/ui/status/SourceStatePills'
import { StatusBadge } from '@/shared/ui/status/StatusBadge'
import { appTheme, type AppStatus } from '@/shared/theme/tokens'

const sourceLabelMap: Record<MemorySourceKey, string> = {
  'built-in': 'Built-in',
  honcho: 'Honcho',
}

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

function mapSourceStateToStatus(state: MemorySourceState): AppStatus {
  switch (state) {
    case 'initialized':
      return 'operativo'
    case 'stale':
      return 'stale'
    case 'error':
      return 'incidencia'
    case 'unavailable':
    default:
      return 'sin-datos'
  }
}

function mapFreshnessToSourceState(status: ApiMemoryAgentDetail['freshness']['status']): MemorySourceState {
  switch (status) {
    case 'fresh':
      return 'initialized'
    case 'stale':
      return 'stale'
    case 'unknown':
    default:
      return 'unavailable'
  }
}

function mapApiDetailToViewModel(detail: ApiMemoryAgentDetail): MemoryAgentDetail {
  const sourceState = mapFreshnessToSourceState(detail.freshness.status)
  const updatedAt = detail.freshness.updated_at ?? new Date(0).toISOString()

  return {
    mugiwara_slug: detail.mugiwara_slug as MugiwaraSlug,
    built_in: {
      state: sourceState,
      updated_at: updatedAt,
      summary: detail.built_in_summary,
      availability: detail.freshness.source_label ?? 'Resumen built-in saneado desde API.',
      facts: detail.built_in_summary ? [detail.built_in_summary] : [],
    },
    honcho: {
      state: detail.honcho_facts.length > 0 ? sourceState : 'unavailable',
      updated_at: updatedAt,
      summary: detail.honcho_facts.length > 0 ? 'Facts Honcho resumidos y allowlisted desde API.' : 'Sin facts Honcho resumidos disponibles.',
      availability: detail.honcho_facts.length > 0 ? 'Resumen Honcho saneado desde API.' : 'Honcho no configurado para esta vista saneada.',
      facts: detail.honcho_facts,
    },
  }
}

function getMemoryStateNotice(snapshot: MemorySourceSnapshot, sourceLabel: string, mugiwaraName: string) {
  switch (snapshot.state) {
    case 'stale':
      return {
        status: 'stale' as const,
        title: `${sourceLabel} disponible pero desactualizada`,
        description: `La fuente sigue siendo legible para ${mugiwaraName}, pero conviene refrescarla antes de usarla como referencia operativa fuerte.`,
        detail: snapshot.availability,
      }
    case 'error':
      return {
        status: 'incidencia' as const,
        title: `${sourceLabel} con incidencia activa`,
        description: `La última sincronización de ${sourceLabel} falló para ${mugiwaraName}. La lectura actual no debe tomarse como síntesis fiable hasta reintentar la generación.`,
        detail: snapshot.availability,
      }
    case 'unavailable':
      return {
        status: 'sin-datos' as const,
        title: `${sourceLabel} todavía no inicializada`,
        description: `No hay contexto suficiente para mostrar una vista completa de ${sourceLabel} en ${mugiwaraName}. El resto del workspace debe seguir siendo navegable sin romper la superficie.`,
        detail: snapshot.availability,
      }
    case 'initialized':
    default:
      return null
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
  const [selectedSource, setSelectedSource] = useState<MemorySourceKey>('built-in')

  const summaries = apiSummaries ?? memoryAgentSummaryFixture
  const selectedApiDetail = apiDetails[selectedMugiwara]
  const selectedDetail = selectedApiDetail
    ? mapApiDetailToViewModel(selectedApiDetail)
    : memoryAgentDetailFixture.find((item) => item.mugiwara_slug === selectedMugiwara) ?? memoryAgentDetailFixture[0]

  const selectedSnapshot = selectedSource === 'built-in' ? selectedDetail.built_in : selectedDetail.honcho
  const selectedProfile = getMugiwaraProfile(selectedMugiwara)
  const selectedSummary = summaries.find((item) => item.mugiwara_slug === selectedMugiwara)
  const selectedBadges = selectedSummary?.badges ?? []
  const sourceNotice = getMemoryStateNotice(selectedSnapshot, sourceLabelMap[selectedSource], selectedProfile.name)
  const isSnapshotMode = apiState !== 'ready'

  return (
    <>
      <PageHeader
        eyebrow="Memory"
        title="Memoria operativa"
        subtitle="Selector por Mugiwara, tabs Built-in/Honcho y lectura resumida de fuente, manteniendo separación explícita respecto a Vault."
        mugiwaraSlug="robin"
        detailPills={['Continuidad viva', 'Fuentes separadas', apiState === 'ready' ? 'API solo lectura' : 'Fallback saneado']}
      />

      {apiNotice ? (
        <section className="section-block">
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
        </section>
      ) : null}

      <section className="layout-grid layout-grid--sidebar-detail">
        <div style={{ display: 'grid', gap: '14px' }}>
          <SurfaceCard title="Memoria operativa" elevated eyebrow="Contexto" accent="sky">
            <div style={{ display: 'grid', gap: '10px' }}>
              <p style={{ margin: 0, color: appTheme.colors.textSecondary }}>
                Memory muestra continuidad por Mugiwara y estado resumido de fuentes. No es una superficie editable ni se mezcla con el canon curado del Vault.
              </p>
              <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap' }}>
                <StatusBadge
                  status={apiState === 'ready' ? 'operativo' : 'revision'}
                  label={isSnapshotMode ? 'Snapshot local visible' : undefined}
                />
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
                  Solo lectura
                </span>
              </div>
            </div>
          </SurfaceCard>

          <SurfaceCard title="Selector de Mugiwara" elevated eyebrow="Tripulación" accent="gold">
            <div style={{ display: 'grid', gap: '10px' }}>
              {MUGIWARA_SLUGS.map((slug) => {
                const profile = getMugiwaraProfile(slug)
                const summary = summaries.find((item) => item.mugiwara_slug === slug)
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
                      <StatusBadge
                        status={summary && summary.fact_count >= 5 ? 'operativo' : 'revision'}
                        label={isSnapshotMode && summary && summary.fact_count >= 5 ? 'Operativo en último corte' : undefined}
                      />
                    </div>
                    {summary ? (
                      <>
                        <span style={{ color: appTheme.colors.textSecondary, fontSize: '13px' }}>{summary.summary}</span>
                        <span style={{ color: appTheme.colors.textMuted, fontSize: '12px' }}>
                          {summary.fact_count} facts · {isSnapshotMode ? 'corte del snapshot' : 'actualizado'} {formatTimestamp(summary.last_updated)}
                        </span>
                      </>
                    ) : (
                      <span style={{ color: appTheme.colors.textMuted, fontSize: '12px' }}>Sin resumen cargado.</span>
                    )}
                  </button>
                )
              })}
            </div>
          </SurfaceCard>
        </div>

        <div style={{ display: 'grid', gap: '14px' }}>
          <SurfaceCard title="Fuentes de memoria" elevated eyebrow="Fuentes" accent="sky">
            <div style={{ display: 'grid', gap: '12px' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', gap: '10px', flexWrap: 'wrap', alignItems: 'center' }}>
                <div style={{ display: 'flex', gap: '12px', alignItems: 'center' }}>
                  <MugiwaraCrest slug={selectedMugiwara} size="md" accent />
                  <div style={{ display: 'grid', gap: '2px' }}>
                    <strong style={{ fontSize: '18px' }}>{selectedProfile.name}</strong>
                    <span style={{ color: appTheme.colors.textMuted, fontSize: '13px' }}>{selectedProfile.role}</span>
                  </div>
                </div>
                <StatusBadge
                  status={mapSourceStateToStatus(selectedSnapshot.state)}
                  label={isSnapshotMode && mapSourceStateToStatus(selectedSnapshot.state) === 'operativo' ? 'Operativo en último corte' : undefined}
                />
              </div>

              <div role="tablist" aria-label="Fuente de memoria" style={{ display: 'flex', gap: '8px', flexWrap: 'wrap' }}>
                {(['built-in', 'honcho'] as MemorySourceKey[]).map((source) => {
                  const active = source === selectedSource
                  return (
                    <button
                      key={source}
                      type="button"
                      role="tab"
                      aria-selected={active}
                      onClick={() => setSelectedSource(source)}
                      style={{
                        borderRadius: '999px',
                        border: `1px solid ${active ? appTheme.colors.brandSky500 : appTheme.colors.borderSubtle}`,
                        background: active ? appTheme.colors.bgSurface2 : appTheme.colors.bgSurface1,
                        color: active ? appTheme.colors.brandSky500 : appTheme.colors.textSecondary,
                        padding: '8px 14px',
                        fontWeight: 700,
                        cursor: 'pointer',
                      }}
                    >
                      {sourceLabelMap[source]}
                    </button>
                  )
                })}
              </div>

              <div
                style={{
                  display: 'grid',
                  gap: '10px',
                  padding: '12px',
                  borderRadius: '12px',
                  background: appTheme.colors.bgSurface1,
                  border: `1px solid ${appTheme.colors.borderSubtle}`,
                }}
              >
                <span style={{ color: appTheme.colors.textMuted, fontSize: '13px' }}>Estado de fuente</span>
                <div style={{ display: 'flex', gap: '10px', flexWrap: 'wrap' }}>
                  <StatusBadge
                    status={mapSourceStateToStatus(selectedSnapshot.state)}
                    label={isSnapshotMode && mapSourceStateToStatus(selectedSnapshot.state) === 'operativo' ? 'Operativo en último corte' : undefined}
                  />
                  <span style={{ color: appTheme.colors.textSecondary, fontSize: '13px' }}>{selectedSnapshot.availability}</span>
                  <span style={{ color: appTheme.colors.textMuted, fontSize: '13px' }}>
                    {isSnapshotMode ? 'Corte del snapshot' : 'Última actualización'}: {formatTimestamp(selectedSnapshot.updated_at)}
                  </span>
                </div>
                <p style={{ margin: 0, color: appTheme.colors.textSecondary }}>{selectedSnapshot.summary}</p>
              </div>

              {sourceNotice ? (
                <StatePanel
                  status={sourceNotice.status}
                  title={sourceNotice.title}
                  description={sourceNotice.description}
                  detail={sourceNotice.detail}
                  eyebrow="Estado de fuente"
                />
              ) : null}
            </div>
          </SurfaceCard>

          <SurfaceCard title="Contenido resumido" elevated eyebrow="Lectura viva" accent="gold">
            <div style={{ display: 'grid', gap: '12px' }}>
              <p style={{ margin: 0, color: appTheme.colors.textSecondary }}>
                Vista legible y resumida de la memoria {sourceLabelMap[selectedSource]} para {selectedProfile.name}. El detalle sigue siendo operacional y no documental.
              </p>

              {selectedBadges.length > 0 ? (
                <div style={{ display: 'flex', flexWrap: 'wrap', gap: '8px' }}>
                  {selectedBadges.map((badge) => (
                    <span
                      key={badge}
                      style={{
                        border: `1px solid ${appTheme.colors.borderSubtle}`,
                        borderRadius: '999px',
                        padding: '4px 10px',
                        color: appTheme.colors.textSecondary,
                        fontSize: '12px',
                        background: appTheme.colors.bgSurface1,
                      }}
                    >
                      {badge}
                    </span>
                  ))}
                </div>
              ) : (
                <StatePanel
                  status="sin-datos"
                  title="Sin etiquetas visibles"
                  description={`Todavía no hay badges resumidos para ${selectedProfile.name}. La ausencia de etiquetas no debe romper la lectura del resto del contenido.`}
                  eyebrow="Estado vacío"
                />
              )}

              <div style={{ display: 'grid', gap: '8px' }}>
                {selectedSnapshot.facts.length > 0 ? (
                  selectedSnapshot.facts.map((fact) => (
                    <div
                      key={fact}
                      style={{
                        borderRadius: '12px',
                        border: `1px solid ${appTheme.colors.borderSubtle}`,
                        padding: '12px',
                        background: appTheme.colors.bgSurface1,
                        color: appTheme.colors.textSecondary,
                      }}
                    >
                      {fact}
                    </div>
                  ))
                ) : (
                  <StatePanel
                    status={sourceNotice?.status ?? 'sin-datos'}
                    title="Sin facts resumidos"
                    description={`No hay hechos operativos visibles para la combinación ${selectedProfile.name} + ${sourceLabelMap[selectedSource]}.`}
                    detail={selectedSnapshot.availability}
                    eyebrow="Estado vacío"
                  />
                )}
              </div>
            </div>
          </SurfaceCard>
        </div>
      </section>
    </>
  )
}

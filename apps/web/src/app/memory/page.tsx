'use client'

import { useMemo, useState } from 'react'

import { memoryAgentDetailFixture, type MemorySourceKey, type MemorySourceState } from '@/modules/memory/view-models/memory-agent-detail.fixture'
import { memoryAgentSummaryFixture } from '@/modules/memory/view-models/memory-agent-summary.fixture'
import { getMugiwaraProfile, MUGIWARA_SLUGS, type MugiwaraSlug } from '@/shared/mugiwara/crest-map'
import { MugiwaraCrest } from '@/shared/mugiwara/MugiwaraCrest'
import { PageHeader } from '@/shared/ui/app-shell/PageHeader'
import { SurfaceCard } from '@/shared/ui/cards/SurfaceCard'
import { StatusBadge } from '@/shared/ui/status/StatusBadge'
import { appTheme, type AppStatus } from '@/shared/theme/tokens'

const sourceLabelMap: Record<MemorySourceKey, string> = {
  'built-in': 'Built-in',
  honcho: 'Honcho',
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

export default function MemoryPage() {
  const [selectedMugiwara, setSelectedMugiwara] = useState<MugiwaraSlug>('zoro')
  const [selectedSource, setSelectedSource] = useState<MemorySourceKey>('built-in')

  const selectedDetail = useMemo(
    () => memoryAgentDetailFixture.find((item) => item.mugiwara_slug === selectedMugiwara) ?? memoryAgentDetailFixture[0],
    [selectedMugiwara],
  )

  const selectedSnapshot = selectedSource === 'built-in' ? selectedDetail.built_in : selectedDetail.honcho
  const selectedProfile = getMugiwaraProfile(selectedMugiwara)

  return (
    <>
      <PageHeader
        eyebrow="Memory"
        title="Memoria operativa"
        subtitle="Selector por Mugiwara, tabs Built-in/Honcho y lectura resumida de fuente, manteniendo separación explícita respecto a Vault."
      />

      <section
        style={{
          display: 'grid',
          gap: '14px',
          gridTemplateColumns: 'minmax(280px, 360px) minmax(0, 1fr)',
          alignItems: 'start',
        }}
      >
        <div style={{ display: 'grid', gap: '14px' }}>
          <SurfaceCard title="Memoria operativa" elevated>
            <div style={{ display: 'grid', gap: '10px' }}>
              <p style={{ margin: 0, color: appTheme.colors.textSecondary }}>
                Memory muestra continuidad por Mugiwara y estado resumido de fuentes. No es una superficie editable ni se mezcla con el canon curado del Vault.
              </p>
              <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap' }}>
                <StatusBadge status="operativo" />
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

          <SurfaceCard title="Selector de Mugiwara" elevated>
            <div style={{ display: 'grid', gap: '10px' }}>
              {MUGIWARA_SLUGS.map((slug) => {
                const profile = getMugiwaraProfile(slug)
                const summary = memoryAgentSummaryFixture.find((item) => item.mugiwara_slug === slug)
                const isSelected = slug === selectedMugiwara

                return (
                  <button
                    key={slug}
                    type="button"
                    onClick={() => setSelectedMugiwara(slug)}
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
                      <StatusBadge status={summary && summary.fact_count >= 5 ? 'operativo' : 'revision'} />
                    </div>
                    {summary ? (
                      <>
                        <span style={{ color: appTheme.colors.textSecondary, fontSize: '13px' }}>{summary.summary}</span>
                        <span style={{ color: appTheme.colors.textMuted, fontSize: '12px' }}>
                          {summary.fact_count} facts · actualizado {formatTimestamp(summary.last_updated)}
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
          <SurfaceCard title="Fuentes de memoria" elevated>
            <div style={{ display: 'grid', gap: '12px' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', gap: '10px', flexWrap: 'wrap', alignItems: 'center' }}>
                <div style={{ display: 'flex', gap: '12px', alignItems: 'center' }}>
                  <MugiwaraCrest slug={selectedMugiwara} size="md" accent />
                  <div style={{ display: 'grid', gap: '2px' }}>
                    <strong style={{ fontSize: '18px' }}>{selectedProfile.name}</strong>
                    <span style={{ color: appTheme.colors.textMuted, fontSize: '13px' }}>{selectedProfile.role}</span>
                  </div>
                </div>
                <StatusBadge status={mapSourceStateToStatus(selectedSnapshot.state)} />
              </div>

              <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap' }}>
                {(['built-in', 'honcho'] as MemorySourceKey[]).map((source) => {
                  const active = source === selectedSource
                  return (
                    <button
                      key={source}
                      type="button"
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
                  <StatusBadge status={mapSourceStateToStatus(selectedSnapshot.state)} />
                  <span style={{ color: appTheme.colors.textSecondary, fontSize: '13px' }}>{selectedSnapshot.availability}</span>
                  <span style={{ color: appTheme.colors.textMuted, fontSize: '13px' }}>
                    Última actualización: {formatTimestamp(selectedSnapshot.updated_at)}
                  </span>
                </div>
                <p style={{ margin: 0, color: appTheme.colors.textSecondary }}>{selectedSnapshot.summary}</p>
              </div>
            </div>
          </SurfaceCard>

          <SurfaceCard title="Contenido resumido" elevated>
            <div style={{ display: 'grid', gap: '12px' }}>
              <p style={{ margin: 0, color: appTheme.colors.textSecondary }}>
                Vista legible y resumida de la memoria {sourceLabelMap[selectedSource]} para {selectedProfile.name}. El detalle sigue siendo operacional y no documental.
              </p>

              <div style={{ display: 'flex', flexWrap: 'wrap', gap: '8px' }}>
                {(memoryAgentSummaryFixture.find((item) => item.mugiwara_slug === selectedMugiwara)?.badges ?? []).map((badge) => (
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

              <div style={{ display: 'grid', gap: '8px' }}>
                {selectedSnapshot.facts.map((fact) => (
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
                ))}
              </div>
            </div>
          </SurfaceCard>
        </div>
      </section>
    </>
  )
}

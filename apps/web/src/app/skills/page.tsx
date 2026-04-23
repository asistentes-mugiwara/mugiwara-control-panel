'use client'

import { useEffect, useMemo, useState } from 'react'

import type { SkillAuditRecord, SkillCatalogItem, SkillDetail, SkillPreviewResponse } from '@contracts/skills'

import {
  fetchSkillDetail,
  fetchSkillPreview,
  fetchSkillsAudit,
  fetchSkillsCatalog,
  getSkillsApiBaseUrl,
  SkillsApiError,
  updateSkill,
} from '@/modules/skills/api/skills-http'
import {
  getSkillExposureLabel,
  mapCatalogSkillToBadgeStatus,
  mapRiskToBadgeStatus,
  mapSkillsViewStateToBadgeStatus,
} from '@/modules/skills/view-models/skill-surface.mappers'
import { skillSurfaceFixture } from '@/modules/skills/view-models/skill-surface.fixture'
import { PageHeader } from '@/shared/ui/app-shell/PageHeader'
import { SurfaceCard } from '@/shared/ui/cards/SurfaceCard'
import { StatusBadge } from '@/shared/ui/status/StatusBadge'
import { appTheme, type AppStatus } from '@/shared/theme/tokens'

type SkillsViewState = 'loading' | 'ready' | 'empty' | 'error' | 'not_configured'
type PreviewState = 'idle' | 'loading' | 'ready' | 'error'
type SaveState = 'idle' | 'saving' | 'success' | 'stale' | 'error'

const DEFAULT_ACTOR = 'zoro'

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

function getLatestAuditForSkill(audit: SkillAuditRecord[], skillId: string) {
  return audit.find((item) => item.skill_id === skillId) ?? null
}

function getSaveStateStatus(state: SaveState): AppStatus {
  switch (state) {
    case 'saving':
      return 'revision'
    case 'success':
      return 'operativo'
    case 'stale':
      return 'stale'
    case 'error':
      return 'incidencia'
    default:
      return 'sin-datos'
  }
}

export default function SkillsPage() {
  const policy = skillSurfaceFixture
  const apiBaseUrl = getSkillsApiBaseUrl()
  const [viewState, setViewState] = useState<SkillsViewState>(apiBaseUrl ? 'loading' : 'not_configured')
  const [errorMessage, setErrorMessage] = useState<string | null>(null)
  const [catalog, setCatalog] = useState<SkillCatalogItem[]>([])
  const [selectedSkillId, setSelectedSkillId] = useState<string | null>(null)
  const [selectedSkill, setSelectedSkill] = useState<SkillDetail | null>(null)
  const [audit, setAudit] = useState<SkillAuditRecord[]>([])
  const [draftContent, setDraftContent] = useState('')
  const [actorInput, setActorInput] = useState(DEFAULT_ACTOR)
  const [previewState, setPreviewState] = useState<PreviewState>('idle')
  const [previewError, setPreviewError] = useState<string | null>(null)
  const [previewResponse, setPreviewResponse] = useState<SkillPreviewResponse['data'] | null>(null)
  const [saveState, setSaveState] = useState<SaveState>('idle')
  const [saveMessage, setSaveMessage] = useState<string | null>(null)
  const [lastSavedAudit, setLastSavedAudit] = useState<SkillAuditRecord | null>(null)

  useEffect(() => {
    let cancelled = false

    async function loadCatalog() {
      if (!apiBaseUrl) {
        setViewState('not_configured')
        setErrorMessage(null)
        return
      }

      setViewState('loading')
      setErrorMessage(null)

      try {
        const [catalogResponse, auditResponse] = await Promise.all([fetchSkillsCatalog(), fetchSkillsAudit()])

        if (cancelled) {
          return
        }

        const items = catalogResponse.data.items
        setCatalog(items)
        setAudit(auditResponse.data.items)

        if (items.length === 0) {
          setSelectedSkillId(null)
          setSelectedSkill(null)
          setViewState('empty')
          return
        }

        setSelectedSkillId((current) => current ?? items[0].skill_id)
        setViewState('ready')
      } catch (error) {
        if (cancelled) {
          return
        }

        setCatalog([])
        setSelectedSkillId(null)
        setSelectedSkill(null)
        setAudit([])
        setViewState(error instanceof SkillsApiError && error.code === 'not_configured' ? 'not_configured' : 'error')
        setErrorMessage(error instanceof Error ? error.message : 'No se pudo cargar el catálogo real de skills.')
      }
    }

    loadCatalog()

    return () => {
      cancelled = true
    }
  }, [apiBaseUrl])

  useEffect(() => {
    let cancelled = false

    async function loadDetail() {
      if (!apiBaseUrl || !selectedSkillId || !['ready', 'loading'].includes(viewState)) {
        return
      }

      try {
        const detailResponse = await fetchSkillDetail(selectedSkillId)

        if (cancelled) {
          return
        }

        setSelectedSkill(detailResponse.data)
      } catch (error) {
        if (cancelled) {
          return
        }

        setSelectedSkill(null)
        setViewState(error instanceof SkillsApiError && error.code === 'not_configured' ? 'not_configured' : 'error')
        setErrorMessage(error instanceof Error ? error.message : 'No se pudo cargar el detalle real de la skill.')
      }
    }

    loadDetail()

    return () => {
      cancelled = true
    }
  }, [apiBaseUrl, selectedSkillId, viewState])

  useEffect(() => {
    if (!selectedSkill) {
      setDraftContent('')
      setPreviewState('idle')
      setPreviewError(null)
      setPreviewResponse(null)
      setSaveState('idle')
      setSaveMessage(null)
      setLastSavedAudit(null)
      return
    }

    setDraftContent(selectedSkill.content)
    setPreviewState('idle')
    setPreviewError(null)
    setPreviewResponse(null)
    setSaveState('idle')
    setSaveMessage(null)
    setLastSavedAudit(null)
  }, [selectedSkill])

  const latestAudit = useMemo(() => {
    if (!selectedSkill) {
      return null
    }

    return getLatestAuditForSkill(audit, selectedSkill.skill_id)
  }, [audit, selectedSkill])

  const hasDraftChanges = selectedSkill ? draftContent !== selectedSkill.content : false
  const normalizedActor = actorInput.trim()
  const canSave = Boolean(selectedSkill?.editable && hasDraftChanges && normalizedActor && saveState !== 'saving')

  function resetFeedbackState() {
    setPreviewState('idle')
    setPreviewError(null)
    setPreviewResponse(null)
    setSaveState('idle')
    setSaveMessage(null)
    setLastSavedAudit(null)
  }

  function handleDraftChange(nextValue: string) {
    setDraftContent(nextValue)
    resetFeedbackState()
  }

  function handleResetDraft() {
    if (!selectedSkill) {
      return
    }

    setDraftContent(selectedSkill.content)
    resetFeedbackState()
  }

  async function handleReloadSkill() {
    if (!selectedSkillId) {
      return
    }

    setSaveState('saving')
    setSaveMessage('Recargando skill desde backend…')

    try {
      const [detailResponse, auditResponse] = await Promise.all([fetchSkillDetail(selectedSkillId), fetchSkillsAudit()])
      setSelectedSkill(detailResponse.data)
      setAudit(auditResponse.data.items)
      setSaveState('idle')
      setSaveMessage(null)
      setLastSavedAudit(null)
    } catch (error) {
      setSaveState('error')
      setSaveMessage(error instanceof Error ? error.message : 'No se pudo recargar la skill seleccionada.')
    }
  }

  async function handlePreviewDiff() {
    if (!selectedSkill) {
      return
    }

    setPreviewState('loading')
    setPreviewError(null)
    setSaveState('idle')
    setSaveMessage(null)
    setLastSavedAudit(null)

    try {
      const response = await fetchSkillPreview(selectedSkill.skill_id, {
        content: draftContent,
        expected_sha256: selectedSkill.fingerprint.sha256,
      })

      setPreviewResponse(response.data)
      setPreviewState('ready')
    } catch (error) {
      setPreviewResponse(null)
      setPreviewState('error')
      setPreviewError(error instanceof Error ? error.message : 'No se pudo calcular el preview de diff.')
    }
  }

  async function handleSaveSkill() {
    if (!selectedSkill) {
      return
    }

    if (!normalizedActor) {
      setSaveState('error')
      setSaveMessage('Indica un actor visible antes de guardar.')
      return
    }

    setSaveState('saving')
    setSaveMessage('Aplicando guardado controlado en backend…')
    setLastSavedAudit(null)

    try {
      const response = await updateSkill(selectedSkill.skill_id, {
        actor: normalizedActor,
        content: draftContent,
        expected_sha256: selectedSkill.fingerprint.sha256,
      })

      setSelectedSkill(response.data.skill)
      setAudit((current) => [response.data.audit, ...current.filter((item) => item.timestamp !== response.data.audit.timestamp)])
      setSaveState('success')
      setSaveMessage(`Guardado aplicado sobre ${response.data.skill.skill_id} por ${response.data.audit.actor}.`)
      setLastSavedAudit(response.data.audit)
    } catch (error) {
      if (error instanceof SkillsApiError && error.code === 'stale') {
        setSaveState('stale')
        setSaveMessage(`${error.message} Usa “Recargar skill” para sincronizar la versión allowlisted antes de reintentar.`)
        return
      }

      setSaveState('error')
      setSaveMessage(error instanceof Error ? error.message : 'No se pudo guardar la skill seleccionada.')
    }
  }

  return (
    <>
      <PageHeader
        eyebrow="Skills"
        title="Skills"
        subtitle="Catálogo conectado a backend real con preview y guardado controlado: actor visible, PUT allowlisted y manejo explícito de conflicto stale."
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
              La UI ya cierra el flujo permitido de edición controlada: solo skills allowlisted, actor visible, fingerprint esperado
              y feedback explícito de guardado o conflicto.
            </p>
            <StatusBadge status="operativo" />
            <ul style={{ margin: 0, paddingLeft: '18px', color: appTheme.colors.textSecondary, display: 'grid', gap: '8px' }}>
              {policy.boundary_rules.map((rule) => (
                <li key={rule}>{rule}</li>
              ))}
            </ul>
          </div>
        </SurfaceCard>

        <SurfaceCard title="Estado del origen" elevated>
          <div style={{ display: 'grid', gap: '10px' }}>
            <p style={{ margin: 0, color: appTheme.colors.textSecondary }}>
              El frontend usa backend real cuando la base URL está configurada; si no, cae a un estado explícito de fuente no
              configurada sin romper el shell ni el build.
            </p>
            <StatusBadge status={mapSkillsViewStateToBadgeStatus(viewState)} />
            <span style={{ color: appTheme.colors.textSecondary, fontSize: '13px' }}>
              {apiBaseUrl ? `API base URL: ${apiBaseUrl}` : 'API base URL no configurada'}
            </span>
            {errorMessage ? (
              <span style={{ color: appTheme.colors.stateDanger, fontSize: '13px' }}>Detalle: {errorMessage}</span>
            ) : null}
          </div>
        </SurfaceCard>

        <SurfaceCard title="Auditoría mínima" elevated>
          <div id="audit-minimum" style={{ display: 'grid', gap: '10px' }}>
            <p style={{ margin: 0, color: appTheme.colors.textSecondary }}>
              La respuesta real del backend ya enseña trazabilidad resumida antes y después del guardado: actor, timestamp,
              diff y resultado auditado.
            </p>
            <StatusBadge status={audit.length > 0 ? 'operativo' : 'revision'} />
            <ul style={{ margin: 0, paddingLeft: '18px', color: appTheme.colors.textSecondary, display: 'grid', gap: '8px' }}>
              {policy.audit_minimum.map((item) => (
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
          gridTemplateColumns: 'minmax(280px, 360px) minmax(0, 1fr)',
          alignItems: 'start',
        }}
      >
        <SurfaceCard title="Catálogo real" elevated>
          <div style={{ display: 'grid', gap: '10px' }}>
            {viewState === 'loading' ? <p style={{ margin: 0, color: appTheme.colors.textSecondary }}>Cargando skills reales…</p> : null}
            {viewState === 'not_configured' ? (
              <p style={{ margin: 0, color: appTheme.colors.textSecondary }}>
                Configura `NEXT_PUBLIC_MUGIWARA_CONTROL_PANEL_API_URL` para conectar esta vista al backend real.
              </p>
            ) : null}
            {viewState === 'error' ? (
              <p style={{ margin: 0, color: appTheme.colors.stateDanger }}>
                No se pudo cargar el catálogo real. Revisa la conectividad con el backend.
              </p>
            ) : null}
            {viewState === 'empty' ? (
              <p style={{ margin: 0, color: appTheme.colors.textSecondary }}>
                El backend respondió, pero no hay skills visibles para esta allowlist.
              </p>
            ) : null}

            {catalog.map((skill) => {
              const isSelected = skill.skill_id === selectedSkillId

              return (
                <button
                  key={skill.skill_id}
                  type="button"
                  onClick={() => {
                    setSelectedSkillId(skill.skill_id)
                    setSelectedSkill(null)
                  }}
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
                  <div style={{ display: 'flex', justifyContent: 'space-between', gap: '10px', flexWrap: 'wrap' }}>
                    <strong>{skill.display_name}</strong>
                    <StatusBadge status={mapCatalogSkillToBadgeStatus(skill)} />
                  </div>
                  <span style={{ color: appTheme.colors.textSecondary, fontSize: '13px' }}>{skill.skill_id}</span>
                  <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap' }}>
                    <span
                      style={{
                        borderRadius: '999px',
                        padding: '4px 10px',
                        border: `1px solid ${appTheme.colors.borderSubtle}`,
                        color: appTheme.colors.brandSky500,
                        fontSize: '12px',
                        fontWeight: 600,
                      }}
                    >
                      {getSkillExposureLabel(skill.editable ? 'allowlisted-edit' : 'read-only-reference')}
                    </span>
                    <StatusBadge status={mapRiskToBadgeStatus(skill.public_repo_risk)} />
                  </div>
                </button>
              )
            })}
          </div>
        </SurfaceCard>

        <div style={{ display: 'grid', gap: '14px' }}>
          <SurfaceCard title="Detalle y edición controlada" elevated>
            {selectedSkill ? (
              <div style={{ display: 'grid', gap: '12px' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', gap: '10px', flexWrap: 'wrap' }}>
                  <strong style={{ fontSize: '18px' }}>{selectedSkill.display_name}</strong>
                  <StatusBadge status={mapCatalogSkillToBadgeStatus(selectedSkill)} />
                </div>

                <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap' }}>
                  <span style={{ color: appTheme.colors.textSecondary, fontSize: '13px' }}>
                    owner_scope: {selectedSkill.owner_scope}
                  </span>
                  <span style={{ color: appTheme.colors.textSecondary, fontSize: '13px' }}>
                    fingerprint: {selectedSkill.fingerprint.sha256.slice(0, 12)}…
                  </span>
                  <span style={{ color: appTheme.colors.textSecondary, fontSize: '13px' }}>
                    bytes: {selectedSkill.fingerprint.bytes}
                  </span>
                </div>

                <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap' }}>
                  <span
                    style={{
                      borderRadius: '999px',
                      padding: '4px 10px',
                      border: `1px solid ${appTheme.colors.borderSubtle}`,
                      color: selectedSkill.editable ? appTheme.colors.stateSuccess : appTheme.colors.textSecondary,
                      fontSize: '12px',
                      fontWeight: 600,
                    }}
                  >
                    {getSkillExposureLabel(selectedSkill.editable ? 'allowlisted-edit' : 'read-only-reference')}
                  </span>
                  <span style={{ color: appTheme.colors.textMuted, fontSize: '13px' }}>
                    {selectedSkill.editable
                      ? 'Guardado productivo habilitado en 9.4 con actor visible y control de fingerprint.'
                      : 'Skill de solo referencia: sin preview ni guardado.'}
                  </span>
                </div>

                <div style={{ display: 'grid', gap: '6px' }}>
                  <span style={{ color: appTheme.colors.textMuted, fontSize: '13px' }}>repo_path allowlisted</span>
                  <code
                    style={{
                      padding: '10px',
                      borderRadius: '12px',
                      background: appTheme.colors.bgSurface1,
                      color: appTheme.colors.textSecondary,
                      overflowX: 'auto',
                    }}
                  >
                    {selectedSkill.repo_path}
                  </code>
                </div>

                <div style={{ display: 'grid', gap: '6px' }}>
                  <label htmlFor="skills-actor-input" style={{ color: appTheme.colors.textMuted, fontSize: '13px' }}>
                    Actor visible del guardado
                  </label>
                  <input
                    id="skills-actor-input"
                    type="text"
                    value={actorInput}
                    onChange={(event) => setActorInput(event.target.value)}
                    placeholder="zoro"
                    disabled={!selectedSkill.editable || saveState === 'saving'}
                    style={{
                      borderRadius: '12px',
                      border: `1px solid ${appTheme.colors.borderSubtle}`,
                      background: selectedSkill.editable ? appTheme.colors.bgSurface1 : appTheme.colors.bgSurface2,
                      color: appTheme.colors.textPrimary,
                      padding: '12px 14px',
                    }}
                  />
                </div>

                <div style={{ display: 'grid', gap: '6px' }}>
                  <span style={{ color: appTheme.colors.textMuted, fontSize: '13px' }}>Borrador controlado</span>
                  <textarea
                    value={draftContent}
                    onChange={(event) => handleDraftChange(event.target.value)}
                    disabled={!selectedSkill.editable || saveState === 'saving'}
                    style={{
                      minHeight: '240px',
                      borderRadius: '12px',
                      border: `1px solid ${appTheme.colors.borderSubtle}`,
                      background: selectedSkill.editable ? appTheme.colors.bgSurface1 : appTheme.colors.bgSurface2,
                      color: appTheme.colors.textSecondary,
                      padding: '14px',
                      resize: 'vertical',
                      fontFamily: 'ui-monospace, SFMono-Regular, Menlo, monospace',
                    }}
                  />
                </div>

                <div style={{ display: 'flex', gap: '10px', flexWrap: 'wrap' }}>
                  <button
                    type="button"
                    onClick={handlePreviewDiff}
                    disabled={!selectedSkill.editable || !hasDraftChanges || previewState === 'loading' || saveState === 'saving'}
                    style={{
                      borderRadius: '999px',
                      border: 'none',
                      padding: '10px 16px',
                      cursor: !selectedSkill.editable || !hasDraftChanges ? 'not-allowed' : 'pointer',
                      background: appTheme.colors.brandBlue700,
                      color: appTheme.colors.textPrimary,
                      fontWeight: 700,
                      opacity: !selectedSkill.editable || !hasDraftChanges ? 0.55 : 1,
                    }}
                  >
                    {previewState === 'loading' ? 'Calculando diff…' : 'Preview de diff'}
                  </button>
                  <button
                    type="button"
                    onClick={handleSaveSkill}
                    disabled={!canSave}
                    style={{
                      borderRadius: '999px',
                      border: 'none',
                      padding: '10px 16px',
                      cursor: canSave ? 'pointer' : 'not-allowed',
                      background: appTheme.colors.stateSuccess,
                      color: appTheme.colors.textPrimary,
                      fontWeight: 700,
                      opacity: canSave ? 1 : 0.55,
                    }}
                  >
                    {saveState === 'saving' ? 'Guardando…' : 'Guardar skill'}
                  </button>
                  <button
                    type="button"
                    onClick={handleResetDraft}
                    disabled={!selectedSkill.editable || !hasDraftChanges || saveState === 'saving'}
                    style={{
                      borderRadius: '999px',
                      border: `1px solid ${appTheme.colors.borderSubtle}`,
                      padding: '10px 16px',
                      cursor: !selectedSkill.editable || !hasDraftChanges ? 'not-allowed' : 'pointer',
                      background: appTheme.colors.bgSurface1,
                      color: appTheme.colors.textSecondary,
                      fontWeight: 700,
                      opacity: !selectedSkill.editable || !hasDraftChanges ? 0.55 : 1,
                    }}
                  >
                    Reset borrador
                  </button>
                  <button
                    type="button"
                    onClick={handleReloadSkill}
                    disabled={!selectedSkill.editable || saveState === 'saving'}
                    style={{
                      borderRadius: '999px',
                      border: `1px solid ${appTheme.colors.borderSubtle}`,
                      padding: '10px 16px',
                      cursor: !selectedSkill.editable ? 'not-allowed' : 'pointer',
                      background: appTheme.colors.bgSurface2,
                      color: appTheme.colors.textSecondary,
                      fontWeight: 700,
                      opacity: !selectedSkill.editable ? 0.55 : 1,
                    }}
                  >
                    Recargar skill
                  </button>
                </div>

                {!selectedSkill.editable ? (
                  <p style={{ margin: 0, color: appTheme.colors.textSecondary }}>
                    Esta skill es de solo referencia: la UI muestra el contenido, pero no ofrece preview de diff ni guardado.
                  </p>
                ) : !hasDraftChanges ? (
                  <p style={{ margin: 0, color: appTheme.colors.textSecondary }}>
                    Modifica el borrador para habilitar preview y guardado controlado.
                  </p>
                ) : !normalizedActor ? (
                  <p style={{ margin: 0, color: appTheme.colors.stateDanger }}>
                    El actor visible es obligatorio para poder guardar y auditar la operación.
                  </p>
                ) : null}
              </div>
            ) : viewState === 'ready' ? (
              <p style={{ margin: 0, color: appTheme.colors.textSecondary }}>Selecciona una skill para cargar su detalle real.</p>
            ) : (
              <p style={{ margin: 0, color: appTheme.colors.textSecondary }}>
                El detalle aparecerá aquí cuando la fuente real esté disponible.
              </p>
            )}
          </SurfaceCard>

          <SurfaceCard title="Preview, conflicto y auditoría" elevated>
            <div style={{ display: 'grid', gap: '10px' }}>
              <div
                style={{
                  display: 'grid',
                  gap: '8px',
                  paddingBottom: '10px',
                  borderBottom: `1px solid ${appTheme.colors.borderSubtle}`,
                }}
              >
                <div style={{ display: 'flex', justifyContent: 'space-between', gap: '10px', flexWrap: 'wrap' }}>
                  <span style={{ color: appTheme.colors.textSecondary, fontSize: '13px' }}>Estado de operación</span>
                  <StatusBadge status={getSaveStateStatus(saveState)} />
                </div>
                <span style={{ color: appTheme.colors.textSecondary, fontSize: '13px' }}>
                  Actor visible: <strong>{normalizedActor || 'sin definir'}</strong>
                </span>
                <span style={{ color: saveState === 'error' ? appTheme.colors.stateDanger : appTheme.colors.textSecondary, fontSize: '13px' }}>
                  {saveMessage ?? 'Todavía no se ha ejecutado un guardado en esta selección.'}
                </span>
                {saveState === 'stale' ? (
                  <span style={{ color: appTheme.colors.stateStale, fontSize: '13px' }}>
                    El backend rechazó el guardado por fingerprint desactualizado. Recarga la skill para volver a sincronizar el
                    contenido allowlisted antes de reintentar.
                  </span>
                ) : null}
                {lastSavedAudit ? (
                  <span style={{ color: appTheme.colors.textMuted, fontSize: '13px' }}>
                    Último guardado 9.4: {formatTimestamp(lastSavedAudit.timestamp)} · resultado {lastSavedAudit.result}
                  </span>
                ) : null}
              </div>

              {previewState === 'error' && previewError ? (
                <p style={{ margin: 0, color: appTheme.colors.stateDanger }}>No se pudo calcular el preview: {previewError}</p>
              ) : null}

              {previewResponse ? (
                <>
                  <div style={{ display: 'flex', gap: '10px', flexWrap: 'wrap' }}>
                    <span style={{ color: appTheme.colors.textSecondary, fontSize: '13px' }}>
                      Diff: +{previewResponse.diff_summary.lines_added} / -{previewResponse.diff_summary.lines_removed}
                    </span>
                    <span style={{ color: appTheme.colors.textSecondary, fontSize: '13px' }}>
                      hunks: {previewResponse.diff_summary.hunks}
                    </span>
                    <span style={{ color: appTheme.colors.textMuted, fontSize: '13px' }}>
                      after: {previewResponse.after.sha256.slice(0, 12)}…
                    </span>
                  </div>
                  <pre
                    style={{
                      margin: 0,
                      padding: '14px',
                      borderRadius: '12px',
                      background: appTheme.colors.bgSurface1,
                      color: appTheme.colors.textSecondary,
                      overflowX: 'auto',
                      maxHeight: '260px',
                      whiteSpace: 'pre-wrap',
                    }}
                  >
                    {previewResponse.diff_summary.preview.join('\n') || 'Sin preview textual disponible.'}
                  </pre>
                </>
              ) : (
                <p style={{ margin: 0, color: appTheme.colors.textSecondary }}>
                  El preview de diff aparecerá aquí cuando prepares cambios sobre una skill editable y lo solicites al backend.
                </p>
              )}

              <div
                style={{
                  borderTop: `1px solid ${appTheme.colors.borderSubtle}`,
                  paddingTop: '10px',
                  display: 'grid',
                  gap: '10px',
                }}
              >
                {latestAudit ? (
                  <>
                    <div style={{ display: 'flex', justifyContent: 'space-between', gap: '10px', flexWrap: 'wrap' }}>
                      <span style={{ color: appTheme.colors.textSecondary, fontSize: '13px' }}>
                        Último actor: <strong>{latestAudit.actor}</strong>
                      </span>
                      <span style={{ color: appTheme.colors.textMuted, fontSize: '13px' }}>
                        {formatTimestamp(latestAudit.timestamp)}
                      </span>
                    </div>
                    <span style={{ color: appTheme.colors.textSecondary, fontSize: '13px' }}>
                      Resultado auditado: <strong>{latestAudit.result}</strong>
                    </span>
                    <span style={{ color: appTheme.colors.textSecondary, fontSize: '13px' }}>
                      Último diff: +{latestAudit.diff_summary.lines_added} / -{latestAudit.diff_summary.lines_removed} · hunks {latestAudit.diff_summary.hunks}
                    </span>
                    {latestAudit.reason ? (
                      <span style={{ color: appTheme.colors.textSecondary, fontSize: '13px' }}>
                        Motivo auditado: <strong>{latestAudit.reason}</strong>
                      </span>
                    ) : null}
                  </>
                ) : (
                  <p style={{ margin: 0, color: appTheme.colors.textSecondary }}>
                    Todavía no hay auditoría resumida para la skill seleccionada o la fuente sigue vacía.
                  </p>
                )}
              </div>
            </div>
          </SurfaceCard>
        </div>
      </section>
    </>
  )
}

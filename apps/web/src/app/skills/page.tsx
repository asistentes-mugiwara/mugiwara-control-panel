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
import { StatePanel } from '@/shared/ui/state/StatePanel'
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

function getSkillsViewNotice(state: SkillsViewState, apiBaseUrl: string | null, errorMessage: string | null) {
  switch (state) {
    case 'loading':
      return {
        status: 'revision' as const,
        title: 'Conectando con el backend real de skills',
        description: 'La UI está cargando catálogo, detalle y auditoría allowlisted sin romper el shell durante la espera.',
        detail: apiBaseUrl ? `API base URL: ${apiBaseUrl}` : null,
      }
    case 'not_configured':
      return {
        status: 'sin-datos' as const,
        title: 'API base URL no configurada',
        description: 'Configura `NEXT_PUBLIC_MUGIWARA_CONTROL_PANEL_API_URL` para conectar esta vista al backend real sin caer en estados ambiguos.',
        detail: apiBaseUrl ? `API base URL: ${apiBaseUrl}` : 'Variable ausente en el runtime actual.',
      }
    case 'error':
      return {
        status: 'incidencia' as const,
        title: 'No se pudo cargar la fuente real de skills',
        description: 'La superficie mantiene el shell, pero la conectividad o la respuesta del backend impiden mostrar catálogo y detalle con garantías.',
        detail: errorMessage ?? 'Sin detalle adicional.',
      }
    case 'empty':
      return {
        status: 'sin-datos' as const,
        title: 'La allowlist no devolvió skills visibles',
        description: 'El backend respondió correctamente, pero no hay entradas disponibles para esta selección allowlisted.',
        detail: apiBaseUrl ? `API base URL: ${apiBaseUrl}` : null,
      }
    case 'ready':
    default:
      return null
  }
}

function countLines(value: string) {
  return value.length === 0 ? 0 : value.split('\n').length
}

function formatSignedDelta(value: number) {
  if (value === 0) {
    return '0'
  }

  return value > 0 ? `+${value}` : `${value}`
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

  const sourceNotice = getSkillsViewNotice(viewState, apiBaseUrl, errorMessage)
  const hasDraftChanges = selectedSkill ? draftContent !== selectedSkill.content : false
  const normalizedActor = actorInput.trim()
  const canSave = Boolean(selectedSkill?.editable && hasDraftChanges && normalizedActor && saveState !== 'saving')
  const editableCount = catalog.filter((item) => item.editable).length
  const readOnlyCount = catalog.length - editableCount
  const draftSummary = useMemo(() => {
    if (!selectedSkill) {
      return null
    }

    return {
      lineDelta: countLines(draftContent) - countLines(selectedSkill.content),
      charDelta: draftContent.length - selectedSkill.content.length,
    }
  }, [draftContent, selectedSkill])
  const workspaceStatus: AppStatus = !selectedSkill
    ? 'sin-datos'
    : !selectedSkill.editable
      ? 'revision'
      : saveState === 'success'
        ? 'operativo'
        : saveState === 'stale'
          ? 'stale'
          : saveState === 'error'
            ? 'incidencia'
            : hasDraftChanges
              ? 'revision'
              : 'operativo'

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
        mugiwaraSlug="zoro"
        detailPills={["Edición allowlisted", "Diff explícito", "Auditoría visible"]}
      />

      <SurfaceCard title="Workspace de edición" elevated eyebrow="Dojo" accent="success">
        <div style={{ display: 'grid', gap: '14px' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', gap: '12px', flexWrap: 'wrap', alignItems: 'start' }}>
            <div style={{ display: 'grid', gap: '8px', maxWidth: '720px' }}>
              <p style={{ margin: 0, color: appTheme.colors.textSecondary }}>
                Esta vista no es un catálogo pasivo: aquí existe edición controlada sobre skills allowlisted, con preview de diff, actor visible y guardado auditado.
              </p>
              <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap' }}>
                <StatusBadge status={workspaceStatus} />
                <span
                  style={{
                    borderRadius: '999px',
                    padding: '4px 10px',
                    border: `1px solid ${appTheme.colors.borderSubtle}`,
                    background: appTheme.colors.bgSurface1,
                    color: appTheme.colors.brandGold400,
                    fontSize: '12px',
                    fontWeight: 700,
                  }}
                >
                  {selectedSkill?.editable ? 'Modo edición allowlisted' : selectedSkill ? 'Modo referencia' : 'Selecciona una skill'}
                </span>
                <span
                  style={{
                    borderRadius: '999px',
                    padding: '4px 10px',
                    border: `1px solid ${appTheme.colors.borderSubtle}`,
                    background: appTheme.colors.bgSurface1,
                    color: appTheme.colors.brandSky500,
                    fontSize: '12px',
                    fontWeight: 700,
                  }}
                >
                  {editableCount} editable(s) · {readOnlyCount} referencia(s)
                </span>
              </div>
            </div>

            <div style={{ display: 'grid', gap: '8px', minWidth: '240px' }}>
              <span style={{ color: appTheme.colors.textMuted, fontSize: '12px', fontWeight: 700 }}>Skill activa</span>
              <strong style={{ fontSize: '18px' }}>{selectedSkill?.display_name ?? 'Ninguna seleccionada'}</strong>
              <span style={{ color: appTheme.colors.textSecondary, fontSize: '13px' }}>
                {selectedSkill?.editable
                  ? 'Lista para edición controlada cuando haya cambios y actor visible.'
                  : selectedSkill
                    ? 'Se muestra como referencia documental: sin escritura productiva.'
                    : 'Selecciona una entrada del catálogo para abrir el workspace.'}
              </span>
            </div>
          </div>

          <div
            style={{
              display: 'grid',
              gap: '10px',
              gridTemplateColumns: 'repeat(auto-fit, minmax(180px, 1fr))',
            }}
          >
            {[
              {
                label: 'Actor visible',
                value: normalizedActor || 'sin definir',
                tone: normalizedActor ? appTheme.colors.brandSky500 : appTheme.colors.stateDanger,
              },
              {
                label: 'Borrador',
                value: !selectedSkill ? 'sin selección' : hasDraftChanges ? 'cambios pendientes' : 'sin cambios',
                tone: !selectedSkill ? appTheme.colors.textMuted : hasDraftChanges ? appTheme.colors.stateWarning : appTheme.colors.stateSuccess,
              },
              {
                label: 'Preview',
                value: previewResponse ? 'calculado' : previewState === 'loading' ? 'en curso' : previewState === 'error' ? 'incidencia' : 'pendiente',
                tone:
                  previewState === 'error'
                    ? appTheme.colors.stateDanger
                    : previewResponse
                      ? appTheme.colors.brandBlue700
                      : appTheme.colors.textMuted,
              },
              {
                label: 'Guardado',
                value: saveState === 'success' ? 'listo' : saveState === 'saving' ? 'en curso' : canSave ? 'habilitado' : 'bloqueado',
                tone:
                  saveState === 'error'
                    ? appTheme.colors.stateDanger
                    : saveState === 'stale'
                      ? appTheme.colors.stateStale
                      : canSave || saveState === 'success'
                        ? appTheme.colors.stateSuccess
                        : appTheme.colors.textMuted,
              },
            ].map((item) => (
              <div
                key={item.label}
                style={{
                  borderRadius: '12px',
                  border: `1px solid ${appTheme.colors.borderSubtle}`,
                  background: appTheme.colors.bgSurface1,
                  padding: '12px',
                  display: 'grid',
                  gap: '6px',
                }}
              >
                <span style={{ color: appTheme.colors.textMuted, fontSize: '12px' }}>{item.label}</span>
                <strong style={{ color: item.tone, fontSize: '16px' }}>{item.value}</strong>
              </div>
            ))}
          </div>

          {selectedSkill ? (
            <StatePanel
              status={workspaceStatus}
              title={selectedSkill.editable ? 'Workspace productivo activo' : 'Workspace en modo referencia'}
              description={
                selectedSkill.editable
                  ? 'La edición ocurre aquí con allowlist, fingerprint esperado, preview explícito y guardado auditado. No es una ficha documental.'
                  : 'Esta skill se puede inspeccionar, pero no habilita cambios productivos. El contraste con las skills editables debe quedar claro.'
              }
              detail={
                selectedSkill.editable && draftSummary
                  ? `delta líneas ${formatSignedDelta(draftSummary.lineDelta)} · delta chars ${formatSignedDelta(draftSummary.charDelta)}`
                  : selectedSkill.skill_id
              }
              eyebrow="Modo de trabajo"
            >
              {selectedSkill.editable ? (
                <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap' }}>
                  {['1. Edita el borrador', '2. Calcula preview', '3. Guarda con actor visible'].map((step) => (
                    <span
                      key={step}
                      style={{
                        borderRadius: '999px',
                        padding: '4px 10px',
                        border: `1px solid ${appTheme.colors.borderSubtle}`,
                        background: appTheme.colors.bgSurface2,
                        color: appTheme.colors.textSecondary,
                        fontSize: '12px',
                        fontWeight: 600,
                      }}
                    >
                      {step}
                    </span>
                  ))}
                </div>
              ) : null}
            </StatePanel>
          ) : null}
        </div>
      </SurfaceCard>

      <section
        style={{
          display: 'grid',
          gap: '14px',
          gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))',
        }}
      >
        <SurfaceCard title="Frontera de edición" elevated eyebrow="Contrato" accent="gold">
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

        <SurfaceCard title="Estado del origen" elevated eyebrow="Enlace" accent="sky">
          <div style={{ display: 'grid', gap: '10px' }}>
            <p style={{ margin: 0, color: appTheme.colors.textSecondary }}>
              El frontend usa backend real cuando la base URL está configurada; si no, cae a un estado explícito de fuente no
              configurada sin romper el shell ni el build.
            </p>
            <StatusBadge status={mapSkillsViewStateToBadgeStatus(viewState)} />
            <span style={{ color: appTheme.colors.textSecondary, fontSize: '13px' }}>
              {apiBaseUrl ? `API base URL: ${apiBaseUrl}` : 'API base URL no configurada'}
            </span>
            {sourceNotice ? (
              <StatePanel
                status={sourceNotice.status}
                title={sourceNotice.title}
                description={sourceNotice.description}
                detail={sourceNotice.detail}
                eyebrow="Estado de fuente"
              />
            ) : (
              <StatePanel
                status="operativo"
                title="Fuente real conectada"
                description="Catálogo, detalle y auditoría están listos para operar sobre la allowlist activa sin recurrir a estados implícitos."
                detail={apiBaseUrl ? `API base URL: ${apiBaseUrl}` : null}
                eyebrow="Estado de fuente"
              />
            )}
          </div>
        </SurfaceCard>

        <SurfaceCard title="Auditoría mínima" elevated eyebrow="Rastro" accent="gold">
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
        <SurfaceCard title="Catálogo real" elevated eyebrow="Allowlist" accent="sky">
          <div style={{ display: 'grid', gap: '10px' }}>
            {sourceNotice ? (
              <StatePanel
                status={sourceNotice.status}
                title={sourceNotice.title}
                description={sourceNotice.description}
                detail={sourceNotice.detail}
                eyebrow="Catálogo"
              />
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
                  aria-pressed={isSelected}
                  style={{
                    textAlign: 'left',
                    borderRadius: '12px',
                    padding: '12px',
                    cursor: 'pointer',
                    border: `1px solid ${isSelected ? appTheme.colors.brandSky500 : skill.editable ? appTheme.colors.stateSuccess : appTheme.colors.borderSubtle}`,
                    background: isSelected ? appTheme.colors.bgSurface2 : appTheme.colors.bgSurface1,
                    color: appTheme.colors.textPrimary,
                    display: 'grid',
                    gap: '8px',
                    boxShadow: skill.editable ? `inset 3px 0 0 ${appTheme.colors.stateSuccess}` : 'none',
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
                        color: skill.editable ? appTheme.colors.stateSuccess : appTheme.colors.brandSky500,
                        background: skill.editable ? 'rgba(63, 175, 107, 0.12)' : 'transparent',
                        fontSize: '12px',
                        fontWeight: 600,
                      }}
                    >
                      {getSkillExposureLabel(skill.editable ? 'allowlisted-edit' : 'read-only-reference')}
                    </span>
                    <StatusBadge status={mapRiskToBadgeStatus(skill.public_repo_risk)} />
                  </div>
                  <span style={{ color: appTheme.colors.textMuted, fontSize: '12px' }}>
                    {skill.editable
                      ? 'Permite editar borrador, calcular diff y guardar con auditoría visible.'
                      : 'Se consulta como referencia; no abre flujo productivo de guardado.'}
                  </span>
                </button>
              )
            })}
          </div>
        </SurfaceCard>

        <div style={{ display: 'grid', gap: '14px' }}>
          <SurfaceCard
            title={selectedSkill?.editable ? 'Editor allowlisted' : selectedSkill ? 'Detalle de referencia' : 'Editor allowlisted'}
            elevated
            eyebrow={selectedSkill?.editable ? 'Forja' : selectedSkill ? 'Referencia' : 'Forja'}
            accent={selectedSkill?.editable ? 'success' : selectedSkill ? 'sky' : 'success'}
          >
            {selectedSkill ? (
              <div style={{ display: 'grid', gap: '12px' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', gap: '10px', flexWrap: 'wrap' }}>
                  <strong style={{ fontSize: '18px' }}>{selectedSkill.display_name}</strong>
                  <StatusBadge status={mapCatalogSkillToBadgeStatus(selectedSkill)} />
                </div>

                <div
                  style={{
                    display: 'grid',
                    gap: '10px',
                    padding: '14px',
                    borderRadius: '12px',
                    border: `1px solid ${selectedSkill.editable ? appTheme.colors.stateSuccess : appTheme.colors.borderSubtle}`,
                    background: selectedSkill.editable ? 'rgba(63, 175, 107, 0.08)' : appTheme.colors.bgSurface1,
                  }}
                >
                  <div style={{ display: 'flex', justifyContent: 'space-between', gap: '10px', flexWrap: 'wrap', alignItems: 'center' }}>
                    <span style={{ color: appTheme.colors.textMuted, fontSize: '12px', fontWeight: 700 }}>Modo activo</span>
                    <span
                      style={{
                        borderRadius: '999px',
                        padding: '4px 10px',
                        border: `1px solid ${appTheme.colors.borderSubtle}`,
                        color: selectedSkill.editable ? appTheme.colors.stateSuccess : appTheme.colors.textSecondary,
                        fontSize: '12px',
                        fontWeight: 700,
                      }}
                    >
                      {selectedSkill.editable ? 'Edición controlada' : 'Referencia read-only'}
                    </span>
                  </div>
                  <p style={{ margin: 0, color: appTheme.colors.textSecondary }}>
                    {selectedSkill.editable
                      ? 'Este panel funciona como editor productivo: permite tocar el borrador, calcular preview y guardar con auditoría visible.'
                      : 'Esta vista conserva la lectura del contenido y el rastro auditado, pero no abre escritura productiva.'}
                  </p>
                  {selectedSkill.editable ? (
                    <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap' }}>
                      <span style={{ color: appTheme.colors.textMuted, fontSize: '12px' }}>Actor: <strong style={{ color: appTheme.colors.textSecondary }}>{normalizedActor || 'sin definir'}</strong></span>
                      <span style={{ color: appTheme.colors.textMuted, fontSize: '12px' }}>Draft: <strong style={{ color: appTheme.colors.textSecondary }}>{hasDraftChanges ? 'cambios pendientes' : 'sin cambios'}</strong></span>
                      <span style={{ color: appTheme.colors.textMuted, fontSize: '12px' }}>Guardar: <strong style={{ color: appTheme.colors.textSecondary }}>{canSave ? 'habilitado' : 'bloqueado'}</strong></span>
                    </div>
                  ) : (
                    <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap' }}>
                      <span style={{ color: appTheme.colors.textMuted, fontSize: '12px' }}>Lectura: <strong style={{ color: appTheme.colors.textSecondary }}>solo referencia</strong></span>
                      <span style={{ color: appTheme.colors.textMuted, fontSize: '12px' }}>Preview: <strong style={{ color: appTheme.colors.textSecondary }}>no aplica</strong></span>
                      <span style={{ color: appTheme.colors.textMuted, fontSize: '12px' }}>Guardado: <strong style={{ color: appTheme.colors.textSecondary }}>deshabilitado por diseño</strong></span>
                    </div>
                  )}
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
                      ? 'Guardado productivo habilitado con actor visible y control de fingerprint.'
                      : 'Skill de solo referencia: se consulta y se puede recargar, pero no abre preview ni guardado.'}
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

                {selectedSkill.editable ? (
                  <>
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
                        disabled={saveState === 'saving'}
                        style={{
                          borderRadius: '12px',
                          border: `1px solid ${appTheme.colors.borderSubtle}`,
                          background: appTheme.colors.bgSurface1,
                          color: appTheme.colors.textPrimary,
                          padding: '12px 14px',
                        }}
                      />
                    </div>

                    <div style={{ display: 'grid', gap: '6px' }}>
                      <div style={{ display: 'flex', justifyContent: 'space-between', gap: '10px', flexWrap: 'wrap', alignItems: 'center' }}>
                        <span style={{ color: appTheme.colors.textMuted, fontSize: '13px' }}>Editor del borrador</span>
                        {draftSummary ? (
                          <span style={{ color: appTheme.colors.textMuted, fontSize: '12px' }}>
                            líneas {formatSignedDelta(draftSummary.lineDelta)} · chars {formatSignedDelta(draftSummary.charDelta)}
                          </span>
                        ) : null}
                      </div>
                      <textarea
                        value={draftContent}
                        onChange={(event) => handleDraftChange(event.target.value)}
                        disabled={saveState === 'saving'}
                        style={{
                          minHeight: '240px',
                          borderRadius: '12px',
                          border: `1px solid ${appTheme.colors.borderSubtle}`,
                          background: appTheme.colors.bgSurface1,
                          color: appTheme.colors.textSecondary,
                          padding: '14px',
                          resize: 'vertical',
                          fontFamily: 'ui-monospace, SFMono-Regular, Menlo, monospace',
                        }}
                      />
                    </div>

                    <div
                      style={{
                        display: 'grid',
                        gap: '10px',
                        padding: '12px',
                        borderRadius: '12px',
                        background: appTheme.colors.bgSurface1,
                        border: `1px solid ${appTheme.colors.stateSuccess}`,
                      }}
                    >
                      <div style={{ display: 'flex', justifyContent: 'space-between', gap: '10px', flexWrap: 'wrap' }}>
                        <strong style={{ fontSize: '14px' }}>Acciones de edición</strong>
                        <span style={{ color: appTheme.colors.textMuted, fontSize: '12px' }}>Preview antes de guardar</span>
                      </div>
                      <div style={{ display: 'flex', gap: '10px', flexWrap: 'wrap' }}>
                        <button
                          type="button"
                          onClick={handlePreviewDiff}
                          disabled={!hasDraftChanges || previewState === 'loading' || saveState === 'saving'}
                          style={{
                            borderRadius: '999px',
                            border: 'none',
                            padding: '10px 16px',
                            cursor: !hasDraftChanges ? 'not-allowed' : 'pointer',
                            background: appTheme.colors.brandBlue700,
                            color: appTheme.colors.textPrimary,
                            fontWeight: 700,
                            opacity: !hasDraftChanges ? 0.55 : 1,
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
                          disabled={!hasDraftChanges || saveState === 'saving'}
                          style={{
                            borderRadius: '999px',
                            border: `1px solid ${appTheme.colors.borderSubtle}`,
                            padding: '10px 16px',
                            cursor: !hasDraftChanges ? 'not-allowed' : 'pointer',
                            background: appTheme.colors.bgSurface1,
                            color: appTheme.colors.textSecondary,
                            fontWeight: 700,
                            opacity: !hasDraftChanges ? 0.55 : 1,
                          }}
                        >
                          Reset borrador
                        </button>
                        <button
                          type="button"
                          onClick={handleReloadSkill}
                          disabled={saveState === 'saving'}
                          style={{
                            borderRadius: '999px',
                            border: `1px solid ${appTheme.colors.borderSubtle}`,
                            padding: '10px 16px',
                            cursor: 'pointer',
                            background: appTheme.colors.bgSurface2,
                            color: appTheme.colors.textSecondary,
                            fontWeight: 700,
                          }}
                        >
                          Recargar skill
                        </button>
                      </div>
                    </div>

                    {!hasDraftChanges ? (
                      <p style={{ margin: 0, color: appTheme.colors.textSecondary }}>
                        Modifica el borrador para habilitar preview y guardado controlado.
                      </p>
                    ) : !normalizedActor ? (
                      <p style={{ margin: 0, color: appTheme.colors.stateDanger }}>
                        El actor visible es obligatorio para poder guardar y auditar la operación.
                      </p>
                    ) : null}
                  </>
                ) : (
                  <>
                    <div style={{ display: 'grid', gap: '6px' }}>
                      <span style={{ color: appTheme.colors.textMuted, fontSize: '13px' }}>Contenido de referencia</span>
                      <textarea
                        value={draftContent}
                        readOnly
                        style={{
                          minHeight: '240px',
                          borderRadius: '12px',
                          border: `1px solid ${appTheme.colors.borderSubtle}`,
                          background: appTheme.colors.bgSurface2,
                          color: appTheme.colors.textSecondary,
                          padding: '14px',
                          resize: 'vertical',
                          fontFamily: 'ui-monospace, SFMono-Regular, Menlo, monospace',
                        }}
                      />
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
                      <div style={{ display: 'flex', justifyContent: 'space-between', gap: '10px', flexWrap: 'wrap' }}>
                        <strong style={{ fontSize: '14px' }}>Acciones disponibles</strong>
                        <span style={{ color: appTheme.colors.textMuted, fontSize: '12px' }}>Lectura y sincronización</span>
                      </div>
                      <div style={{ display: 'flex', gap: '10px', flexWrap: 'wrap' }}>
                        <button
                          type="button"
                          onClick={handleReloadSkill}
                          disabled={saveState === 'saving'}
                          style={{
                            borderRadius: '999px',
                            border: `1px solid ${appTheme.colors.borderSubtle}`,
                            padding: '10px 16px',
                            cursor: saveState === 'saving' ? 'not-allowed' : 'pointer',
                            background: appTheme.colors.bgSurface2,
                            color: appTheme.colors.textSecondary,
                            fontWeight: 700,
                            opacity: saveState === 'saving' ? 0.55 : 1,
                          }}
                        >
                          Recargar skill
                        </button>
                      </div>
                    </div>

                    <StatePanel
                      status="revision"
                      title="Skill de referencia"
                      description="Este detalle forma parte del catálogo visible, pero no pertenece a la frontera productiva de edición del MVP."
                      eyebrow="Solo lectura"
                    />
                  </>
                )}
              </div>
            ) : viewState === 'ready' ? (
              <StatePanel
                status="sin-datos"
                title="Sin skill seleccionada"
                description="Selecciona una entrada del catálogo allowlisted para cargar su detalle real y habilitar el flujo controlado de preview/guardado."
                eyebrow="Estado vacío"
              />
            ) : (
              <StatePanel
                status={sourceNotice?.status ?? 'revision'}
                title={sourceNotice?.title ?? 'Detalle pendiente de fuente real'}
                description={sourceNotice?.description ?? 'El detalle aparecerá aquí cuando la fuente real esté disponible.'}
                detail={sourceNotice?.detail ?? null}
                eyebrow="Estado de detalle"
              />
            )}
          </SurfaceCard>

          <SurfaceCard title="Preview, conflicto y auditoría" elevated eyebrow="Cierre" accent="gold">
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
                    Último guardado: {formatTimestamp(lastSavedAudit.timestamp)} · resultado {lastSavedAudit.result}
                  </span>
                ) : null}
              </div>

              {previewState === 'error' && previewError ? (
                <StatePanel
                  status="incidencia"
                  title="Preview no disponible"
                  description="El backend no pudo calcular el diff solicitado. La UI mantiene el estado explícito para evitar errores silenciosos."
                  detail={previewError}
                  eyebrow="Estado de preview"
                />
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
              ) : previewState === 'error' ? null : (
                <StatePanel
                  status={selectedSkill?.editable ? 'sin-datos' : 'revision'}
                  title={selectedSkill?.editable ? 'Sin preview solicitado todavía' : 'Preview deshabilitado para esta skill'}
                  description={
                    selectedSkill?.editable
                      ? 'El preview de diff aparecerá aquí cuando prepares cambios sobre una skill editable y lo solicites al backend.'
                      : 'Las skills de solo referencia muestran contenido, pero no exponen preview de diff ni guardado productivo.'
                  }
                  eyebrow="Estado vacío"
                />
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
                  <StatePanel
                    status="sin-datos"
                    title="Sin auditoría resumida visible"
                    description="Todavía no hay rastro auditado para la skill seleccionada o la fuente sigue vacía. La ausencia se expresa de forma explícita para no confundirla con un fallo silencioso."
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

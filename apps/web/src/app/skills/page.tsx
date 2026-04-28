'use client'

import { Fragment, useEffect, useMemo, useState, type ReactElement } from 'react'

import type { SkillAuditRecord, SkillCatalogItem, SkillDetail, SkillPreviewResponse } from '@contracts/skills'

import {
  fetchSkillDetail,
  fetchSkillPreview,
  fetchSkillsAudit,
  fetchSkillsCatalog,
  getSkillsApiConnectionLabel,
  SkillsApiError,
  updateSkill,
} from '@/modules/skills/api/skills-http'
import { mapSkillsViewStateToBadgeStatus } from '@/modules/skills/view-models/skill-surface.mappers'
import { PageHeader } from '@/shared/ui/app-shell/PageHeader'
import { SurfaceCard } from '@/shared/ui/cards/SurfaceCard'
import { StatePanel } from '@/shared/ui/state/StatePanel'
import { SourceStatePills } from '@/shared/ui/status/SourceStatePills'
import { StatusBadge } from '@/shared/ui/status/StatusBadge'
import { appTheme, type AppStatus } from '@/shared/theme/tokens'

type SkillsViewState = 'loading' | 'ready' | 'empty' | 'error' | 'not_configured'
type PreviewState = 'idle' | 'loading' | 'ready' | 'error'
type SaveState = 'idle' | 'saving' | 'success' | 'stale' | 'error'
type WorkspaceMode = 'reader' | 'editor'

// Guardrail note: Skills uses BFF same-origin and server-only MUGIWARA_CONTROL_PANEL_API_URL; never expose backend URL to the browser.
const GLOBAL_SOURCE = 'global'
const RUNTIME_SOURCE = 'runtime'

const MUGIWARA_OPTIONS = [
  { slug: 'luffy', label: 'Luffy' },
  { slug: 'zoro', label: 'Zoro' },
  { slug: 'franky', label: 'Franky' },
  { slug: 'chopper', label: 'Chopper' },
  { slug: 'usopp', label: 'Usopp' },
  { slug: 'nami', label: 'Nami' },
  { slug: 'robin', label: 'Robin' },
  { slug: 'brook', label: 'Brook' },
  { slug: 'jinbe', label: 'Jinbe' },
  { slug: 'sanji', label: 'Sanji' },
] as const

type MugiwaraSkillSlug = (typeof MUGIWARA_OPTIONS)[number]['slug']
type SkillSourceSlug = typeof GLOBAL_SOURCE | typeof RUNTIME_SOURCE | MugiwaraSkillSlug

function isMugiwaraSkillSlug(value: string | null): value is MugiwaraSkillSlug {
  return MUGIWARA_OPTIONS.some((option) => option.slug === value)
}

function isSkillSourceSlug(value: string | null): value is SkillSourceSlug {
  return value === GLOBAL_SOURCE || value === RUNTIME_SOURCE || isMugiwaraSkillSlug(value)
}

function getInitialSourceSlug(): SkillSourceSlug {
  if (typeof window === 'undefined') {
    return GLOBAL_SOURCE
  }

  const params = new URLSearchParams(window.location.search)
  const source = params.get('source')
  const mugiwara = params.get('mugiwara')

  if (isSkillSourceSlug(source)) {
    return source
  }

  return isMugiwaraSkillSlug(mugiwara) ? mugiwara : GLOBAL_SOURCE
}

function getSourceLabel(sourceSlug: SkillSourceSlug) {
  if (sourceSlug === GLOBAL_SOURCE) {
    return 'Globales'
  }

  if (sourceSlug === RUNTIME_SOURCE) {
    return 'Runtime'
  }

  return MUGIWARA_OPTIONS.find((option) => option.slug === sourceSlug)?.label ?? sourceSlug
}

function getSkillSourceOptions(catalog: SkillCatalogItem[]) {
  const ownerSlugs = new Set(catalog.map((skill) => skill.owner_slug))
  const options: Array<{ slug: SkillSourceSlug; label: string; count: number }> = []

  if (ownerSlugs.has(GLOBAL_SOURCE)) {
    options.push({ slug: GLOBAL_SOURCE, label: 'Globales', count: catalog.filter((skill) => skill.owner_slug === GLOBAL_SOURCE).length })
  }

  for (const option of MUGIWARA_OPTIONS) {
    if (ownerSlugs.has(option.slug)) {
      options.push({ slug: option.slug, label: option.label, count: catalog.filter((skill) => skill.owner_slug === option.slug).length })
    }
  }

  if (ownerSlugs.has(RUNTIME_SOURCE)) {
    options.push({ slug: RUNTIME_SOURCE, label: 'Runtime', count: catalog.filter((skill) => skill.owner_slug === RUNTIME_SOURCE).length })
  }

  return options
}

function getSkillsForSource(catalog: SkillCatalogItem[], sourceSlug: SkillSourceSlug) {
  return catalog.filter((skill) => skill.owner_slug === sourceSlug).sort((a, b) => a.display_name.localeCompare(b.display_name, 'es'))
}

function getPreferredSkillId(skills: SkillCatalogItem[]) {
  return skills[0]?.skill_id ?? null
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

function getLatestAuditForSkill(audit: SkillAuditRecord[], skillId: string) {
  return audit.find((item) => item.skill_id === skillId) ?? null
}

function getSkillAuditActor(skill: Pick<SkillCatalogItem | SkillDetail, 'owner_scope' | 'owner_slug'>) {
  if (skill.owner_scope === 'shared' || skill.owner_slug === GLOBAL_SOURCE) {
    return 'luffy'
  }

  return skill.owner_slug
}

function getSkillOwnerDisplay(skill: Pick<SkillCatalogItem | SkillDetail, 'owner_label' | 'owner_scope' | 'owner_slug'>) {
  if (skill.owner_scope === 'shared' || skill.owner_slug === GLOBAL_SOURCE) {
    return 'Luffy · skills globales'
  }

  return skill.owner_label
}

function getEditableSkillCopy() {
  return {
    status: 'operativo' as const,
    label: 'Editable',
  }
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

function getSkillsViewNotice(state: SkillsViewState, connectionLabel: string, errorMessage: string | null) {
  switch (state) {
    case 'loading':
      return {
        status: 'revision' as const,
        title: 'Cargando skills',
        description: 'Estoy cargando fuentes, catálogo y auditoría mediante la frontera BFF same-origin.',
        detail: `Conexión: ${connectionLabel}`,
      }
    case 'not_configured':
      return {
        status: 'revision' as const,
        title: 'Skills no está conectado al backend',
        description: 'Falta configurar la fuente server-only. Sin catálogo real no hay selección ni edición.',
        detail: 'BFF same-origin conservado; la URL interna no se expone al navegador.',
      }
    case 'error':
      return {
        status: 'incidencia' as const,
        title: 'Skills no puede cargar la fuente real',
        description: 'La fuente real no permite cargar catálogo o detalle con garantías.',
        detail: errorMessage ?? 'Error saneado sin URL interna ni salidas crudas.',
      }
    case 'empty':
      return {
        status: 'sin-datos' as const,
        title: 'No hay skills visibles',
        description: 'El backend respondió, pero la allowlist no devolvió entradas para seleccionar.',
        detail: `Conexión: ${connectionLabel}`,
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

function renderInlineMarkdown(text: string) {
  const segments = text.split(/(`[^`]+`|\*\*[^*]+\*\*)/g).filter(Boolean)

  return segments.map((segment, index) => {
    if (segment.startsWith('`') && segment.endsWith('`')) {
      return (
        <code key={`${segment}-${index}`} className="responsive-code" style={{ padding: '1px 5px', borderRadius: '6px', background: appTheme.colors.bgSurface1 }}>
          {segment.slice(1, -1)}
        </code>
      )
    }

    if (segment.startsWith('**') && segment.endsWith('**')) {
      return <strong key={`${segment}-${index}`}>{segment.slice(2, -2)}</strong>
    }

    return <Fragment key={`${segment}-${index}`}>{segment}</Fragment>
  })
}

function MarkdownReader({ content }: { content: string }) {
  const blocks: ReactElement[] = []
  const lines = content.split('\n')
  let listItems: string[] = []
  let orderedListItems: string[] = []
  let codeLines: string[] = []
  let inCodeBlock = false

  function flushList() {
    if (listItems.length > 0) {
      const items = listItems
      listItems = []
      blocks.push(
        <ul key={`list-${blocks.length}`} style={{ margin: 0, paddingLeft: '20px', display: 'grid', gap: '6px' }}>
          {items.map((item, index) => (
            <li key={`${item}-${index}`}>{renderInlineMarkdown(item)}</li>
          ))}
        </ul>,
      )
    }

    if (orderedListItems.length > 0) {
      const items = orderedListItems
      orderedListItems = []
      blocks.push(
        <ol key={`ordered-list-${blocks.length}`} style={{ margin: 0, paddingLeft: '22px', display: 'grid', gap: '6px' }}>
          {items.map((item, index) => (
            <li key={`${item}-${index}`}>{renderInlineMarkdown(item)}</li>
          ))}
        </ol>,
      )
    }
  }

  function flushCode() {
    if (codeLines.length === 0) {
      return
    }

    const code = codeLines.join('\n')
    codeLines = []
    blocks.push(
      <pre key={`code-${blocks.length}`} className="responsive-code" style={{ margin: 0, padding: '12px', borderRadius: '12px', background: appTheme.colors.bgSurface1, color: appTheme.colors.textSecondary }}>
        {code}
      </pre>,
    )
  }

  for (const rawLine of lines) {
    const line = rawLine.trimEnd()

    if (line.startsWith('```')) {
      if (inCodeBlock) {
        inCodeBlock = false
        flushCode()
      } else {
        flushList()
        inCodeBlock = true
      }
      continue
    }

    if (inCodeBlock) {
      codeLines.push(rawLine)
      continue
    }

    if (!line.trim()) {
      flushList()
      continue
    }

    const headingMatch = line.match(/^(#{1,3})\s+(.+)$/)
    if (headingMatch) {
      flushList()
      const level = headingMatch[1].length
      const headingContent = renderInlineMarkdown(headingMatch[2])
      if (level === 1) {
        blocks.push(<h2 key={`heading-${blocks.length}`} className="text-break" style={{ margin: 0, color: appTheme.colors.textPrimary }}>{headingContent}</h2>)
      } else if (level === 2) {
        blocks.push(<h3 key={`heading-${blocks.length}`} className="text-break" style={{ margin: 0, color: appTheme.colors.textPrimary }}>{headingContent}</h3>)
      } else {
        blocks.push(<h4 key={`heading-${blocks.length}`} className="text-break" style={{ margin: 0, color: appTheme.colors.textPrimary }}>{headingContent}</h4>)
      }
      continue
    }

    const listMatch = line.match(/^[-*]\s+(.+)$/)
    if (listMatch) {
      if (orderedListItems.length > 0) {
        flushList()
      }
      listItems.push(listMatch[1])
      continue
    }

    const orderedListMatch = line.match(/^\d+\.\s+(.+)$/)
    if (orderedListMatch) {
      if (listItems.length > 0) {
        flushList()
      }
      orderedListItems.push(orderedListMatch[1])
      continue
    }

    flushList()
    blocks.push(
      <p key={`paragraph-${blocks.length}`} className="text-break" style={{ margin: 0, color: appTheme.colors.textSecondary, lineHeight: 1.6 }}>
        {renderInlineMarkdown(line)}
      </p>,
    )
  }

  flushList()
  flushCode()

  return <div style={{ display: 'grid', gap: '12px', minWidth: 0 }}>{blocks}</div>
}

export default function SkillsPage() {
  const apiConnectionLabel = getSkillsApiConnectionLabel()
  const [viewState, setViewState] = useState<SkillsViewState>('loading')
  const [errorMessage, setErrorMessage] = useState<string | null>(null)
  const [catalog, setCatalog] = useState<SkillCatalogItem[]>([])
  const [selectedSourceSlug, setSelectedSourceSlug] = useState<SkillSourceSlug>(() => getInitialSourceSlug())
  const [selectedSkillId, setSelectedSkillId] = useState<string | null>(null)
  const [selectedSkill, setSelectedSkill] = useState<SkillDetail | null>(null)
  const [workspaceMode, setWorkspaceMode] = useState<WorkspaceMode>('reader')
  const [audit, setAudit] = useState<SkillAuditRecord[]>([])
  const [draftContent, setDraftContent] = useState('')
  const [previewState, setPreviewState] = useState<PreviewState>('idle')
  const [previewError, setPreviewError] = useState<string | null>(null)
  const [previewResponse, setPreviewResponse] = useState<SkillPreviewResponse['data'] | null>(null)
  const [saveState, setSaveState] = useState<SaveState>('idle')
  const [saveMessage, setSaveMessage] = useState<string | null>(null)
  const [lastSavedAudit, setLastSavedAudit] = useState<SkillAuditRecord | null>(null)

  useEffect(() => {
    let cancelled = false

    async function loadCatalog() {
      setViewState('loading')
      setErrorMessage(null)

      try {
        const [catalogResponse, auditResponse] = await Promise.all([fetchSkillsCatalog(), fetchSkillsAudit()])

        if (cancelled) {
          return
        }

        const items = catalogResponse.data.items
        const initialSource = getInitialSourceSlug()
        const sourceExists = items.some((item) => item.owner_slug === initialSource)
        const nextSource = sourceExists ? initialSource : (items[0]?.owner_slug as SkillSourceSlug | undefined) ?? GLOBAL_SOURCE
        const sourceSkills = getSkillsForSource(items, nextSource)

        setCatalog(items)
        setAudit(auditResponse.data.items)
        setSelectedSourceSlug(nextSource)

        if (items.length === 0) {
          setSelectedSkillId(null)
          setSelectedSkill(null)
          setViewState('empty')
          return
        }

        setSelectedSkillId((current) => (current && sourceSkills.some((item) => item.skill_id === current) ? current : getPreferredSkillId(sourceSkills)))
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
  }, [])

  useEffect(() => {
    let cancelled = false

    async function loadDetail() {
      if (!selectedSkillId || !['ready', 'loading'].includes(viewState)) {
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
  }, [selectedSkillId, viewState])

  useEffect(() => {
    if (!selectedSkill) {
      setDraftContent('')
      resetFeedbackState()
      return
    }

    setDraftContent(selectedSkill.content)
    resetFeedbackState()
  }, [selectedSkill])

  const sourceOptions = useMemo(() => getSkillSourceOptions(catalog), [catalog])
  const sourceSkills = useMemo(() => getSkillsForSource(catalog, selectedSourceSlug), [catalog, selectedSourceSlug])
  const selectedSourceLabel = getSourceLabel(selectedSourceSlug)

  const latestAudit = useMemo(() => {
    if (!selectedSkill) {
      return null
    }

    return getLatestAuditForSkill(audit, selectedSkill.skill_id)
  }, [audit, selectedSkill])

  const sourceNotice = getSkillsViewNotice(viewState, apiConnectionLabel, errorMessage)
  const isRootUnavailable = viewState === 'not_configured' || viewState === 'error'
  const hasDraftChanges = selectedSkill ? draftContent !== selectedSkill.content : false
  const selectedSkillActor = selectedSkill ? getSkillAuditActor(selectedSkill) : ''
  const selectedSkillOwner = selectedSkill ? getSkillOwnerDisplay(selectedSkill) : ''
  const editableSkillCopy = selectedSkill ? getEditableSkillCopy() : null
  const canSave = Boolean(selectedSkill?.editable && hasDraftChanges && selectedSkillActor && saveState !== 'saving')
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

  function updateUrlForSource(sourceSlug: SkillSourceSlug) {
    const nextUrl = new URL(window.location.href)
    nextUrl.searchParams.delete('mugiwara')
    nextUrl.searchParams.set('source', sourceSlug)
    window.history.replaceState(null, '', `${nextUrl.pathname}?${nextUrl.searchParams.toString()}`)
  }

  function handleSelectSource(sourceSlug: SkillSourceSlug) {
    setSelectedSourceSlug(sourceSlug)
    updateUrlForSource(sourceSlug)
    const nextSkills = getSkillsForSource(catalog, sourceSlug)
    setSelectedSkillId(getPreferredSkillId(nextSkills))
    setSelectedSkill(null)
    setWorkspaceMode('reader')
    resetFeedbackState()
  }

  function handleSelectSkill(skillId: string) {
    setSelectedSkillId(skillId || null)
    setSelectedSkill(null)
    setWorkspaceMode('reader')
    resetFeedbackState()
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

    if (!selectedSkillActor) {
      setSaveState('error')
      setSaveMessage('La skill no tiene dueño de edición calculado.')
      return
    }

    setSaveState('saving')
    setSaveMessage('Aplicando guardado controlado en backend…')
    setLastSavedAudit(null)

    try {
      const response = await updateSkill(selectedSkill.skill_id, {
        actor: selectedSkillActor,
        content: draftContent,
        expected_sha256: selectedSkill.fingerprint.sha256,
      })
      setSelectedSkill(response.data.skill)
      setAudit((current) => [response.data.audit, ...current.filter((item) => item.timestamp !== response.data.audit.timestamp)])
      setSaveState('success')
      setSaveMessage(`Guardado aplicado sobre ${response.data.skill.skill_id} por ${response.data.audit.actor}.`)
      setLastSavedAudit(response.data.audit)
      setWorkspaceMode('reader')
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
        subtitle="Selecciona una fuente, elige una skill y alterna entre lectura Markdown y edición controlada."
        detailPills={["Globales o Mugiwara", "Lector Markdown", "Editor auditado"]}
      />

      {sourceNotice ? (
        <SurfaceCard title={sourceNotice.title} elevated eyebrow="Estado" accent={viewState === 'error' ? 'danger' : 'sky'}>
          <StatePanel
            status={sourceNotice.status}
            title={sourceNotice.title}
            description={sourceNotice.description}
            detail={sourceNotice.detail}
            eyebrow="Fuente"
            ariaRole={viewState === 'error' ? 'alert' : 'status'}
          >
            <SourceStatePills
              items={
                viewState === 'ready'
                  ? [{ label: 'API real conectada', tone: 'connected' }]
                  : [{ label: viewState === 'not_configured' ? 'Fuente no configurada' : viewState === 'error' ? 'Error/degradado' : 'Cargando', tone: viewState === 'not_configured' ? 'not-configured' : viewState === 'error' ? 'degraded' : 'snapshot' }]
              }
            />
          </StatePanel>
        </SurfaceCard>
      ) : null}

      <SurfaceCard title="Selector de skills" elevated eyebrow="Fuente y skill" accent="sky">
        <div className="layout-grid layout-grid--cards-280" style={{ gap: '14px', alignItems: 'end' }}>
          <label style={{ display: 'grid', gap: '8px', minWidth: 0 }}>
            <span style={{ color: appTheme.colors.textMuted, fontSize: '13px', fontWeight: 700 }}>Fuente</span>
            <select
              value={selectedSourceSlug}
              onChange={(event) => handleSelectSource(event.target.value as SkillSourceSlug)}
              disabled={isRootUnavailable || catalog.length === 0}
              style={{ borderRadius: '12px', border: `1px solid ${appTheme.colors.borderSubtle}`, background: appTheme.colors.bgSurface1, color: appTheme.colors.textPrimary, padding: '12px 14px' }}
            >
              {sourceOptions.map((option) => (
                <option key={option.slug} value={option.slug}>{`${option.label} (${option.count})`}</option>
              ))}
            </select>
          </label>

          <label style={{ display: 'grid', gap: '8px', minWidth: 0 }}>
            <span style={{ color: appTheme.colors.textMuted, fontSize: '13px', fontWeight: 700 }}>Skill</span>
            <select
              value={selectedSkillId ?? ''}
              onChange={(event) => handleSelectSkill(event.target.value)}
              disabled={isRootUnavailable || sourceSkills.length === 0}
              style={{ borderRadius: '12px', border: `1px solid ${appTheme.colors.borderSubtle}`, background: appTheme.colors.bgSurface1, color: appTheme.colors.textPrimary, padding: '12px 14px' }}
            >
              {sourceSkills.length === 0 ? <option value="">Sin skills en esta fuente</option> : null}
              {sourceSkills.map((skill) => (
                <option key={skill.skill_id} value={skill.skill_id}>{skill.display_name}</option>
              ))}
            </select>
          </label>

          <div style={{ display: 'grid', gap: '8px', minWidth: 0 }}>
            <span style={{ color: appTheme.colors.textMuted, fontSize: '13px', fontWeight: 700 }}>Resumen</span>
            <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap' }}>
              <StatusBadge status={mapSkillsViewStateToBadgeStatus(viewState)} />
              <span style={{ borderRadius: '999px', padding: '4px 10px', border: `1px solid ${appTheme.colors.borderSubtle}`, color: appTheme.colors.brandSky500, fontSize: '12px', fontWeight: 700 }}>
                {selectedSourceLabel}: {sourceSkills.length}
              </span>
              <span style={{ borderRadius: '999px', padding: '4px 10px', border: `1px solid ${appTheme.colors.borderSubtle}`, color: appTheme.colors.textSecondary, fontSize: '12px', fontWeight: 700 }}>
                {apiConnectionLabel}
              </span>
            </div>
          </div>
        </div>
      </SurfaceCard>

      <SurfaceCard title={selectedSkill?.display_name ?? 'Lector / editor'} elevated eyebrow="Ventana" accent={workspaceMode === 'editor' ? 'success' : 'sky'}>
        {selectedSkill ? (
          <div style={{ display: 'grid', gap: '14px', minWidth: 0 }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', gap: '12px', flexWrap: 'wrap', alignItems: 'center' }}>
              <div style={{ display: 'grid', gap: '6px', minWidth: 0 }}>
                <span className="text-break" style={{ color: appTheme.colors.textSecondary, fontSize: '13px' }}>{selectedSkill.skill_id}</span>
              </div>
              <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap', alignItems: 'center' }}>
                {editableSkillCopy ? <StatusBadge status={editableSkillCopy.status} label={editableSkillCopy.label} /> : null}
                <button
                  type="button"
                  onClick={() => setWorkspaceMode('reader')}
                  aria-pressed={workspaceMode === 'reader'}
                  style={{ borderRadius: '999px', border: `1px solid ${workspaceMode === 'reader' ? appTheme.colors.brandSky500 : appTheme.colors.borderSubtle}`, background: workspaceMode === 'reader' ? appTheme.colors.bgSurface2 : 'transparent', color: workspaceMode === 'reader' ? appTheme.colors.brandSky500 : appTheme.colors.textSecondary, padding: '8px 12px', fontWeight: 700, cursor: 'pointer' }}
                >
                  Lector
                </button>
                <button
                  type="button"
                  onClick={() => setWorkspaceMode('editor')}
                  aria-pressed={workspaceMode === 'editor'}
                  style={{ borderRadius: '999px', border: `1px solid ${workspaceMode === 'editor' ? appTheme.colors.stateSuccess : appTheme.colors.borderSubtle}`, background: workspaceMode === 'editor' ? 'rgba(63, 175, 107, 0.12)' : 'transparent', color: workspaceMode === 'editor' ? appTheme.colors.stateSuccess : appTheme.colors.textSecondary, padding: '8px 12px', fontWeight: 700, cursor: 'pointer' }}
                >
                  Editor
                </button>
              </div>
            </div>

            <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap' }}>
              <span style={{ color: appTheme.colors.textSecondary, fontSize: '13px' }}>Fuente: <strong>{selectedSkillOwner}</strong></span>
              <span style={{ color: appTheme.colors.textSecondary, fontSize: '13px' }}>bytes: <strong>{selectedSkill.fingerprint.bytes}</strong></span>
              <span style={{ color: appTheme.colors.textSecondary, fontSize: '13px' }}>fingerprint: <strong>{selectedSkill.fingerprint.sha256.slice(0, 12)}…</strong></span>
            </div>

            {workspaceMode === 'reader' ? (
              <div style={{ borderRadius: '16px', border: `1px solid ${appTheme.colors.borderSubtle}`, background: appTheme.colors.bgSurface1, padding: '18px', minWidth: 0, maxHeight: '68vh', overflowY: 'auto' }}>
                <MarkdownReader content={selectedSkill.content} />
              </div>
            ) : (
              <div style={{ display: 'grid', gap: '12px', minWidth: 0 }}>
                <div className="layout-grid layout-grid--cards-180" style={{ gap: '10px' }}>
                  <div style={{ display: 'grid', gap: '6px', minWidth: 0 }}>
                    <span style={{ color: appTheme.colors.textMuted, fontSize: '13px' }}>Dueño / actor de guardado</span>
                    <strong style={{ color: appTheme.colors.textPrimary }}>{selectedSkillActor}</strong>
                    <span style={{ color: appTheme.colors.textMuted, fontSize: '12px' }}>{selectedSkillOwner}</span>
                  </div>
                  <div style={{ display: 'grid', gap: '6px', minWidth: 0 }}>
                    <span style={{ color: appTheme.colors.textMuted, fontSize: '13px' }}>Estado del borrador</span>
                    <strong style={{ color: hasDraftChanges ? appTheme.colors.stateWarning : appTheme.colors.stateSuccess }}>{hasDraftChanges ? 'cambios pendientes' : 'sin cambios'}</strong>
                    {draftSummary ? <span style={{ color: appTheme.colors.textMuted, fontSize: '12px' }}>líneas {formatSignedDelta(draftSummary.lineDelta)} · chars {formatSignedDelta(draftSummary.charDelta)}</span> : null}
                  </div>
                  <div style={{ display: 'grid', gap: '6px', minWidth: 0 }}>
                    <span style={{ color: appTheme.colors.textMuted, fontSize: '13px' }}>Guardado</span>
                    <StatusBadge status={getSaveStateStatus(saveState)} />
                  </div>
                </div>

                <textarea
                  value={draftContent}
                  onChange={(event) => handleDraftChange(event.target.value)}
                  readOnly={!selectedSkill.editable}
                  disabled={saveState === 'saving'}
                  style={{ minHeight: '420px', borderRadius: '16px', border: `1px solid ${selectedSkill.editable ? appTheme.colors.stateSuccess : appTheme.colors.borderSubtle}`, background: appTheme.colors.bgSurface1, color: appTheme.colors.textSecondary, padding: '16px', resize: 'vertical', fontFamily: 'ui-monospace, SFMono-Regular, Menlo, monospace', lineHeight: 1.5 }}
                />

                <div style={{ display: 'flex', gap: '10px', flexWrap: 'wrap' }}>
                  <button type="button" onClick={handlePreviewDiff} disabled={!selectedSkill.editable || !hasDraftChanges || previewState === 'loading' || saveState === 'saving'} style={{ borderRadius: '999px', border: 'none', padding: '10px 16px', cursor: !hasDraftChanges ? 'not-allowed' : 'pointer', background: appTheme.colors.brandBlue700, color: appTheme.colors.textPrimary, fontWeight: 700, opacity: !selectedSkill.editable || !hasDraftChanges ? 0.55 : 1 }}>
                    {previewState === 'loading' ? 'Calculando diff…' : 'Preview de diff'}
                  </button>
                  <button type="button" onClick={handleSaveSkill} disabled={!canSave} style={{ borderRadius: '999px', border: 'none', padding: '10px 16px', cursor: canSave ? 'pointer' : 'not-allowed', background: appTheme.colors.stateSuccess, color: appTheme.colors.textPrimary, fontWeight: 700, opacity: canSave ? 1 : 0.55 }}>
                    {saveState === 'saving' ? 'Guardando…' : 'Guardar skill'}
                  </button>
                  <button type="button" onClick={handleResetDraft} disabled={!hasDraftChanges || saveState === 'saving'} style={{ borderRadius: '999px', border: `1px solid ${appTheme.colors.borderSubtle}`, background: 'transparent', color: appTheme.colors.textSecondary, padding: '10px 16px', cursor: hasDraftChanges ? 'pointer' : 'not-allowed', fontWeight: 700 }}>
                    Reset
                  </button>
                  <button type="button" onClick={handleReloadSkill} disabled={saveState === 'saving'} style={{ borderRadius: '999px', border: `1px solid ${appTheme.colors.borderSubtle}`, background: 'transparent', color: appTheme.colors.brandSky500, padding: '10px 16px', cursor: 'pointer', fontWeight: 700 }}>
                    Recargar
                  </button>
                </div>
              </div>
            )}

            {previewResponse ? (
              <StatePanel
                status="revision"
                title="Preview de diff calculado"
                description={`Añadidas ${previewResponse.diff_summary.lines_added}; eliminadas ${previewResponse.diff_summary.lines_removed}; hunks ${previewResponse.diff_summary.hunks}.`}
                detail={previewResponse.diff_summary.truncated ? 'Preview truncado.' : 'Preview completo dentro del límite.'}
                eyebrow="Diff"
              >
                <pre className="responsive-code" style={{ margin: 0, padding: '12px', borderRadius: '12px', background: appTheme.colors.bgSurface1, color: appTheme.colors.textSecondary }}>
                  {previewResponse.diff_summary.preview.join('\n')}
                </pre>
              </StatePanel>
            ) : null}

            {previewState === 'error' || saveMessage ? (
              <StatePanel
                status={previewState === 'error' || saveState === 'error' || saveState === 'stale' ? 'incidencia' : 'operativo'}
                title={previewState === 'error' ? 'No se pudo calcular el preview' : saveState === 'success' ? 'Guardado aplicado' : saveState === 'stale' ? 'Fingerprint desactualizado' : 'Estado de edición'}
                description={previewState === 'error' ? previewError ?? 'Error saneado.' : saveMessage ?? 'Sin mensaje.'}
                detail={lastSavedAudit ? `audit ${formatTimestamp(lastSavedAudit.timestamp)} · ${lastSavedAudit.result}` : null}
                eyebrow="Feedback"
                ariaRole={previewState === 'error' || saveState === 'error' || saveState === 'stale' ? 'alert' : 'status'}
              />
            ) : null}

            {latestAudit ? (
              <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap', color: appTheme.colors.textMuted, fontSize: '12px' }}>
                <span>Última auditoría: <strong style={{ color: appTheme.colors.textSecondary }}>{formatTimestamp(latestAudit.timestamp)}</strong></span>
                <span>actor: <strong style={{ color: appTheme.colors.textSecondary }}>{latestAudit.actor}</strong></span>
                <span>resultado: <strong style={{ color: appTheme.colors.textSecondary }}>{latestAudit.result}</strong></span>
              </div>
            ) : null}
          </div>
        ) : (
          <StatePanel status="sin-datos" title="Selecciona una skill" description="Elige primero una fuente y después una skill para abrir el lector/editor." eyebrow="Sin selección" />
        )}
      </SurfaceCard>
    </>
  )
}

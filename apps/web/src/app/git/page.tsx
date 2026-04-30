import type { ReactNode } from 'react'

import type { GitBranchList, GitCommitList, GitCommitSummary, GitRepoIndex, GitRepoSummary } from '@contracts/read-models'

import {
  fetchGitBranches,
  fetchGitCommits,
  fetchGitRepos,
  GitApiError,
} from '@/modules/git/api/git-http'
import {
  gitBranchListFixture,
  gitCommitListFixture,
  gitRepoIndexFixture,
} from '@/modules/git/view-models/git-surface.fixture'
import { appTheme } from '@/shared/theme/tokens'
import type { AppStatus } from '@/shared/theme/tokens'
import { PageHeader } from '@/shared/ui/app-shell/PageHeader'
import { SurfaceCard } from '@/shared/ui/cards/SurfaceCard'
import { StatePanel } from '@/shared/ui/state/StatePanel'
import { SourceStatePills } from '@/shared/ui/status/SourceStatePills'
import { StatusBadge } from '@/shared/ui/status/StatusBadge'

export const dynamic = 'force-dynamic'

type GitPageNotice = {
  status: AppStatus
  title: string
  description: string
  detail?: string
}

type GitRepoCardSnapshot = {
  repo: GitRepoSummary
  branches: GitBranchList
  commits: GitCommitList
  latestCommit: GitCommitSummary | null
  sourceState: 'ready' | 'unknown'
}

type GitPageData = {
  repoIndex: GitRepoIndex
  cards: GitRepoCardSnapshot[]
  notice: GitPageNotice | null
}

function makeFallbackCard(repo: GitRepoSummary): GitRepoCardSnapshot {
  return {
    repo,
    branches: repo.repo_id === gitBranchListFixture.repo_id ? gitBranchListFixture : { ...gitBranchListFixture, repo_id: repo.repo_id },
    commits: repo.repo_id === gitCommitListFixture.repo_id ? gitCommitListFixture : { ...gitCommitListFixture, repo_id: repo.repo_id, commits: [] },
    latestCommit: repo.repo_id === gitCommitListFixture.repo_id ? (gitCommitListFixture.commits[0] ?? null) : null,
    sourceState: 'unknown',
  }
}

function getFallbackData(notice: GitPageNotice): GitPageData {
  return {
    repoIndex: gitRepoIndexFixture,
    cards: gitRepoIndexFixture.repos.map(makeFallbackCard),
    notice,
  }
}

async function getRepoCardSnapshot(repo: GitRepoSummary): Promise<GitRepoCardSnapshot> {
  try {
    const [commitsResponse, branchesResponse] = await Promise.all([
      fetchGitCommits(repo.repo_id),
      fetchGitBranches(repo.repo_id),
    ])

    return {
      repo,
      branches: branchesResponse.data,
      commits: commitsResponse.data,
      latestCommit: commitsResponse.data.commits[0] ?? null,
      sourceState: commitsResponse.status === 'ready' && branchesResponse.status === 'ready' ? 'ready' : 'unknown',
    }
  } catch {
    return makeFallbackCard(repo)
  }
}

async function getGitPageData(): Promise<GitPageData> {
  try {
    const reposResponse = await fetchGitRepos()
    const repoIndex = reposResponse.data

    if (reposResponse.status !== 'ready' || repoIndex.repos.length === 0) {
      return getFallbackData({
        status: 'revision',
        title: 'Revisor de repos Git en modo fallback local',
        description: 'La API respondió sin repositorio Git listo. Se muestra un snapshot local saneado, sin lectura real ni tiempo real.',
        detail: `Estado técnico: ${reposResponse.status}`,
      })
    }

    const cards = await Promise.all(repoIndex.repos.map(async (repo) => getRepoCardSnapshot(repo)))

    return {
      repoIndex,
      cards,
      notice: null,
    }
  } catch (error) {
    const apiError = error instanceof GitApiError ? error : null
    return getFallbackData({
      status: apiError?.code === 'not_configured' ? 'revision' : 'incidencia',
      title:
        apiError?.code === 'not_configured'
          ? 'Revisor de repos Git en modo fallback local'
          : apiError?.code === 'invalid_config'
            ? 'Configuración server-only de Repos Git inválida'
            : 'API Git no disponible',
      description:
        apiError?.code === 'not_configured'
          ? 'Mostrando snapshot local saneado. No hay lectura real de repositorios hasta configurar la API en servidor.'
          : 'La página conserva fallback saneado y oculta detalles internos de ejecución, configuración y errores crudos.',
      detail: apiError?.code ? `Estado técnico: ${apiError.code}` : undefined,
    })
  }
}

function formatTimestamp(value: string | null | undefined) {
  if (!value) return 'Sin fecha'
  const date = new Date(value)
  if (Number.isNaN(date.getTime())) return 'Fecha saneada no interpretable'
  return new Intl.DateTimeFormat('es-ES', { dateStyle: 'short', timeStyle: 'short' }).format(date)
}

function statusForRepo(snapshot: GitRepoCardSnapshot): AppStatus {
  const repo = snapshot.repo
  if (snapshot.sourceState !== 'ready' || repo.status.source_state !== 'ready' || repo.status.working_tree === 'unknown') return 'sin-datos'
  if (repo.status.working_tree === 'dirty') return 'revision'
  return 'operativo'
}

function workingTreeCopy(repo: GitRepoSummary) {
  if (repo.status.working_tree === 'clean') return 'Árbol limpio'
  if (repo.status.working_tree === 'dirty') return 'Cambios detectados'
  return 'Estado no disponible'
}

function valueOrDash(value: number | string | null | undefined) {
  if (value === null || value === undefined || value === '') return '—'
  return value
}

function Pill({ children }: { children: ReactNode }) {
  return (
    <span
      style={{
        display: 'inline-flex',
        maxWidth: '100%',
        border: `1px solid ${appTheme.colors.borderSubtle}`,
        borderRadius: '999px',
        padding: '6px 10px',
        color: appTheme.colors.textSecondary,
        fontSize: '12px',
        fontWeight: 700,
        overflowWrap: 'anywhere',
      }}
    >
      {children}
    </span>
  )
}

function BranchList({ branches }: { branches: GitBranchList }) {
  const visibleBranches = branches.branches.slice(0, 8)
  const hiddenCount = Math.max(branches.branches.length - visibleBranches.length, 0)

  if (branches.branches.length === 0) {
    return <p style={{ margin: 0, color: appTheme.colors.textMuted }}>Sin ramas disponibles en esta lectura.</p>
  }

  return (
    <div className="git-branch-chip-list" aria-label="Ramas disponibles">
      {visibleBranches.map((branch) => (
        <span key={branch.sha + branch.name} className={`git-branch-chip${branch.current ? ' git-branch-chip--current' : ''}`}>
          <span className="text-break">{branch.name}</span>
          {branch.current ? <strong>actual</strong> : null}
        </span>
      ))}
      {hiddenCount > 0 ? <Pill>+{hiddenCount} más</Pill> : null}
    </div>
  )
}

function LatestCommit({ commit }: { commit: GitCommitSummary | null }) {
  if (!commit) {
    return <p style={{ margin: 0, color: appTheme.colors.textMuted }}>Sin último commit disponible en esta lectura.</p>
  }

  return (
    <details className="git-commit-message">
      <summary>
        <span>Último commit</span>
        <strong>{formatTimestamp(commit.committed_at)}</strong>
        <code className="git-inline-code">{commit.short_sha}</code>
      </summary>
      <div className="git-commit-message__body">
        <p style={{ margin: 0, color: appTheme.colors.textMuted, fontSize: '12px', fontWeight: 800, letterSpacing: '0.08em', textTransform: 'uppercase' }}>
          Mensaje del commit
        </p>
        <pre className="git-commit-message__text">{commit.subject}</pre>
        <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap' }}>
          <Pill>Autor: {commit.author_name}</Pill>
          <Pill>Mugiwara-Agent: {commit.trailers.mugiwara_agent ?? 'sin trailer'}</Pill>
          <Pill>Signed-off-by: {commit.trailers.signed_off_by ? 'presente' : 'sin trailer'}</Pill>
        </div>
      </div>
    </details>
  )
}

function RepoStatusCard({ snapshot }: { snapshot: GitRepoCardSnapshot }) {
  const { repo, branches, latestCommit } = snapshot

  return (
    <SurfaceCard title={repo.label} eyebrow="Estado local por repo" accent={statusForRepo(snapshot) === 'revision' ? 'warning' : 'sky'}>
      <article className="git-repo-status-card">
        <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap' }}>
          <StatusBadge status={statusForRepo(snapshot)} label={workingTreeCopy(repo)} />
          <Pill>{repo.scope}</Pill>
          <Pill>repo_id: {repo.repo_id}</Pill>
        </div>

        <dl className="git-metric-list git-metric-list--repo-card">
          <div>
            <dt>Rama actual</dt>
            <dd>{valueOrDash(repo.status.current_branch)}</dd>
          </div>
          <div>
            <dt>Ramas disponibles</dt>
            <dd>{branches.branches.length}</dd>
          </div>
          <div>
            <dt>Cambios</dt>
            <dd>{valueOrDash(repo.status.changed_files_count)}</dd>
          </div>
          <div>
            <dt>No trackeado</dt>
            <dd>{valueOrDash(repo.status.untracked_files_count)}</dd>
          </div>
        </dl>

        <div className="git-repo-status-card__section">
          <h2>Ramas disponibles</h2>
          <BranchList branches={branches} />
        </div>

        <div className="git-repo-status-card__section">
          <h2>Último commit desplegable</h2>
          <LatestCommit commit={latestCommit} />
        </div>
      </article>
    </SurfaceCard>
  )
}

export default async function GitPage() {
  const { repoIndex, cards, notice } = await getGitPageData()
  const isSnapshotMode = Boolean(notice)

  return (
    <>
      <PageHeader
        eyebrow="Repos Git"
        title="Revisor de repos Git locales"
        subtitle="Una card por repo allowlisteado con rama actual, ramas disponibles, cambios, no trackeado y último commit desplegable. Lectura server-only, sin acciones Git y sin rutas del host."
        detailPills={['Solo lectura', 'Estado local por repo', 'Último commit desplegable', 'Sin operaciones mutables']}
      />

      {notice ? (
        <StatePanel status={notice.status} title={notice.title} description={notice.description} detail={notice.detail} eyebrow="Estado de fuente">
          <SourceStatePills
            items={[
              { label: 'Modo fallback local', tone: 'fallback' },
              { label: 'Snapshot saneado', tone: 'snapshot' },
              { label: 'No tiempo real', tone: 'not-realtime' },
            ]}
          />
        </StatePanel>
      ) : null}

      <StatePanel
        status="revision"
        title="Frontera Git bloqueada en modo read-only"
        description="La pantalla revisa estado local de repos allowlisteados sin operaciones mutables, sin selectores arbitrarios y sin publicar rutas del host. El mensaje desplegable usa solo el asunto saneado del último commit expuesto por backend."
        eyebrow="Guardrail UI"
      >
        <SourceStatePills
          items={[
            { label: 'Sin operaciones mutables', tone: 'connected' },
            { label: 'Sin rutas host', tone: 'connected' },
            { label: 'Sin texto libre de commits', tone: 'connected' },
            { label: 'Solo repos allowlisteados', tone: 'connected' },
          ]}
        />
      </StatePanel>

      <section className="section-block layout-grid layout-grid--cards-280" aria-label="Cards de estado de repos Git locales">
        {cards.map((snapshot) => (
          <RepoStatusCard key={snapshot.repo.repo_id} snapshot={snapshot} />
        ))}
      </section>

      <p style={{ margin: '4px 0 0', color: appTheme.colors.textMuted, fontSize: '13px', lineHeight: 1.6 }}>
        {repoIndex.repos.length} repo(s) Git en lectura {isSnapshotMode ? 'snapshot saneada' : 'server-only'}.
      </p>
    </>
  )
}

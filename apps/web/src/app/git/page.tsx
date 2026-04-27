import type { ReactNode } from 'react'

import type { GitBranchList, GitCommitDetail, GitCommitDiff, GitCommitList, GitCommitSummary, GitRepoIndex, GitRepoSummary } from '@contracts/read-models'

import {
  fetchGitBranches,
  fetchGitCommitDetail,
  fetchGitCommitDiff,
  fetchGitCommits,
  fetchGitRepos,
  GitApiError,
} from '@/modules/git/api/git-http'
import {
  gitBranchListFixture,
  gitCommitDetailFixture,
  gitCommitDiffFixture,
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

type GitPageData = {
  repoIndex: GitRepoIndex
  commits: GitCommitList
  branches: GitBranchList
  commitDetail: GitCommitDetail
  commitDiff: GitCommitDiff
  notice: GitPageNotice | null
}

function getFallbackData(notice: GitPageNotice): GitPageData {
  return {
    repoIndex: gitRepoIndexFixture,
    commits: gitCommitListFixture,
    branches: gitBranchListFixture,
    commitDetail: gitCommitDetailFixture,
    commitDiff: gitCommitDiffFixture,
    notice,
  }
}

async function getGitPageData(): Promise<GitPageData> {
  try {
    const reposResponse = await fetchGitRepos()
    const repoIndex = reposResponse.data
    const selectedRepo = repoIndex.repos[0]

    if (reposResponse.status !== 'ready' || !selectedRepo) {
      return getFallbackData({
        status: 'revision',
        title: 'Repos Git en modo fallback local',
        description: 'La API respondió sin repositorio Git listo. Se muestra un snapshot local saneado para conservar la navegación, sin lectura real ni tiempo real.',
        detail: `Estado técnico: ${reposResponse.status}`,
      })
    }

    const commitsResponse = await fetchGitCommits(selectedRepo.repo_id)
    const branchesResponse = await fetchGitBranches(selectedRepo.repo_id)
    const selectedCommit = commitsResponse.data.commits[0]

    if (!selectedCommit || commitsResponse.status !== 'ready') {
      return {
        repoIndex,
        commits: commitsResponse.data,
        branches: branchesResponse.data,
        commitDetail: { ...gitCommitDetailFixture, repo_id: selectedRepo.repo_id, commit: null, files: [], source_state: 'unknown' },
        commitDiff: { ...gitCommitDiffFixture, repo_id: selectedRepo.repo_id, sha: '', files: [], omitted_files_count: 0, source_state: 'unknown' },
        notice: {
          status: 'revision',
          title: 'Historial Git no disponible para el repo seleccionado',
          description: 'La página mantiene índice y ramas saneadas, pero no muestra detalle ni diff porque el backend no devolvió commits listos.',
          detail: `Estado técnico: ${commitsResponse.status}`,
        },
      }
    }

    const detailResponse = await fetchGitCommitDetail(selectedRepo.repo_id, selectedCommit.sha)
    const diffResponse = await fetchGitCommitDiff(selectedRepo.repo_id, selectedCommit.sha)

    return {
      repoIndex,
      commits: commitsResponse.data,
      branches: branchesResponse.data,
      commitDetail: detailResponse.data,
      commitDiff: diffResponse.data,
      notice: null,
    }
  } catch (error) {
    const apiError = error instanceof GitApiError ? error : null
    return getFallbackData({
      status: apiError?.code === 'not_configured' ? 'revision' : 'incidencia',
      title:
        apiError?.code === 'not_configured'
          ? 'Repos Git en modo fallback local'
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

function statusForRepo(repo: GitRepoSummary): AppStatus {
  if (repo.status.source_state !== 'ready' || repo.status.working_tree === 'unknown') return 'sin-datos'
  if (repo.status.working_tree === 'dirty') return 'revision'
  return 'operativo'
}

function workingTreeCopy(repo: GitRepoSummary) {
  if (repo.status.working_tree === 'clean') return 'Árbol limpio'
  if (repo.status.working_tree === 'dirty') return 'Cambios detectados'
  return 'Estado no disponible'
}

function renderShaGroups(sha: string) {
  const groups = sha.match(/.{1,8}/g) ?? [sha]

  return groups.map((group, index) => (
    <span key={`${group}-${index}`} className="git-sha-group">
      {group}
    </span>
  ))
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

function RepoCard({ repo, selected }: { repo: GitRepoSummary; selected: boolean }) {
  return (
    <SurfaceCard title={repo.label} eyebrow={selected ? 'Repo seleccionado por backend' : 'Repo allowlisteado'} accent={selected ? 'sky' : undefined}>
      <div style={{ display: 'grid', gap: '12px', minWidth: 0 }}>
        <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap' }}>
          <StatusBadge status={statusForRepo(repo)} label={workingTreeCopy(repo)} />
          <Pill>{repo.scope}</Pill>
          <Pill>repo_id: {repo.repo_id}</Pill>
        </div>
        <p className="text-break" style={{ margin: 0, color: appTheme.colors.textSecondary, lineHeight: 1.6 }}>
          Solo lectura. La UI no conoce rutas del host ni remotes; usa únicamente el identificador lógico devuelto por backend.
        </p>
        <dl className="git-metric-list">
          <div>
            <dt>Rama actual</dt>
            <dd>{repo.status.current_branch ?? 'No disponible'}</dd>
          </div>
          <div>
            <dt>Cambios</dt>
            <dd>{repo.status.changed_files_count ?? '—'}</dd>
          </div>
          <div>
            <dt>No trackeados</dt>
            <dd>{repo.status.untracked_files_count ?? '—'}</dd>
          </div>
        </dl>
      </div>
    </SurfaceCard>
  )
}

function CommitItem({ commit, selected }: { commit: GitCommitSummary; selected: boolean }) {
  return (
    <li className={`git-commit-row${selected ? ' git-commit-row--selected' : ''}`}>
      <div style={{ display: 'flex', justifyContent: 'space-between', gap: '12px', flexWrap: 'wrap', minWidth: 0 }}>
        <strong className="text-break" style={{ color: appTheme.colors.textPrimary }}>{commit.subject}</strong>
        <code className="git-inline-code">{commit.short_sha}</code>
      </div>
      <p className="text-break" style={{ margin: '8px 0 0', color: appTheme.colors.textSecondary }}>
        {commit.author_name} · {formatTimestamp(commit.committed_at)}
      </p>
      <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap', marginTop: '10px' }}>
        <Pill>Mugiwara-Agent: {commit.trailers.mugiwara_agent ?? 'sin trailer'}</Pill>
        <Pill>Signed-off-by: {commit.trailers.signed_off_by ? 'presente' : 'sin trailer'}</Pill>
      </div>
    </li>
  )
}

export default async function GitPage() {
  const { repoIndex, commits, branches, commitDetail, commitDiff, notice } = await getGitPageData()
  const selectedRepo = repoIndex.repos[0]
  const selectedCommit = commitDetail.commit ?? commits.commits[0] ?? null
  const isSnapshotMode = Boolean(notice)
  const hasDenseBranches = branches.branches.length > 8

  return (
    <>
      <PageHeader
        eyebrow="Repos Git"
        title="Repos Git"
        subtitle="Lectura server-only de repositorios allowlisteados: historial, ramas locales, detalle de commit y diff histórico saneado. Sin operaciones mutables ni rutas cliente."
        mugiwaraSlug="zoro"
        detailPills={['Solo lectura', 'repo_id/SHA backend-owned', 'Diff redactado/truncado/omitido']}
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
        description="Esta pantalla no expone operaciones mutables, selectores arbitrarios ni diffs de cambios no confirmados. El diff visible procede solo de commits ya seleccionados por SHA backend-owned y puede estar redactado, truncado u omitido."
        eyebrow="Guardrail UI"
      >
        <SourceStatePills
          items={[
            { label: 'Sin operaciones mutables', tone: 'connected' },
            { label: 'Sin rutas host', tone: 'connected' },
            { label: 'Sin texto libre de commits', tone: 'connected' },
            { label: 'Diff histórico saneado', tone: 'fallback' },
          ]}
        />
      </StatePanel>

      <section className="section-block layout-grid layout-grid--cards-280" aria-label="Repositorios Git allowlisteados">
        {repoIndex.repos.map((repo) => (
          <RepoCard key={repo.repo_id} repo={repo} selected={repo.repo_id === selectedRepo?.repo_id} />
        ))}
      </section>

      <section className="section-block layout-grid layout-grid--content-aside" aria-label="Historial y ramas Git">
        <SurfaceCard title="Historial reciente" eyebrow={isSnapshotMode ? 'Commits del snapshot' : 'Commits backend-owned'} accent="gold">
          <ol className="git-commit-list">
            {commits.commits.map((commit, index) => (
              <CommitItem key={commit.sha} commit={commit} selected={index === 0} />
            ))}
          </ol>
          <p style={{ margin: '14px 0 0', color: appTheme.colors.textMuted, fontSize: '13px', lineHeight: 1.6 }}>
            El cuerpo libre del commit no se renderiza. Los trailers se muestran como campos allowlisteados.
          </p>
        </SurfaceCard>

        <SurfaceCard title="Ramas locales" eyebrow="Sin refs arbitrarias" accent="sky">
          <div style={{ display: 'grid', gap: '10px', minWidth: 0 }}>
            <p style={{ margin: 0, color: appTheme.colors.textSecondary }}>
              Rama actual: <strong>{branches.current_branch ?? 'No disponible'}</strong>
            </p>
            <p style={{ margin: 0, color: appTheme.colors.textMuted, fontSize: '13px', lineHeight: 1.5 }}>
              {branches.branches.length} rama(s) locales. {hasDenseBranches ? 'Vista compacta con scroll interno para mantener la página escaneable.' : 'Lista completa en lectura compacta.'}
            </p>
            <ul className={`git-branch-list${hasDenseBranches ? ' git-branch-list--dense' : ''}`}>
              {branches.branches.length > 0 ? branches.branches.map((branch) => (
                <li key={branch.sha + branch.name} className="git-branch-row">
                  <span className="text-break">{branch.name}</span>
                  <code className="git-inline-code">{branch.short_sha}</code>
                  {branch.current ? <StatusBadge status="operativo" label="actual" /> : null}
                </li>
              )) : <li style={{ color: appTheme.colors.textMuted }}>Sin ramas disponibles en esta lectura.</li>}
            </ul>
          </div>
        </SurfaceCard>
      </section>

      <section className="section-block layout-grid layout-grid--content-aside" aria-label="Detalle de commit y diff seguro">
        <SurfaceCard title="Detalle de commit" eyebrow="SHA backend-owned" accent="success">
          {selectedCommit ? (
            <div style={{ display: 'grid', gap: '12px', minWidth: 0 }}>
              <code className="git-block-code git-sha-code" aria-label={`SHA completo ${selectedCommit.sha}`}>{renderShaGroups(selectedCommit.sha)}</code>
              <p className="text-break" style={{ margin: 0, color: appTheme.colors.textPrimary, fontWeight: 800 }}>{selectedCommit.subject}</p>
              <dl className="git-metric-list">
                <div><dt>Autor</dt><dd>{selectedCommit.author_name}</dd></div>
                <div><dt>Fecha</dt><dd>{formatTimestamp(selectedCommit.committed_at)}</dd></div>
                <div><dt>Archivos</dt><dd>{commitDetail.files.length}</dd></div>
              </dl>
              <ul className="git-file-list">
                {commitDetail.files.map((file, index) => (
                  <li key={`${file.path ?? 'omitted'}-${index}`} className="git-file-row">
                    <span className="text-break">{file.omitted ? 'Archivo omitido por seguridad' : file.path ?? 'Path no publicado'}</span>
                    <span>{file.change_type}</span>
                    <span>{file.binary ? 'binario' : `${file.additions ?? '—'}+ / ${file.deletions ?? '—'}-`}</span>
                    {file.omitted ? <StatusBadge status="revision" label={file.omitted_reason ?? 'omitido'} /> : null}
                  </li>
                ))}
              </ul>
            </div>
          ) : (
            <p style={{ margin: 0, color: appTheme.colors.textMuted }}>Sin commit seleccionado por backend.</p>
          )}
        </SurfaceCard>

        <SurfaceCard title="Diff seguro" eyebrow="Redactado / truncado / omitido" accent={commitDiff.redacted || commitDiff.truncated || commitDiff.omitted_files_count > 0 ? 'warning' : 'sky'}>
          <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap', marginBottom: '12px' }}>
            <StatusBadge status={commitDiff.redacted ? 'revision' : 'operativo'} label={commitDiff.redacted ? 'Redactado' : 'Sin redacciones'} />
            <StatusBadge status={commitDiff.truncated ? 'stale' : 'operativo'} label={commitDiff.truncated ? 'Truncado' : 'Dentro de límites'} />
            <Pill>Omitidos: {commitDiff.omitted_files_count}</Pill>
          </div>
          <div className="git-diff-panel">
            {commitDiff.files.length > 0 ? commitDiff.files.map((file, index) => (
              <div key={`${file.path ?? 'omitted'}-${index}`} className="git-diff-file">
                <div className="git-diff-file__header">
                  <strong className="text-break">{file.omitted ? 'Archivo omitido por seguridad' : file.path ?? 'Path no publicado'}</strong>
                  <span>{file.truncated ? 'truncado' : 'límite OK'} · {file.redacted ? 'redactado' : 'sin redacción'}</span>
                </div>
                <p style={{ margin: 0, color: appTheme.colors.textMuted, lineHeight: 1.6 }}>
                  {file.omitted
                    ? `Contenido omitido: ${file.omitted_reason ?? 'política de seguridad'}`
                    : `Contenido del diff omitido en frontend; ${file.lines.length} línea(s) recibida(s) del backend saneado.`}
                </p>
              </div>
            )) : <p style={{ margin: 0, color: appTheme.colors.textMuted }}>Sin diff disponible en esta lectura.</p>}
          </div>
        </SurfaceCard>
      </section>
    </>
  )
}

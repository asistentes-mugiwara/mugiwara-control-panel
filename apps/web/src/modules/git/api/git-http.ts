import 'server-only'

import type {
  GitBranchListResponse,
  GitCommitDetailResponse,
  GitCommitDiffResponse,
  GitCommitListResponse,
  GitRepoIndexResponse,
} from '@contracts/read-models'

export const GIT_API_BASE_URL_ENV = 'MUGIWARA_CONTROL_PANEL_API_URL'

type GitApiErrorCode = 'not_configured' | 'invalid_config' | `http_${number}` | 'invalid_payload' | 'fetch_failed'

export class GitApiError extends Error {
  constructor(readonly code: GitApiErrorCode) {
    super(code)
    this.name = 'GitApiError'
  }
}

function trimTrailingSlash(value: string) {
  return value.replace(/\/$/, '')
}

function parseGitApiBaseUrl(value: string) {
  let parsed: URL

  try {
    parsed = new URL(value)
  } catch {
    throw new GitApiError('invalid_config')
  }

  if (parsed.protocol !== 'http:' && parsed.protocol !== 'https:') {
    throw new GitApiError('invalid_config')
  }

  return trimTrailingSlash(value)
}

export function getGitApiBaseUrl() {
  const value = process.env[GIT_API_BASE_URL_ENV]
  return value ? parseGitApiBaseUrl(value) : null
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return Boolean(value) && typeof value === 'object'
}

function parseGitEnvelope<T>(payload: unknown): T {
  if (!isRecord(payload) || !isRecord(payload.data) || typeof payload.resource !== 'string' || typeof payload.status !== 'string') {
    throw new GitApiError('invalid_payload')
  }

  return payload as T
}

async function fetchGitEnvelope<T>(path: string): Promise<T> {
  const baseUrl = getGitApiBaseUrl()

  if (!baseUrl) {
    throw new GitApiError('not_configured')
  }

  let response: Response
  try {
    response = await fetch(`${baseUrl}${path}`, {
      cache: 'no-store',
      headers: {
        Accept: 'application/json',
      },
    })
  } catch {
    throw new GitApiError('fetch_failed')
  }

  if (!response.ok) {
    throw new GitApiError(`http_${response.status}`)
  }

  return parseGitEnvelope<T>(await response.json())
}

export async function fetchGitRepos(): Promise<GitRepoIndexResponse> {
  return fetchGitEnvelope<GitRepoIndexResponse>('/api/v1/git/repos')
}

export async function fetchGitCommits(repoId: string): Promise<GitCommitListResponse> {
  return fetchGitEnvelope<GitCommitListResponse>(`/api/v1/git/repos/${encodeURIComponent(repoId)}/commits?limit=12`)
}

export async function fetchGitBranches(repoId: string): Promise<GitBranchListResponse> {
  return fetchGitEnvelope<GitBranchListResponse>(`/api/v1/git/repos/${encodeURIComponent(repoId)}/branches`)
}

export async function fetchGitCommitDetail(repoId: string, sha: string): Promise<GitCommitDetailResponse> {
  return fetchGitEnvelope<GitCommitDetailResponse>(`/api/v1/git/repos/${encodeURIComponent(repoId)}/commits/${encodeURIComponent(sha)}`)
}

export async function fetchGitCommitDiff(repoId: string, sha: string): Promise<GitCommitDiffResponse> {
  return fetchGitEnvelope<GitCommitDiffResponse>(`/api/v1/git/repos/${encodeURIComponent(repoId)}/commits/${encodeURIComponent(sha)}/diff`)
}

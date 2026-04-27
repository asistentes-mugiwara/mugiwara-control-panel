import { NextRequest, NextResponse } from 'next/server'

const GIT_CANONICAL_PATH = '/git'
const GIT_ALLOWED_SEARCH_PARAMS = new Set(['repo_id', 'sha'])
const GIT_REPO_ID_PATTERN = /^[a-z0-9][a-z0-9._-]{0,63}$/i
const GIT_FULL_SHA_PATTERN = /^[a-f0-9]{40}$|^[a-f0-9]{64}$/i
const GIT_API_BASE_URL_ENV = 'MUGIWARA_CONTROL_PANEL_API_URL'

type GitRepoIndex = {
  repos?: Array<{ repo_id?: unknown }>
}

type GitCommitList = {
  commits?: Array<{ sha?: unknown }>
}

type GitEnvelope<T> = {
  status?: unknown
  data?: T
}

function hasDuplicateParam(request: NextRequest, key: string) {
  return request.nextUrl.searchParams.getAll(key).length > 1
}

function hasUnsafeGitSearchParams(request: NextRequest) {
  for (const key of Array.from(request.nextUrl.searchParams.keys())) {
    if (!GIT_ALLOWED_SEARCH_PARAMS.has(key)) return true
    if (hasDuplicateParam(request, key)) return true
  }

  const repoId = request.nextUrl.searchParams.get('repo_id')
  if (repoId && !GIT_REPO_ID_PATTERN.test(repoId)) return true

  const sha = request.nextUrl.searchParams.get('sha')
  if (sha && !GIT_FULL_SHA_PATTERN.test(sha)) return true

  return false
}

function trimTrailingSlash(value: string) {
  return value.replace(/\/$/, '')
}

function getGitApiBaseUrl() {
  const value = process.env[GIT_API_BASE_URL_ENV]
  if (!value) return null

  let parsed: URL
  try {
    parsed = new URL(value)
  } catch {
    return null
  }

  if (parsed.protocol !== 'http:' && parsed.protocol !== 'https:') return null
  return trimTrailingSlash(value)
}

function isReadyEnvelope<T>(payload: unknown): payload is GitEnvelope<T> {
  return payload !== null && typeof payload === 'object' && 'status' in payload && 'data' in payload
}

async function fetchGitEnvelope<T>(baseUrl: string, path: string): Promise<GitEnvelope<T> | null> {
  try {
    const response = await fetch(`${baseUrl}${path}`, {
      cache: 'no-store',
      headers: {
        Accept: 'application/json',
      },
    })

    if (!response.ok) return null

    const payload: unknown = await response.json()
    if (!isReadyEnvelope<T>(payload)) return null
    return payload
  } catch {
    return null
  }
}

function getRepoIds(repoIndex: GitRepoIndex | undefined) {
  return (repoIndex?.repos ?? [])
    .map((repo) => repo.repo_id)
    .filter((repoId): repoId is string => typeof repoId === 'string' && repoId.length > 0)
}

function getCommitShas(commits: GitCommitList | undefined) {
  return (commits?.commits ?? [])
    .map((commit) => commit.sha)
    .filter((sha): sha is string => typeof sha === 'string' && sha.length > 0)
}

function gitRepoHref(request: NextRequest, repoId: string) {
  const canonicalUrl = request.nextUrl.clone()
  canonicalUrl.pathname = GIT_CANONICAL_PATH
  canonicalUrl.search = new URLSearchParams({ repo_id: repoId }).toString()
  return canonicalUrl
}

function redirectToCanonicalGit(request: NextRequest) {
  const canonicalUrl = request.nextUrl.clone()
  canonicalUrl.pathname = GIT_CANONICAL_PATH
  canonicalUrl.search = ''
  return NextResponse.redirect(canonicalUrl)
}

async function validateGitSelection(request: NextRequest) {
  const requestedRepoId = request.nextUrl.searchParams.get('repo_id')
  const requestedSha = request.nextUrl.searchParams.get('sha')

  if (!requestedRepoId && !requestedSha) return NextResponse.next()
  if (hasUnsafeGitSearchParams(request)) return redirectToCanonicalGit(request)

  const baseUrl = getGitApiBaseUrl()
  if (!baseUrl) return redirectToCanonicalGit(request)

  const reposEnvelope = await fetchGitEnvelope<GitRepoIndex>(baseUrl, '/api/v1/git/repos')
  const repoIds = getRepoIds(reposEnvelope?.data)
  const selectedRepoId = requestedRepoId && repoIds.includes(requestedRepoId) ? requestedRepoId : repoIds[0]

  if (reposEnvelope?.status !== 'ready' || !selectedRepoId) return redirectToCanonicalGit(request)
  if (requestedRepoId && selectedRepoId !== requestedRepoId) return NextResponse.redirect(gitRepoHref(request, selectedRepoId))
  if (!requestedSha) return NextResponse.next()

  const commitsEnvelope = await fetchGitEnvelope<GitCommitList>(
    baseUrl,
    `/api/v1/git/repos/${encodeURIComponent(selectedRepoId)}/commits?limit=12`,
  )
  const commitShas = getCommitShas(commitsEnvelope?.data)

  if (commitsEnvelope?.status !== 'ready' || !commitShas.includes(requestedSha)) {
    return NextResponse.redirect(gitRepoHref(request, selectedRepoId))
  }

  return NextResponse.next()
}

export async function middleware(request: NextRequest) {
  if (request.nextUrl.pathname === GIT_CANONICAL_PATH) {
    return validateGitSelection(request)
  }

  return NextResponse.next()
}

export const config = {
  matcher: ['/git'],
}

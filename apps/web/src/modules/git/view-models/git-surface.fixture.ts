import type { GitBranchList, GitCommitDetail, GitCommitDiff, GitCommitList, GitRepoIndex } from '@contracts/read-models'

const fallbackSha = '0000000000000000000000000000000000000000'

export const gitRepoIndexFixture: GitRepoIndex = {
  repos: [
    {
      repo_id: 'mugiwara-control-panel',
      label: 'Mugiwara Control Panel',
      scope: 'Proyecto software',
      status: {
        source_state: 'unknown',
        working_tree: 'unknown',
        changed_files_count: null,
        untracked_files_count: null,
        current_branch: null,
      },
    },
  ],
}

export const gitCommitListFixture: GitCommitList = {
  repo_id: 'mugiwara-control-panel',
  commits: [
    {
      sha: fallbackSha,
      short_sha: '0000000',
      author_name: 'zoro',
      author_email: 'redacted@example.invalid',
      authored_at: '2026-04-27T00:00:00Z',
      committed_at: '2026-04-27T00:00:00Z',
      subject: 'Snapshot local saneado de historial Git',
      trailers: {
        mugiwara_agent: 'zoro',
        signed_off_by: 'zoro <redacted@example.invalid>',
      },
    },
  ],
  limit: 12,
  next_cursor: null,
  source_state: 'unknown',
}

export const gitBranchListFixture: GitBranchList = {
  repo_id: 'mugiwara-control-panel',
  current_branch: null,
  branches: [],
  source_state: 'unknown',
}

export const gitCommitDetailFixture: GitCommitDetail = {
  repo_id: 'mugiwara-control-panel',
  commit: gitCommitListFixture.commits[0] ?? null,
  files: [
    {
      path: null,
      change_type: 'modified',
      additions: null,
      deletions: null,
      binary: false,
      omitted: true,
      omitted_reason: 'fallback_snapshot',
    },
  ],
  source_state: 'unknown',
}

export const gitCommitDiffFixture: GitCommitDiff = {
  repo_id: 'mugiwara-control-panel',
  sha: fallbackSha,
  files: [
    {
      path: null,
      change_type: 'modified',
      additions: null,
      deletions: null,
      binary: false,
      omitted: true,
      omitted_reason: 'fallback_snapshot',
      truncated: false,
      redacted: true,
      lines: [
        { kind: 'context', content: '[diff omitido: fallback local saneado]' },
      ],
    },
  ],
  truncated: false,
  redacted: true,
  omitted_files_count: 1,
  source_state: 'unknown',
}

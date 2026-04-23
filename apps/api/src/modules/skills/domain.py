from __future__ import annotations

from dataclasses import dataclass
from pathlib import Path
from typing import Literal

SkillOwnerScope = Literal['agent', 'shared', 'runtime']
PublicRepoRisk = Literal['low', 'medium', 'high']
OperationResult = Literal['success', 'rejected', 'failed']


@dataclass(frozen=True)
class SkillRegistryEntry:
    skill_id: str
    display_name: str
    owner_scope: SkillOwnerScope
    public_repo_risk: PublicRepoRisk
    repo_path: str
    path: Path
    editable: bool = True


@dataclass(frozen=True)
class SkillFingerprint:
    sha256: str
    bytes: int


@dataclass(frozen=True)
class SkillCatalogItem:
    skill_id: str
    display_name: str
    owner_scope: SkillOwnerScope
    public_repo_risk: PublicRepoRisk
    editable: bool
    repo_path: str


@dataclass(frozen=True)
class SkillDetail:
    skill_id: str
    display_name: str
    owner_scope: SkillOwnerScope
    public_repo_risk: PublicRepoRisk
    editable: bool
    repo_path: str
    content: str
    fingerprint: SkillFingerprint


@dataclass(frozen=True)
class SkillDiffSummary:
    lines_added: int
    lines_removed: int
    hunks: int
    preview: list[str]
    truncated: bool


@dataclass(frozen=True)
class SkillAuditRecord:
    timestamp: str
    actor: str
    skill_id: str
    repo_path: str
    before_sha256: str
    after_sha256: str
    diff_summary: SkillDiffSummary
    result: OperationResult
    reason: str | None = None

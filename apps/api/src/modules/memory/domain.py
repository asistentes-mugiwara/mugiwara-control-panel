from __future__ import annotations

from dataclasses import dataclass


@dataclass(frozen=True)
class SafeLink:
    label: str
    href: str


@dataclass(frozen=True)
class Freshness:
    status: str
    updated_at: str | None
    source_label: str


@dataclass(frozen=True)
class MemoryAgentSummary:
    mugiwara_slug: str
    summary: str
    fact_count: int
    last_updated: str | None
    badges: list[str]


@dataclass(frozen=True)
class MemoryDocument:
    status: str
    display_path: str
    read_only: bool
    markdown: str
    updated_at: str | None
    size_bytes: int | None
    message: str


@dataclass(frozen=True)
class MemoryAgentDetail:
    mugiwara_slug: str
    built_in_summary: str
    honcho_facts: list[str]
    freshness: Freshness
    links: list[SafeLink]
    memory_document: MemoryDocument


@dataclass(frozen=True)
class MemoryRecord:
    slug: str
    summary: str
    fact_count: int
    last_updated: str | None
    badges: tuple[str, ...]
    built_in_summary: str
    honcho_facts: tuple[str, ...]
    freshness_status: str

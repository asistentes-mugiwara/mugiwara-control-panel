from __future__ import annotations

from dataclasses import dataclass


@dataclass(frozen=True)
class SafeLink:
    label: str
    href: str


@dataclass(frozen=True)
class MugiwaraCard:
    slug: str
    name: str
    status: str
    description: str
    skills: list[str]
    memory_badge: str
    links: list[SafeLink]


@dataclass(frozen=True)
class MugiwaraIdentity:
    name: str
    role: str
    crest_src: str
    accent_color: str


@dataclass(frozen=True)
class MugiwaraProfile:
    slug: str
    identity: MugiwaraIdentity
    status: str
    allowed_metadata: dict[str, str | int | bool | None]
    linked_skills: list[str]
    memory_summary: str


@dataclass(frozen=True)
class CrewRulesDocument:
    document_id: str
    title: str
    display_path: str
    source_label: str
    read_only: bool
    canonical: bool
    markdown: str


@dataclass(frozen=True)
class SoulDocument:
    document_id: str
    title: str
    display_path: str
    source_label: str
    read_only: bool
    canonical: bool
    markdown: str

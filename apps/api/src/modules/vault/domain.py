from __future__ import annotations

from dataclasses import dataclass


@dataclass(frozen=True)
class VaultFreshness:
    updated_at: str
    label: str
    state: str


@dataclass(frozen=True)
class VaultTreeEntry:
    id: str
    label: str
    path_segment: str
    kind: str
    summary: str
    depth: int
    path: str


@dataclass(frozen=True)
class VaultDocumentSection:
    heading: str
    body: list[str]


@dataclass(frozen=True)
class VaultDocumentMeta:
    path: str
    updated_at: str
    toc: list[str]
    context: str


@dataclass(frozen=True)
class VaultBreadcrumb:
    label: str
    href: str


@dataclass(frozen=True)
class VaultDocument:
    id: str
    title: str
    summary: str
    canon_callout: str
    breadcrumbs: list[VaultBreadcrumb]
    meta: VaultDocumentMeta
    sections: list[VaultDocumentSection]


@dataclass(frozen=True)
class VaultDocumentEntry:
    document_id: str
    label: str
    relative_path: str
    category_id: str
    category_label: str
    summary: str
    context: str


@dataclass(frozen=True)
class VaultCategory:
    category_id: str
    label: str
    path_segment: str
    summary: str
    documents: tuple[VaultDocumentEntry, ...]

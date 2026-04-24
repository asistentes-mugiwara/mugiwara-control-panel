from __future__ import annotations

from typing import Any, Final

ALLOWED_RESOURCE_STATUSES: Final[frozenset[str]] = frozenset(
    {
        'ready',
        'empty',
        'error',
        'stale',
        'forbidden',
        'not_configured',
        'validation_error',
        'source_unavailable',
    }
)


def resource_response(*, resource: str, status: str, data: Any, meta: dict[str, Any] | None = None) -> dict[str, Any]:
    if status not in ALLOWED_RESOURCE_STATUSES:
        raise ValueError(f'Unsupported resource status: {status}')
    return {
        'resource': resource,
        'status': status,
        'data': data,
        'meta': meta or {},
    }

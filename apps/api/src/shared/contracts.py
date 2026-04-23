from __future__ import annotations

from typing import Any


def resource_response(*, resource: str, status: str, data: Any, meta: dict[str, Any] | None = None) -> dict[str, Any]:
    return {
        'resource': resource,
        'status': status,
        'data': data,
        'meta': meta or {},
    }

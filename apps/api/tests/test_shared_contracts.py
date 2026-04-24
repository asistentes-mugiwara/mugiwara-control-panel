from __future__ import annotations

import pytest

from apps.api.src.shared.contracts import ALLOWED_RESOURCE_STATUSES, resource_response


def test_resource_response_accepts_allowed_statuses() -> None:
    payload = resource_response(
        resource='mugiwaras.catalog',
        status='ready',
        data={'items': []},
        meta={'count': 0},
    )

    assert payload == {
        'resource': 'mugiwaras.catalog',
        'status': 'ready',
        'data': {'items': []},
        'meta': {'count': 0},
    }
    assert 'source_unavailable' in ALLOWED_RESOURCE_STATUSES


def test_resource_response_rejects_unknown_status() -> None:
    with pytest.raises(ValueError, match='Unsupported resource status'):
        resource_response(resource='dashboard.summary', status='loading', data={}, meta={})

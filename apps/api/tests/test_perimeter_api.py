from __future__ import annotations

from fastapi.testclient import TestClient

from apps.api.src.main import app

client = TestClient(app)


def test_api_responses_carry_private_control_plane_security_headers() -> None:
    response = client.get('/health')

    assert response.status_code == 200
    assert response.headers['x-content-type-options'] == 'nosniff'
    assert response.headers['referrer-policy'] == 'no-referrer'
    assert response.headers['x-frame-options'] == 'DENY'
    assert response.headers['cache-control'] == 'no-store'


def test_cors_preflight_is_rejected_without_reflecting_origin() -> None:
    response = client.options(
        '/api/v1/skills/demo-skill',
        headers={
            'Origin': 'https://evil.example',
            'Access-Control-Request-Method': 'PUT',
        },
    )

    assert response.status_code == 403
    assert response.json()['detail']['code'] == 'cors_not_supported'
    assert 'access-control-allow-origin' not in response.headers
    assert 'https://evil.example' not in response.text


def test_request_validation_errors_are_sanitized_without_payload_echo() -> None:
    sensitive_content = 'SENSITIVE_MARKER=should-not-be-echoed\n/internal/private/path'
    response = client.put(
        '/api/v1/skills/demo-skill',
        json={'actor': 'zoro', 'content': sensitive_content, 'expected_sha256': 'short'},
    )

    assert response.status_code == 422
    assert response.json()['detail'] == {
        'code': 'validation_error',
        'message': 'Request validation failed.',
    }
    assert 'SENSITIVE_MARKER' not in response.text
    assert '/internal/private/path' not in response.text
    assert 'expected_sha256' not in response.text

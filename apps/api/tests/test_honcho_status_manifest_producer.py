from __future__ import annotations

import importlib.util
import json
import stat
from pathlib import Path

import pytest


def _load_producer_module():
    module_path = Path(__file__).resolve().parents[3] / 'scripts' / 'write-honcho-status.py'
    spec = importlib.util.spec_from_file_location('write_honcho_status', module_path)
    assert spec is not None and spec.loader is not None
    module = importlib.util.module_from_spec(spec)
    spec.loader.exec_module(module)
    return module


class FakeResponse:
    def __init__(self, status: int, body: str) -> None:
        self.status = status
        self._body = body

    def __enter__(self):
        return self

    def __exit__(self, exc_type, exc, tb):
        return False

    def read(self) -> bytes:
        return self._body.encode('utf-8')


def _write_docker_manifest(path: Path, *, api=True, db=True, redis=True) -> None:
    path.parent.mkdir(parents=True, exist_ok=True)
    path.write_text(
        json.dumps(
            {
                'status': 'success' if api and db and redis else 'failed',
                'result': 'success' if api and db and redis else 'failed',
                'updated_at': '2026-05-02T10:00:00Z',
                'containers': {
                    'honcho-api': {'running': api, 'health': 'none'},
                    'honcho-database': {'running': db, 'health': 'healthy' if db else 'unhealthy'},
                    'honcho-redis': {'running': redis, 'health': 'healthy' if redis else 'unhealthy'},
                },
                'ignored': 'TOKEN /srv/crew-core/.env raw_output',
            }
        ),
        encoding='utf-8',
    )


def test_honcho_status_manifest_producer_writes_minimal_safe_api_db_redis_state(tmp_path):
    producer = _load_producer_module()
    docker_manifest = tmp_path / 'docker-runtime-status.json'
    output = tmp_path / 'runtime' / 'healthcheck' / 'honcho-status.json'
    _write_docker_manifest(docker_manifest)

    result = producer.write_honcho_status(
        docker_runtime_manifest=docker_manifest,
        output_path=output,
        now='2026-05-02T10:15:00Z',
        urlopen=lambda *args, **kwargs: FakeResponse(200, '{"status":"ok", "token":"secret"}'),
    )

    assert result == {
        'status': 'success',
        'result': 'success',
        'updated_at': '2026-05-02T10:15:00Z',
        'api': {'ok': True},
        'db': {'ok': True},
        'redis': {'ok': True},
    }
    assert json.loads(output.read_text(encoding='utf-8')) == result
    serialized = output.read_text(encoding='utf-8')
    for forbidden in ['TOKEN', '/srv/crew-core', '.env', 'raw_output', 'secret', '127.0.0.1:8000', 'honcho-database']:
        assert forbidden not in serialized
    assert output.parent.stat().st_mode & stat.S_IROTH == 0
    assert output.stat().st_mode & stat.S_IROTH == 0


def test_honcho_status_manifest_producer_fails_closed_when_endpoint_or_dependency_fails(tmp_path):
    producer = _load_producer_module()
    docker_manifest = tmp_path / 'docker-runtime-status.json'
    output = tmp_path / 'honcho-status.json'
    _write_docker_manifest(docker_manifest, api=True, db=False, redis=True)

    result = producer.write_honcho_status(
        docker_runtime_manifest=docker_manifest,
        output_path=output,
        now='2026-05-02T10:20:00Z',
        urlopen=lambda *args, **kwargs: FakeResponse(503, '{"status":"error", "password":"secret"}'),
    )

    assert result['status'] == 'failed'
    assert result['api'] == {'ok': False}
    assert result['db'] == {'ok': False}
    assert result['redis'] == {'ok': True}
    serialized = output.read_text(encoding='utf-8')
    assert 'password' not in serialized
    assert 'secret' not in serialized


def test_honcho_status_manifest_producer_rejects_missing_docker_manifest_without_leaking_path(tmp_path):
    producer = _load_producer_module()
    missing = tmp_path / 'missing' / '.env' / 'docker-runtime-status.json'
    with pytest.raises(producer.HonchoStatusProducerError) as exc_info:
        producer.write_honcho_status(
            docker_runtime_manifest=missing,
            output_path=tmp_path / 'honcho-status.json',
            now='2026-05-02T10:25:00Z',
            urlopen=lambda *args, **kwargs: FakeResponse(200, '{"status":"ok"}'),
        )
    assert 'could not be read safely' in str(exc_info.value)
    assert '.env' not in str(exc_info.value)
    assert str(missing) not in str(exc_info.value)


def test_honcho_status_manifest_producer_cli_accepts_safe_output_and_now(tmp_path):
    producer = _load_producer_module()
    docker_manifest = tmp_path / 'docker-runtime-status.json'
    output = tmp_path / 'honcho-status.json'
    _write_docker_manifest(docker_manifest)

    exit_code = producer.main(
        ['--docker-runtime-manifest', str(docker_manifest), '--output', str(output), '--now', '2026-05-02T10:30:00Z'],
        urlopen=lambda *args, **kwargs: FakeResponse(200, '{"status":"ok"}'),
    )

    assert exit_code == 0
    assert json.loads(output.read_text(encoding='utf-8'))['status'] == 'success'

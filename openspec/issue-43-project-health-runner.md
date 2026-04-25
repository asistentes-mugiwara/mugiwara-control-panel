# Issue 43 — project-health producer runner

## Goal
Automate the safe `project-health` manifest producer introduced in Phase 15.4b without widening the backend Healthcheck host boundary.

## Scope
- Add user-level systemd units for `mugiwara-project-health-status.service` and `mugiwara-project-health-status.timer`.
- Add an installer script that copies the units into `~/.config/systemd/user`, reloads systemd and enables the timer.
- Add a static guardrail `npm run verify:project-health-runner` for the runner contract.
- Update docs to state the execution cadence, permissions model and remote sync semantics.

## Decisions
- The runner is a **user service**, not a repo-owned system service with hard-coded `User=`/`Group=`. The operative account that installs the timer owns execution; the producer itself keeps runtime output permissions at `0750` directory and `0640` file.
- The runner intentionally does **not** run `git fetch`. `remote_synced` compares `HEAD` with the local upstream ref already present in the repo. A network-refresh step would introduce credential/network behavior and must be reviewed as a separate operational runner if needed.
- The service does not pass `--repo` or `--output`; it uses the producer defaults to avoid arbitrary path writes.

## Verify
```bash
python -m py_compile scripts/write-project-health-status.py apps/api/tests/test_project_health_manifest_producer.py
pytest apps/api/tests/test_project_health_manifest_producer.py
npm run verify:healthcheck-source-policy
npm run verify:project-health-runner
```

## Review routing
- Franky: systemd user timer, operational cadence, install semantics and no-fetch decision.
- Chopper: host boundary, no arbitrary output path, no leakage of branch/remotes/diffs/raw Git data.

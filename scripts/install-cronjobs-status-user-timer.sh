#!/usr/bin/env bash
# Install the user-level systemd timer that refreshes the safe cronjobs status manifest.
# The installed unit uses the producer default output path and intentionally does not expose prompts, commands, targets or logs.
set -euo pipefail

repo_root="/srv/crew-core/projects/mugiwara-control-panel"
unit_source_dir="$repo_root/ops/systemd/user"
unit_target_dir="${XDG_CONFIG_HOME:-$HOME/.config}/systemd/user"
service_name="mugiwara-cronjobs-status.service"
timer_name="mugiwara-cronjobs-status.timer"

if [[ "${1:-}" == "--help" || "${1:-}" == "-h" ]]; then
  cat <<'USAGE'
Install and enable the Mugiwara Control Panel cronjobs status user timer.

Usage:
  scripts/install-cronjobs-status-user-timer.sh

Contract:
  - installs user units under ~/.config/systemd/user
  - enables and starts mugiwara-cronjobs-status.timer
  - runs npm run write:cronjobs-status from /srv/crew-core/projects/mugiwara-control-panel
  - refreshes every 5 minutes after boot with a small randomized delay
  - producer reads allowlisted Hermes profile cron registries, not one profile-local cronjob list
  - writes /srv/crew-core/runtime/healthcheck/cronjobs-status.json atomically
  - does not serialize job names, owner profiles, prompt bodies, commands, delivery targets, chat IDs, logs, stdout/stderr, raw outputs, host paths, tokens or credentials
USAGE
  exit 0
fi

for unit in "$service_name" "$timer_name"; do
  if [[ ! -f "$unit_source_dir/$unit" ]]; then
    echo "missing unit source: $unit_source_dir/$unit" >&2
    exit 1
  fi
done

install -d -m 0750 "$unit_target_dir"
install -m 0644 "$unit_source_dir/$service_name" "$unit_target_dir/$service_name"
install -m 0644 "$unit_source_dir/$timer_name" "$unit_target_dir/$timer_name"

systemctl --user daemon-reload
systemctl --user enable --now "$timer_name"
systemctl --user list-timers "$timer_name" --no-pager

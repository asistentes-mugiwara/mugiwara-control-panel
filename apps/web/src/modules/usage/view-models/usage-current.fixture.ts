import type { UsageCurrent } from '@contracts/read-models'

export const usageCurrentFixture: UsageCurrent = {
  current_snapshot: {
    captured_at: '2026-04-26T14:29:29+00:00',
    source_label: 'snapshot cada 15 min',
    freshness: {
      state: 'stale',
      age_minutes: null,
      label: 'Snapshot local saneado',
    },
  },
  plan: {
    type: 'prolite',
    allowed: true,
    limit_reached: false,
    additional_limits_count: 1,
  },
  primary_window: {
    label: 'Ventana 5h',
    used_percent: 26,
    window_seconds: 18000,
    started_at: '2026-04-26T10:04:43+00:00',
    reset_at: '2026-04-26T15:04:43+00:00',
    reset_after_seconds: null,
    status: 'normal',
  },
  secondary_cycle: {
    label: 'Ciclo semanal Codex',
    used_percent: 90,
    window_seconds: 604800,
    started_at: '2026-04-21T18:25:51+00:00',
    reset_at: '2026-04-28T18:25:51+00:00',
    reset_after_seconds: null,
    status: 'high',
  },
  recommendation: {
    state: 'alto',
    label: 'Alto',
    message: 'Conviene vigilar. Prioriza tareas importantes y evita exploraciones largas.',
  },
  methodology: {
    cycle_copy: 'Codex no usa el calendario lunes-domingo: el ciclo semanal Codex va desde el reset anterior hasta el próximo reset.',
    primary_window_formula: 'primary_reset_at - 18000s → primary_reset_at',
    secondary_cycle_formula: 'secondary_reset_at - 604800s → secondary_reset_at',
    privacy: 'Lectura agregada y saneada: sin email, user_id, account_id, tokens, headers, prompts ni raw payload.',
  },
}

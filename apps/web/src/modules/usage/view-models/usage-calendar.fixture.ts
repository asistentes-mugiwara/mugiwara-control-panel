import type { UsageCalendar } from '@contracts/read-models'

export const usageCalendarFixture: UsageCalendar = {
  range: 'current_cycle',
  timezone: 'Europe/Madrid',
  current_cycle: {
    label: 'Ciclo semanal Codex',
    started_at: '2026-04-21T18:25:51+00:00',
    reset_at: '2026-04-28T18:25:51+00:00',
  },
  days: [
    {
      date: '2026-04-24',
      codex_segment: {
        started_at: '2026-04-24T00:00:00+02:00',
        ended_at: '2026-04-24T23:59:59+02:00',
        partial: false,
        reason: null,
      },
      secondary_delta_percent: 18,
      primary_windows_count: 4,
      peak_primary_used_percent: 58,
      status: 'normal',
    },
    {
      date: '2026-04-25',
      codex_segment: {
        started_at: '2026-04-25T00:00:00+02:00',
        ended_at: '2026-04-25T23:59:59+02:00',
        partial: false,
        reason: null,
      },
      secondary_delta_percent: 27,
      primary_windows_count: 5,
      peak_primary_used_percent: 74,
      status: 'high',
    },
    {
      date: '2026-04-26',
      codex_segment: {
        started_at: '2026-04-26T00:00:00+02:00',
        ended_at: '2026-04-26T17:04:43+02:00',
        partial: true,
        reason: 'cycle_resets_today',
      },
      secondary_delta_percent: 9,
      primary_windows_count: 3,
      peak_primary_used_percent: 26,
      status: 'normal',
    },
  ],
}

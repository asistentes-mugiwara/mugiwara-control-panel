import type { UsageFiveHourWindowDays } from '@contracts/read-models'

export const usageFiveHourWindowDaysFixture: UsageFiveHourWindowDays = {
  timezone: 'Europe/Madrid',
  empty_reason: null,
  days: [
    { date: '2026-04-21', started_at: '2026-04-20T22:00:00Z', ended_at: '2026-04-21T22:00:00Z', relative_label: null, windows: [] },
    { date: '2026-04-22', started_at: '2026-04-21T22:00:00Z', ended_at: '2026-04-22T22:00:00Z', relative_label: null, windows: [] },
    { date: '2026-04-23', started_at: '2026-04-22T22:00:00Z', ended_at: '2026-04-23T22:00:00Z', relative_label: null, windows: [] },
    { date: '2026-04-24', started_at: '2026-04-23T22:00:00Z', ended_at: '2026-04-24T22:00:00Z', relative_label: null, windows: [] },
    { date: '2026-04-25', started_at: '2026-04-24T22:00:00Z', ended_at: '2026-04-25T22:00:00Z', relative_label: null, windows: [] },
    { date: '2026-04-26', started_at: '2026-04-25T22:00:00Z', ended_at: '2026-04-26T22:00:00Z', relative_label: 'ayer', windows: [] },
    {
      date: '2026-04-27',
      started_at: '2026-04-26T22:00:00Z',
      ended_at: '2026-04-27T22:00:00Z',
      relative_label: 'hoy',
      windows: [
        {
          started_at: '2026-04-27T06:00:00+00:00',
          ended_at: '2026-04-27T11:00:00+00:00',
          assigned_date: '2026-04-27',
          peak_used_percent: 26,
          delta_percent: 26,
          samples_count: 12,
          status: 'normal',
        },
        {
          started_at: '2026-04-27T11:00:00+00:00',
          ended_at: '2026-04-27T16:00:00+00:00',
          assigned_date: '2026-04-27',
          peak_used_percent: 84,
          delta_percent: 48,
          samples_count: 16,
          status: 'high',
        },
      ],
    },
  ],
}

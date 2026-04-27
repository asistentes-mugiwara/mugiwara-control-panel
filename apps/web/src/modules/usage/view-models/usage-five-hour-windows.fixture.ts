import type { UsageFiveHourWindows } from '@contracts/read-models'

export const usageFiveHourWindowsFixture: UsageFiveHourWindows = {
  empty_reason: null,
  windows: [
    {
      started_at: '2026-04-26T18:04:00+00:00',
      ended_at: '2026-04-26T23:04:00+00:00',
      peak_used_percent: 26,
      delta_percent: 26,
      samples_count: 12,
      status: 'normal',
    },
    {
      started_at: '2026-04-26T13:04:00+00:00',
      ended_at: '2026-04-26T18:04:00+00:00',
      peak_used_percent: 84,
      delta_percent: 48,
      samples_count: 16,
      status: 'high',
    },
    {
      started_at: '2026-04-26T08:04:00+00:00',
      ended_at: '2026-04-26T13:04:00+00:00',
      peak_used_percent: 96,
      delta_percent: 62,
      samples_count: 18,
      status: 'critical',
    },
  ],
}

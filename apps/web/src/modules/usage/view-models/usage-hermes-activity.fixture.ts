import type { UsageHermesActivity } from '@contracts/read-models'

export const usageHermesActivityFixture: UsageHermesActivity = {
  range: {
    name: '7d',
    started_at: '2026-04-20T06:00:00Z',
    ended_at: '2026-04-27T06:00:00Z',
  },
  totals: {
    profiles_count: 4,
    sessions_count: 38,
    messages_count: 624,
    tool_calls_count: 217,
    dominant_profile: 'zoro',
  },
  profiles: [
    {
      profile: 'zoro',
      sessions_count: 16,
      messages_count: 248,
      tool_calls_count: 109,
      first_activity_at: '2026-04-20T08:12:00Z',
      last_activity_at: '2026-04-27T05:48:00Z',
      activity_level: 'high',
    },
    {
      profile: 'franky',
      sessions_count: 9,
      messages_count: 151,
      tool_calls_count: 54,
      first_activity_at: '2026-04-21T09:25:00Z',
      last_activity_at: '2026-04-26T23:10:00Z',
      activity_level: 'medium',
    },
    {
      profile: 'chopper',
      sessions_count: 7,
      messages_count: 132,
      tool_calls_count: 31,
      first_activity_at: '2026-04-22T11:04:00Z',
      last_activity_at: '2026-04-26T21:32:00Z',
      activity_level: 'medium',
    },
    {
      profile: 'usopp',
      sessions_count: 6,
      messages_count: 93,
      tool_calls_count: 23,
      first_activity_at: '2026-04-23T10:15:00Z',
      last_activity_at: '2026-04-26T19:44:00Z',
      activity_level: 'low',
    },
  ],
  privacy: {
    mode: 'read_only_aggregated',
    correlation: 'orientativa',
    exclusions: [
      'contenido de mensajes',
      'payloads de herramientas',
      'identificadores privados',
      'rutas internas',
      'secretos o cabeceras',
    ],
  },
  empty_reason: null,
}

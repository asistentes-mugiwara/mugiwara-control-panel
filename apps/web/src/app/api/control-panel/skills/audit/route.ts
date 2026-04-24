import { NextResponse } from 'next/server'

import {
  buildSkillsServerErrorPayload,
  fetchSkillsServerJson,
  normalizeSkillsServerError,
} from '@/modules/skills/api/skills-server-http'

export const dynamic = 'force-dynamic'
export const fetchCache = 'force-no-store'

export async function GET() {
  try {
    const payload = await fetchSkillsServerJson('/api/v1/skills/audit')
    return NextResponse.json(payload)
  } catch (error) {
    const normalized = normalizeSkillsServerError(error)
    return NextResponse.json(buildSkillsServerErrorPayload(normalized), { status: normalized.status })
  }
}

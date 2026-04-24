import { NextResponse } from 'next/server'

import {
  buildSkillsBffValidationErrorPayload,
  isSkillsBffValidationError,
  parseSkillUpdatePayload,
  validateSkillId,
} from '@/modules/skills/api/skills-bff-validation'
import {
  buildSkillsServerErrorPayload,
  fetchSkillsServerJson,
  normalizeSkillsServerError,
} from '@/modules/skills/api/skills-server-http'

export const dynamic = 'force-dynamic'
export const fetchCache = 'force-no-store'

type SkillRouteContext = {
  params: Promise<{
    skillId: string
  }>
}

export async function GET(_request: Request, { params }: SkillRouteContext) {
  try {
    const { skillId } = await params
    const safeSkillId = validateSkillId(skillId)
    const payload = await fetchSkillsServerJson(`/api/v1/skills/${safeSkillId}`)
    return NextResponse.json(payload)
  } catch (error) {
    if (isSkillsBffValidationError(error)) {
      return NextResponse.json(buildSkillsBffValidationErrorPayload(error), { status: error.status })
    }

    const normalized = normalizeSkillsServerError(error)
    return NextResponse.json(buildSkillsServerErrorPayload(normalized), { status: normalized.status })
  }
}

export async function PUT(request: Request, { params }: SkillRouteContext) {
  try {
    const { skillId } = await params
    const safeSkillId = validateSkillId(skillId)
    const payload = await parseSkillUpdatePayload(request)
    const response = await fetchSkillsServerJson(`/api/v1/skills/${safeSkillId}`, {
      method: 'PUT',
      body: JSON.stringify(payload),
    })

    return NextResponse.json(response)
  } catch (error) {
    if (isSkillsBffValidationError(error)) {
      return NextResponse.json(buildSkillsBffValidationErrorPayload(error), { status: error.status })
    }

    const normalized = normalizeSkillsServerError(error)
    return NextResponse.json(buildSkillsServerErrorPayload(normalized), { status: normalized.status })
  }
}

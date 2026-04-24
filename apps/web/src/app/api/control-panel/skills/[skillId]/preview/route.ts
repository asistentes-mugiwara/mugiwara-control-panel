import { NextResponse } from 'next/server'

import {
  assertTrustedOriginForSkillsWrite,
  buildSkillsBffValidationErrorPayload,
  isSkillsBffValidationError,
  parseSkillPreviewPayload,
  validateSkillId,
} from '@/modules/skills/api/skills-bff-validation'
import {
  buildSkillsServerErrorPayload,
  fetchSkillsServerJson,
  normalizeSkillsServerError,
} from '@/modules/skills/api/skills-server-http'

export const dynamic = 'force-dynamic'
export const fetchCache = 'force-no-store'

type SkillPreviewRouteContext = {
  params: Promise<{
    skillId: string
  }>
}

export async function POST(request: Request, { params }: SkillPreviewRouteContext) {
  try {
    assertTrustedOriginForSkillsWrite(request)
    const { skillId } = await params
    const safeSkillId = validateSkillId(skillId)
    const payload = await parseSkillPreviewPayload(request)
    const response = await fetchSkillsServerJson(`/api/v1/skills/${safeSkillId}/preview`, {
      method: 'POST',
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

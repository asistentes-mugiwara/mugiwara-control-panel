import 'server-only'

export const SKILLS_BFF_BODY_LIMIT_BYTES = 256 * 1024
export const SKILLS_BFF_CONTENT_LIMIT_BYTES = 200_000

const SKILL_ID_PATTERN = /^[a-z0-9][a-z0-9_-]{0,139}$/
const SHA256_PATTERN = /^[a-fA-F0-9]{64}$/

export const SKILLS_BFF_TRUSTED_ORIGINS_ENV = 'MUGIWARA_CONTROL_PANEL_TRUSTED_ORIGINS'

type BffErrorCode =
  | 'validation_error'
  | 'unsupported_media_type'
  | 'trusted_origins_not_configured'
  | 'origin_required'
  | 'origin_not_allowed'

type BffErrorPayload = {
  detail: {
    code: BffErrorCode
    message: string
  }
}

export class SkillsBffValidationError extends Error {
  status: number
  code: BffErrorCode

  constructor(message: string, options: { status: number; code: BffErrorCode }) {
    super(message)
    this.name = 'SkillsBffValidationError'
    this.status = options.status
    this.code = options.code
  }
}

function utf8Bytes(value: string) {
  return new TextEncoder().encode(value).length
}


function sanitizeOrigin(value: string) {
  try {
    const parsed = new URL(value)

    if (parsed.protocol !== 'http:' && parsed.protocol !== 'https:') {
      return null
    }

    return parsed.origin
  } catch {
    return null
  }
}

function getTrustedOrigins() {
  const value = process.env[SKILLS_BFF_TRUSTED_ORIGINS_ENV]

  if (!value) {
    return []
  }

  return Array.from(new Set(value.split(',').map((entry) => entry.trim()).map(sanitizeOrigin).filter(Boolean))) as string[]
}

export function assertTrustedOriginForSkillsWrite(request: Request) {
  const trustedOrigins = getTrustedOrigins()

  if (trustedOrigins.length === 0) {
    throw new SkillsBffValidationError('La allowlist server-only de orígenes de Skills no está configurada.', {
      status: 403,
      code: 'trusted_origins_not_configured',
    })
  }

  const origin = request.headers.get('origin')

  if (!origin) {
    throw new SkillsBffValidationError('La frontera BFF de Skills requiere Origin para rutas de escritura.', {
      status: 403,
      code: 'origin_required',
    })
  }

  const safeOrigin = sanitizeOrigin(origin)

  if (!safeOrigin || !trustedOrigins.includes(safeOrigin)) {
    throw new SkillsBffValidationError('Origin no permitido para la frontera BFF de Skills.', {
      status: 403,
      code: 'origin_not_allowed',
    })
  }
}

export function validateSkillId(skillId: string) {
  if (!SKILL_ID_PATTERN.test(skillId)) {
    throw new SkillsBffValidationError('Skill inválida para la frontera BFF.', {
      status: 400,
      code: 'validation_error',
    })
  }

  return skillId
}

export function assertJsonContentType(request: Request) {
  const contentType = request.headers.get('content-type') ?? ''
  const mediaType = contentType.split(';', 1)[0]?.trim().toLowerCase()

  if (mediaType !== 'application/json') {
    throw new SkillsBffValidationError('La frontera BFF de Skills solo acepta application/json.', {
      status: 415,
      code: 'unsupported_media_type',
    })
  }
}

async function readLimitedJson(request: Request): Promise<unknown> {
  const body = await request.text()

  if (utf8Bytes(body) > SKILLS_BFF_BODY_LIMIT_BYTES) {
    throw new SkillsBffValidationError('El payload supera el tamaño máximo permitido por la frontera BFF.', {
      status: 413,
      code: 'validation_error',
    })
  }

  try {
    return JSON.parse(body) as unknown
  } catch {
    throw new SkillsBffValidationError('El payload debe ser JSON válido.', {
      status: 400,
      code: 'validation_error',
    })
  }
}

function validateContent(value: unknown) {
  if (typeof value !== 'string') {
    throw new SkillsBffValidationError('El contenido de la skill debe ser texto.', {
      status: 400,
      code: 'validation_error',
    })
  }

  if (!value.trim()) {
    throw new SkillsBffValidationError('El contenido de la skill no puede quedar vacío.', {
      status: 400,
      code: 'validation_error',
    })
  }

  if (value.includes('\0')) {
    throw new SkillsBffValidationError('El contenido de la skill contiene bytes nulos no permitidos.', {
      status: 400,
      code: 'validation_error',
    })
  }

  if (utf8Bytes(value) > SKILLS_BFF_CONTENT_LIMIT_BYTES) {
    throw new SkillsBffValidationError('El contenido de la skill supera el tamaño máximo permitido.', {
      status: 413,
      code: 'validation_error',
    })
  }

  return value
}

function validateExpectedSha(value: unknown) {
  if (typeof value !== 'string' || !SHA256_PATTERN.test(value)) {
    throw new SkillsBffValidationError('El fingerprint esperado debe ser un sha256 válido.', {
      status: 400,
      code: 'validation_error',
    })
  }

  return value
}

function validateActor(value: unknown) {
  if (typeof value !== 'string') {
    throw new SkillsBffValidationError('El actor visible es obligatorio.', {
      status: 400,
      code: 'validation_error',
    })
  }

  const actor = value.trim()

  if (!actor || actor.length > 120) {
    throw new SkillsBffValidationError('El actor visible debe tener entre 1 y 120 caracteres.', {
      status: 400,
      code: 'validation_error',
    })
  }

  return actor
}

function assertObject(payload: unknown): Record<string, unknown> {
  if (!payload || typeof payload !== 'object' || Array.isArray(payload)) {
    throw new SkillsBffValidationError('El payload debe ser un objeto JSON.', {
      status: 400,
      code: 'validation_error',
    })
  }

  return payload as Record<string, unknown>
}

export async function parseSkillPreviewPayload(request: Request) {
  assertJsonContentType(request)
  const payload = assertObject(await readLimitedJson(request))

  return {
    content: validateContent(payload.content),
    expected_sha256: validateExpectedSha(payload.expected_sha256),
  }
}

export async function parseSkillUpdatePayload(request: Request) {
  assertJsonContentType(request)
  const payload = assertObject(await readLimitedJson(request))

  return {
    actor: validateActor(payload.actor),
    content: validateContent(payload.content),
    expected_sha256: validateExpectedSha(payload.expected_sha256),
  }
}

export function buildSkillsBffValidationErrorPayload(error: SkillsBffValidationError): BffErrorPayload {
  return {
    detail: {
      code: error.code,
      message: error.message,
    },
  }
}

export function isSkillsBffValidationError(error: unknown): error is SkillsBffValidationError {
  return error instanceof SkillsBffValidationError
}

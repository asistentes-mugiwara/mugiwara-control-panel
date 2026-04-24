export const RESOURCE_STATUSES = [
  'ready',
  'empty',
  'error',
  'stale',
  'forbidden',
  'not_configured',
  'validation_error',
  'source_unavailable',
] as const

export type ResourceStatus = typeof RESOURCE_STATUSES[number]

export type ResourceEnvelope<TData, TMeta = Record<string, unknown>> = {
  resource: string
  status: ResourceStatus
  data: TData
  meta: TMeta
}

export type ResourceStatus = 'ready' | 'empty' | 'error' | 'stale' | 'forbidden' | 'not_configured' | 'validation_error' | 'source_unavailable'

export type ResourceEnvelope<TData, TMeta = Record<string, unknown>> = {
  resource: string
  status: ResourceStatus
  data: TData
  meta: TMeta
}

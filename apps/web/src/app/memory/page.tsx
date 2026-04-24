import type { MemoryAgentDetail as ApiMemoryAgentDetail, MemoryAgentSummary as ApiMemoryAgentSummary } from '@contracts/read-models'

import { fetchMemoryDetail, fetchMemorySummary, MemoryApiError } from '@/modules/memory/api/memory-http'
import { MUGIWARA_SLUGS, type MugiwaraSlug } from '@/shared/mugiwara/crest-map'
import type { AppStatus } from '@/shared/theme/tokens'

import { MemoryClient, type MemoryPageNotice } from './MemoryClient'

type InitialMemoryData = {
  apiSummaries: ApiMemoryAgentSummary[] | null
  apiDetails: Partial<Record<MugiwaraSlug, ApiMemoryAgentDetail>>
  apiState: 'ready' | 'fallback'
  apiNotice: MemoryPageNotice | null
}

async function getInitialMemoryData(): Promise<InitialMemoryData> {
  try {
    const summary = await fetchMemorySummary()

    if (summary.status !== 'ready') {
      return {
        apiSummaries: null,
        apiDetails: {},
        apiState: 'fallback',
        apiNotice: {
          status: 'sin-datos',
          title: 'API Memory sin datos configurados',
          description: 'La API respondió sin catálogo disponible; se mantiene fixture saneado para no romper la lectura.',
          detail: summary.status,
        },
      }
    }

    const detailResults = await Promise.allSettled(MUGIWARA_SLUGS.map((slug) => fetchMemoryDetail(slug)))
    const apiDetails: Partial<Record<MugiwaraSlug, ApiMemoryAgentDetail>> = {}

    detailResults.forEach((result, index) => {
      if (result.status === 'fulfilled') {
        apiDetails[MUGIWARA_SLUGS[index]] = result.value.data
      }
    })

    const missingDetails = MUGIWARA_SLUGS.length - Object.keys(apiDetails).length

    return {
      apiSummaries: summary.data.items,
      apiDetails,
      apiState: 'ready',
      apiNotice:
        missingDetails > 0
          ? {
              status: 'stale' as AppStatus,
              title: 'API Memory parcialmente disponible',
              description: 'El catálogo se ha cargado desde backend, pero algún detalle ha caído a fixture saneado.',
              detail: `${missingDetails} detalles no disponibles`,
            }
          : null,
    }
  } catch (error) {
    const apiError = error instanceof MemoryApiError ? error : null

    return {
      apiSummaries: null,
      apiDetails: {},
      apiState: 'fallback',
      apiNotice: {
        status: apiError?.code === 'not_configured' ? 'sin-datos' : 'incidencia',
        title: apiError?.code === 'not_configured' ? 'API Memory no configurada' : 'API Memory no disponible',
        description: 'La página mantiene el fallback saneado local. No se muestran dumps crudos ni detalles técnicos de memoria.',
        detail: apiError?.code,
      },
    }
  }
}

export default async function MemoryPage() {
  const initialData = await getInitialMemoryData()

  return <MemoryClient {...initialData} />
}

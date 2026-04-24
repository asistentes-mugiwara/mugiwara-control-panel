import Link from 'next/link'

import {
  dashboardSummaryFixture,
  type DashboardCount,
  type DashboardSummary,
} from '@/modules/dashboard/view-models/dashboard-summary.fixture'
import { fetchDashboardSummary, DashboardApiError } from '@/modules/dashboard/api/dashboard-http'
import {
  getDashboardSeverityLabel,
  mapDashboardFreshnessToStatus,
  mapDashboardSeverityToStatus,
} from '@/modules/dashboard/view-models/dashboard-mappers'
import { PageHeader } from '@/shared/ui/app-shell/PageHeader'
import { SurfaceCard } from '@/shared/ui/cards/SurfaceCard'
import { StatePanel } from '@/shared/ui/state/StatePanel'
import { StatusBadge } from '@/shared/ui/status/StatusBadge'
import { appTheme, type AppStatus } from '@/shared/theme/tokens'

type DashboardPageNotice = {
  status: AppStatus
  title: string
  description: string
  detail?: string
}

export const dynamic = 'force-dynamic'

async function getInitialDashboardData(): Promise<{ summary: DashboardSummary; apiNotice: DashboardPageNotice | null }> {
  try {
    const response = await fetchDashboardSummary()

    if (response.status !== 'ready') {
      return {
        summary: dashboardSummaryFixture,
        apiNotice: {
          status: 'sin-datos',
          title: 'API Dashboard sin datos configurados',
          description: 'La API respondió sin agregado disponible; se mantiene fixture saneado para no romper la navegación.',
          detail: response.status,
        },
      }
    }

    return { summary: response.data as DashboardSummary, apiNotice: null }
  } catch (error) {
    const apiError = error instanceof DashboardApiError ? error : null

    return {
      summary: dashboardSummaryFixture,
      apiNotice: {
        status: apiError?.code === 'not_configured' ? 'sin-datos' : 'incidencia',
        title:
          apiError?.code === 'not_configured'
            ? 'API Dashboard no configurada'
            : apiError?.code === 'invalid_config'
              ? 'Configuración server-only de Dashboard inválida'
              : 'API Dashboard no disponible',
        description: 'La página mantiene fallback saneado local. No se muestran detalles internos del backend ni salidas operativas crudas.',
        detail: apiError?.code,
      },
    }
  }
}

function CountGridItem({ count }: { count: DashboardCount }) {
  return (
    <SurfaceCard title={count.label} elevated accent="sky" eyebrow="Lectura operativa">
      <p style={{ margin: '0 0 6px', fontSize: '30px', fontWeight: 700 }}>{count.value}</p>
      <p style={{ margin: 0, color: appTheme.colors.textSecondary }}>{count.note}</p>
    </SurfaceCard>
  )
}

export default async function DashboardPage() {
  const { summary, apiNotice } = await getInitialDashboardData()

  return (
    <>
      <PageHeader
        eyebrow="Dashboard"
        title="Estado del barco"
        subtitle="Resumen de observabilidad de solo lectura con contadores, severidad visible y accesos a módulos propietarios."
        mugiwaraSlug="luffy"
        detailPills={['Puente de mando', 'Lectura saneada', 'Módulos propietarios']}
      />

      {apiNotice ? (
        <StatePanel
          status={apiNotice.status}
          title={apiNotice.title}
          description={apiNotice.description}
          detail={apiNotice.detail}
          eyebrow="Estado de API"
        />
      ) : null}

      <section className="layout-grid layout-grid--cards-260">
        {summary.counts.map((count) => (
          <CountGridItem key={count.label} count={count} />
        ))}
      </section>

      <section className="section-block layout-grid layout-grid--cards-280">
        <SurfaceCard title="Severidad más alta" eyebrow="Radar" accent="warning">
          <p style={{ marginTop: 0, marginBottom: '8px' }}>
            Nivel actual: <strong>{getDashboardSeverityLabel(summary.highest_severity)}</strong>
          </p>
          <StatusBadge status={mapDashboardSeverityToStatus(summary.highest_severity)} />
        </SurfaceCard>

        <SurfaceCard title="Frescura" elevated eyebrow="Bitácora" accent="gold">
          <p style={{ marginTop: 0, marginBottom: '8px' }}>{summary.freshness.label}</p>
          <p style={{ marginTop: 0, marginBottom: '8px', color: appTheme.colors.textSecondary }}>
            Última actualización: {summary.freshness.updated_at}
          </p>
          <StatusBadge status={mapDashboardFreshnessToStatus(summary.freshness)} />
        </SurfaceCard>

        <SurfaceCard title="Módulos monitoreados" eyebrow="Cubierta" accent="sky">
          <ul style={{ marginTop: 0, marginBottom: '8px', paddingLeft: '18px' }}>
            {summary.sections.map((section) => (
              <li key={section.id} style={{ marginBottom: '4px' }}>
                {section.label}
              </li>
            ))}
          </ul>
        </SurfaceCard>
      </section>

      <section className="section-block">
        <SurfaceCard title="Accesos rápidos" eyebrow="Rumbo" accent="gold">
          <div style={{ display: 'flex', flexWrap: 'wrap', gap: '10px' }}>
            {summary.links.map((link) => (
              <Link
                key={link.href}
                href={link.href}
                style={{
                  border: `1px solid ${appTheme.colors.borderSubtle}`,
                  padding: '8px 12px',
                  borderRadius: appTheme.radius.md,
                  color: appTheme.colors.brandSky500,
                  textDecoration: 'none',
                  fontWeight: 600,
                }}
              >
                {link.label}
              </Link>
            ))}
          </div>
        </SurfaceCard>
      </section>
    </>
  )
}

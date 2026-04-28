import type { Metadata } from 'next'

import { fetchSystemMetrics, SystemMetricsApiError } from '@/modules/system/api/system-metrics-http'
import { createHeaderSystemMetricsSnapshot, createUnavailableHeaderSystemMetrics } from '@/modules/system/view-models/system-metrics-summary'
import { LAYA_MUGIWARA_FAVICON_SRC } from '@/shared/brand/laya-mugiwara-brand'
import { AppShell } from '@/shared/ui/app-shell/AppShell'

import './globals.css'

export const dynamic = 'force-dynamic'

export const metadata: Metadata = {
  title: 'Mugiwara Control Panel',
  description: 'Private Mugiwara/Hermes control plane',
  icons: {
    icon: [
      { url: LAYA_MUGIWARA_FAVICON_SRC, type: 'image/svg+xml' },
    ],
    shortcut: [LAYA_MUGIWARA_FAVICON_SRC],
    apple: [LAYA_MUGIWARA_FAVICON_SRC],
  },
}

async function loadHeaderSystemMetrics() {
  try {
    const response = await fetchSystemMetrics()
    return createHeaderSystemMetricsSnapshot(response.data)
  } catch (error) {
    if (error instanceof SystemMetricsApiError && error.code === 'not_configured') {
      return createUnavailableHeaderSystemMetrics('not_configured')
    }

    return createUnavailableHeaderSystemMetrics('unavailable')
  }
}

export default async function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode
}>) {
  const headerSystemMetrics = await loadHeaderSystemMetrics()

  return (
    <html lang="es">
      <body>
        <AppShell systemMetrics={headerSystemMetrics}>{children}</AppShell>
      </body>
    </html>
  )
}

import type { Metadata } from 'next'

import { AppShell } from '@/shared/ui/app-shell/AppShell'

import './globals.css'

export const metadata: Metadata = {
  title: 'Mugiwara Control Panel',
  description: 'Private Mugiwara/Hermes control plane',
}

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode
}>) {
  return (
    <html lang="es">
      <body>
        <AppShell>{children}</AppShell>
      </body>
    </html>
  )
}

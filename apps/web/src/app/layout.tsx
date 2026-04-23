import type { Metadata } from 'next'
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
      <body>{children}</body>
    </html>
  )
}

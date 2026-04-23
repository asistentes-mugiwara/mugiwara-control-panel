import type { ReactNode } from 'react'

import { appTheme } from '@/shared/theme/tokens'
import { SidebarNav } from '@/shared/ui/navigation/SidebarNav'

import { Topbar } from './Topbar'

type AppShellProps = {
  children: ReactNode
}

export function AppShell({ children }: AppShellProps) {
  return (
    <div
      style={{
        minHeight: '100vh',
        background: appTheme.colors.bgApp,
        color: appTheme.colors.textPrimary,
        display: 'grid',
        gridTemplateColumns: `${appTheme.layout.sidebarWidth} 1fr`,
      }}
    >
      <SidebarNav />

      <div style={{ display: 'flex', flexDirection: 'column', minWidth: 0 }}>
        <Topbar />

        <main
          style={{
            padding: '24px',
          }}
        >
          <div
            style={{
              margin: '0 auto',
              width: '100%',
              maxWidth: appTheme.layout.maxContentWidth,
            }}
          >
            {children}
          </div>
        </main>
      </div>
    </div>
  )
}

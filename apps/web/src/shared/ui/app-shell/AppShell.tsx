'use client'

import { useEffect, useState, type ReactNode } from 'react'

import { appTheme } from '@/shared/theme/tokens'
import { SidebarNav } from '@/shared/ui/navigation/SidebarNav'

import { Topbar } from './Topbar'

type AppShellProps = {
  children: ReactNode
}

export function AppShell({ children }: AppShellProps) {
  const [isMobileNavOpen, setIsMobileNavOpen] = useState(false)

  useEffect(() => {
    function handleResize() {
      if (window.innerWidth >= 960) {
        setIsMobileNavOpen(false)
      }
    }

    handleResize()
    window.addEventListener('resize', handleResize)
    return () => window.removeEventListener('resize', handleResize)
  }, [])

  return (
    <div
      className="app-shell"
      style={{
        minHeight: '100vh',
        background: appTheme.colors.bgApp,
        color: appTheme.colors.textPrimary,
      }}
    >
      <SidebarNav isMobileOpen={isMobileNavOpen} onNavigate={() => setIsMobileNavOpen(false)} />

      {isMobileNavOpen ? <button className="app-shell__overlay" aria-label="Cerrar navegación" onClick={() => setIsMobileNavOpen(false)} /> : null}

      <div className="app-shell__content" style={{ display: 'flex', flexDirection: 'column', minWidth: 0 }}>
        <Topbar isMobileNavOpen={isMobileNavOpen} onToggleNavigation={() => setIsMobileNavOpen((current) => !current)} />

        <main
          className="app-shell__main"
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

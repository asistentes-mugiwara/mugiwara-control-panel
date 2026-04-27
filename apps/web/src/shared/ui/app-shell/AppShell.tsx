'use client'

import { useEffect, useId, useRef, useState, type ReactNode } from 'react'

import type { HeaderSystemMetrics } from './system-metrics'
import { appTheme } from '@/shared/theme/tokens'
import { SidebarNav } from '@/shared/ui/navigation/SidebarNav'

import { Topbar } from './Topbar'

type AppShellProps = {
  children: ReactNode
  systemMetrics: HeaderSystemMetrics
}

export function AppShell({ children, systemMetrics }: AppShellProps) {
  const [isMobileNavOpen, setIsMobileNavOpen] = useState(false)
  const [isDesktop, setIsDesktop] = useState(true)
  const navId = useId()
  const navRef = useRef<HTMLElement | null>(null)
  const menuButtonRef = useRef<HTMLButtonElement | null>(null)

  useEffect(() => {
    function handleResize() {
      const nextIsDesktop = window.innerWidth >= 960
      setIsDesktop(nextIsDesktop)

      if (nextIsDesktop) {
        setIsMobileNavOpen(false)
      }
    }

    handleResize()
    window.addEventListener('resize', handleResize)
    return () => window.removeEventListener('resize', handleResize)
  }, [])

  useEffect(() => {
    if (isDesktop || !isMobileNavOpen) {
      return
    }

    const firstFocusable = navRef.current?.querySelector<HTMLElement>('a[href], button:not([disabled])')
    firstFocusable?.focus()
  }, [isDesktop, isMobileNavOpen])

  useEffect(() => {
    if (isDesktop || !isMobileNavOpen) {
      return
    }

    function handleKeyDown(event: KeyboardEvent) {
      if (event.key === 'Escape') {
        setIsMobileNavOpen(false)
        menuButtonRef.current?.focus()
      }
    }

    window.addEventListener('keydown', handleKeyDown)
    return () => window.removeEventListener('keydown', handleKeyDown)
  }, [isDesktop, isMobileNavOpen])

  return (
    <div
      className="app-shell"
      style={{
        minHeight: '100vh',
        background: appTheme.colors.bgApp,
        color: appTheme.colors.textPrimary,
      }}
    >
      <SidebarNav
        navId={navId}
        navRef={navRef}
        isDesktop={isDesktop}
        isMobileOpen={isMobileNavOpen}
        onNavigate={() => setIsMobileNavOpen(false)}
      />

      {isMobileNavOpen ? <button className="app-shell__overlay" aria-label="Cerrar navegación" onClick={() => setIsMobileNavOpen(false)} /> : null}

      <div className="app-shell__content" style={{ display: 'flex', flexDirection: 'column', minWidth: 0 }}>
        <Topbar
          menuButtonRef={menuButtonRef}
          navId={navId}
          isMobileNavOpen={isMobileNavOpen}
          systemMetrics={systemMetrics}
          onToggleNavigation={() => setIsMobileNavOpen((current) => !current)}
        />

        <a href="#app-shell-main" className="app-shell__skip-link">Saltar al contenido</a>

        <main
          id="app-shell-main"
          tabIndex={-1}
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

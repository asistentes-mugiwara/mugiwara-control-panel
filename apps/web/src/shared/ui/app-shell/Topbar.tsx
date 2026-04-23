'use client'

import type { RefObject } from 'react'

import { appTheme } from '@/shared/theme/tokens'
import { StatusBadge } from '@/shared/ui/status/StatusBadge'

type TopbarProps = {
  navId: string
  menuButtonRef: RefObject<HTMLButtonElement | null>
  isMobileNavOpen: boolean
  onToggleNavigation: () => void
}

export function Topbar({ navId, menuButtonRef, isMobileNavOpen, onToggleNavigation }: TopbarProps) {
  return (
    <header
      style={{
        position: 'sticky',
        top: 0,
        zIndex: 30,
        borderBottom: `1px solid ${appTheme.colors.borderSubtle}`,
        background: appTheme.colors.bgApp,
      }}
    >
      <div
        className="topbar"
        style={{
          margin: '0 auto',
          maxWidth: `calc(${appTheme.layout.maxContentWidth} + 48px)`,
          padding: '14px 24px',
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          gap: '12px',
        }}
      >
        <div className="topbar__brand">
          <button
            type="button"
            className="topbar__menu-button"
            ref={menuButtonRef}
            aria-label={isMobileNavOpen ? 'Cerrar navegación principal' : 'Abrir navegación principal'}
            aria-expanded={isMobileNavOpen}
            aria-controls={navId}
            onClick={onToggleNavigation}
            style={{
              border: `1px solid ${appTheme.colors.borderSubtle}`,
              borderRadius: appTheme.radius.md,
              background: appTheme.colors.bgSurface1,
              color: appTheme.colors.textPrimary,
              padding: '8px 10px',
              cursor: 'pointer',
            }}
          >
            ☰
          </button>

          <div className="topbar__identity">
            <p style={{ margin: 0, color: appTheme.colors.textSecondary, fontSize: '12px' }}>Control plane privado</p>
            <strong style={{ display: 'block', marginTop: '2px' }}>Mugiwara / Hermes</strong>
          </div>
        </div>

        <div className="topbar__status-group" style={{ display: 'flex', alignItems: 'center', gap: '10px', flexWrap: 'wrap' }}>
          <span
            className="topbar__command-chip"
            style={{
              border: `1px solid ${appTheme.colors.borderSubtle}`,
              borderRadius: appTheme.radius.md,
              padding: '6px 10px',
              color: appTheme.colors.textMuted,
              fontSize: '12px',
            }}
          >
            ⌘K command (soon)
          </span>
          <StatusBadge status="operativo" />
        </div>
      </div>
    </header>
  )
}

'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'

import { appTheme } from '@/shared/theme/tokens'

const routes = [
  { href: '/dashboard', label: 'Dashboard', icon: '◉' },
  { href: '/mugiwaras', label: 'Mugiwaras', icon: '⚓' },
  { href: '/skills', label: 'Skills', icon: '✦' },
  { href: '/memory', label: 'Memory', icon: '◎' },
  { href: '/vault', label: 'Vault', icon: '◈' },
  { href: '/healthcheck', label: 'Healthcheck', icon: '✓' },
] as const

export function SidebarNav() {
  const pathname = usePathname()

  return (
    <aside
      style={{
        background: appTheme.colors.bgSidebar,
        borderRight: `1px solid ${appTheme.colors.borderSubtle}`,
        padding: '20px 14px',
        position: 'sticky',
        top: 0,
        height: '100vh',
      }}
      aria-label="Navegación principal"
    >
      <p
        style={{
          margin: '0 10px 18px',
          color: appTheme.colors.brandGold400,
          fontSize: '12px',
          letterSpacing: '0.08em',
          textTransform: 'uppercase',
        }}
      >
        Mugiwara Control Panel
      </p>

      <nav>
        <ul style={{ listStyle: 'none', margin: 0, padding: 0, display: 'grid', gap: '8px' }}>
          {routes.map((route) => {
            const isActive =
              pathname === route.href ||
              (route.href !== '/dashboard' && pathname.startsWith(`${route.href}/`))

            return (
              <li key={route.href}>
                <Link
                  href={route.href}
                  style={{
                    display: 'flex',
                    gap: '10px',
                    alignItems: 'center',
                    borderRadius: appTheme.radius.md,
                    padding: '10px 12px',
                    fontWeight: 600,
                    color: isActive ? appTheme.colors.textPrimary : appTheme.colors.textSecondary,
                    background: isActive ? appTheme.colors.bgSurface2 : 'transparent',
                    border: `1px solid ${isActive ? appTheme.colors.brandBlue700 : 'transparent'}`,
                  }}
                  aria-current={isActive ? 'page' : undefined}
                >
                  <span
                    style={{
                      color: isActive ? appTheme.colors.brandGold400 : appTheme.colors.textMuted,
                      width: '16px',
                      textAlign: 'center',
                    }}
                    aria-hidden
                  >
                    {route.icon}
                  </span>
                  <span>{route.label}</span>
                </Link>
              </li>
            )
          })}
        </ul>
      </nav>
    </aside>
  )
}

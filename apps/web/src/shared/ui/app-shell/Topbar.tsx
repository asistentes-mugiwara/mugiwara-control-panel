import { appTheme } from '@/shared/theme/tokens'
import { StatusBadge } from '@/shared/ui/status/StatusBadge'

export function Topbar() {
  return (
    <header
      style={{
        position: 'sticky',
        top: 0,
        zIndex: 10,
        borderBottom: `1px solid ${appTheme.colors.borderSubtle}`,
        background: appTheme.colors.bgApp,
      }}
    >
      <div
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
        <div>
          <p style={{ margin: 0, color: appTheme.colors.textSecondary, fontSize: '12px' }}>
            Control plane privado
          </p>
          <strong style={{ display: 'block', marginTop: '2px' }}>Mugiwara / Hermes</strong>
        </div>

        <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
          <span
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

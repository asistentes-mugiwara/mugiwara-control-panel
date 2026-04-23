import { appTheme } from '@/shared/theme/tokens'

export default function DashboardPage() {
  return (
    <main
      style={{
        minHeight: '100vh',
        background: appTheme.colors.bgApp,
        color: appTheme.colors.textPrimary,
        padding: '32px',
        fontFamily: 'Inter, Arial, sans-serif',
      }}
    >
      <section
        style={{
          maxWidth: '960px',
          margin: '0 auto',
          border: `1px solid ${appTheme.colors.borderSubtle}`,
          borderRadius: '16px',
          background: appTheme.colors.bgSurface,
          padding: '24px',
        }}
      >
        <p style={{ color: appTheme.colors.brandGold, margin: 0 }}>Fase 8.1</p>
        <h1 style={{ marginTop: '12px', marginBottom: '12px' }}>
          Web tooling bootstrap listo para shell foundation
        </h1>
        <p style={{ color: appTheme.colors.textSecondary, marginTop: 0 }}>
          Este placeholder confirma que `apps/web` ya arranca como base Next.js y que
          la siguiente microfase puede centrarse en `layout`, navegación y componentes
          del shell sin volver a improvisar el tooling.
        </p>
      </section>
    </main>
  )
}

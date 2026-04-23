export const appTheme = {
  colors: {
    bgApp: '#0B1220',
    bgSidebar: '#0E1628',
    bgSurface1: '#131D31',
    bgSurface2: '#18243D',
    borderSubtle: 'rgba(255,255,255,0.08)',
    textPrimary: '#E8E8E8',
    textSecondary: '#AAB4C8',
    textMuted: '#7E8AA3',
    brandNavy900: '#183A83',
    brandBlue700: '#2561CE',
    brandSky500: '#5A9DDB',
    brandGold400: '#FFE347',
    brandRed600: '#C94128',
    brandBrown700: '#503528',
    stateSuccess: '#3FAF6B',
    stateWarning: '#D9A441',
    stateDanger: '#C94128',
    stateStale: '#C97B2E',
    stateNeutral: '#6C7891',
  },
  layout: {
    sidebarWidth: '248px',
    maxContentWidth: '1200px',
  },
  radius: {
    md: '12px',
    lg: '16px',
  },
} as const

export type AppStatus = 'operativo' | 'revision' | 'incidencia' | 'stale' | 'sin-datos'

export const statusColorMap: Record<AppStatus, string> = {
  operativo: appTheme.colors.stateSuccess,
  revision: appTheme.colors.stateWarning,
  incidencia: appTheme.colors.stateDanger,
  stale: appTheme.colors.stateStale,
  'sin-datos': appTheme.colors.stateNeutral,
}

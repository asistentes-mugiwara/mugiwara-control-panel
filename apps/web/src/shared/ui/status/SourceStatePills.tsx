import { appTheme } from '@/shared/theme/tokens'

export type SourceStatePillTone = 'connected' | 'fallback' | 'snapshot' | 'not-realtime' | 'not-configured' | 'degraded'

export type SourceStatePill = {
  label: string
  tone?: SourceStatePillTone
}

const sourceStateToneColorMap: Record<SourceStatePillTone, string> = {
  connected: appTheme.colors.stateSuccess,
  fallback: appTheme.colors.stateWarning,
  snapshot: appTheme.colors.brandSky500,
  'not-realtime': appTheme.colors.stateStale,
  'not-configured': appTheme.colors.stateNeutral,
  degraded: appTheme.colors.stateDanger,
}

export function SourceStatePills({ items }: { items: SourceStatePill[] }) {
  return (
    <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap', minWidth: 0 }}>
      {items.map((item) => {
        const color = sourceStateToneColorMap[item.tone ?? 'snapshot']

        return (
          <span
            key={`${item.label}-${item.tone ?? 'snapshot'}`}
            style={{
              display: 'inline-flex',
              alignItems: 'center',
              maxWidth: '100%',
              borderRadius: '999px',
              padding: '4px 10px',
              background: appTheme.colors.bgSurface2,
              border: `1px solid ${color}`,
              color,
              fontSize: '12px',
              fontWeight: 700,
              overflowWrap: 'anywhere',
              whiteSpace: 'normal',
            }}
          >
            {item.label}
          </span>
        )
      })}
    </div>
  )
}

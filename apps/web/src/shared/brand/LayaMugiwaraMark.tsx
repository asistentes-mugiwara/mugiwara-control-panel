import { LAYA_MUGIWARA_MARK_ALT, LAYA_MUGIWARA_MARK_SRC } from './laya-mugiwara-brand'

type LayaMugiwaraMarkSize = 'sm' | 'md'

const sizeMap: Record<LayaMugiwaraMarkSize, number> = {
  sm: 28,
  md: 40,
}

type LayaMugiwaraMarkProps = {
  size?: LayaMugiwaraMarkSize
  decorative?: boolean
}

export function LayaMugiwaraMark({ size = 'sm', decorative = false }: LayaMugiwaraMarkProps) {
  const dimension = sizeMap[size]

  return (
    <img
      src={LAYA_MUGIWARA_MARK_SRC}
      alt={decorative ? '' : LAYA_MUGIWARA_MARK_ALT}
      aria-hidden={decorative}
      width={dimension}
      height={dimension}
      style={{
        display: 'block',
        width: `${dimension}px`,
        height: `${dimension}px`,
        objectFit: 'cover',
        borderRadius: '999px',
        boxShadow: '0 0 0 1px rgba(255, 255, 255, 0.14), 0 0 14px rgba(90, 157, 219, 0.24)',
      }}
    />
  )
}

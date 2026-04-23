import { getMugiwaraCrestSrc, getMugiwaraProfile, type MugiwaraSlug } from './crest-map'

type MugiwaraCrestSize = 'sm' | 'md' | 'lg'

const sizeMap: Record<MugiwaraCrestSize, number> = {
  sm: 24,
  md: 40,
  lg: 56,
}

type MugiwaraCrestProps = {
  slug: MugiwaraSlug
  size?: MugiwaraCrestSize
  decorative?: boolean
  accent?: boolean
}

export function MugiwaraCrest({ slug, size = 'md', decorative = false, accent = false }: MugiwaraCrestProps) {
  const profile = getMugiwaraProfile(slug)
  const dimension = sizeMap[size]

  return (
    <img
      src={getMugiwaraCrestSrc(slug)}
      alt={decorative ? '' : `Calavera de ${profile.name}`}
      aria-hidden={decorative}
      width={dimension}
      height={dimension}
      style={{
        display: 'block',
        objectFit: 'contain',
        filter: accent ? 'drop-shadow(0 0 10px rgba(90, 157, 219, 0.28))' : undefined,
      }}
    />
  )
}

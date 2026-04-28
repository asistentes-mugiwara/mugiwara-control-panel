export const MUGIWARA_SLUGS = [
  'luffy',
  'zoro',
  'franky',
  'nami',
  'usopp',
  'robin',
  'jinbe',
  'sanji',
  'chopper',
  'brook',
] as const

export type MugiwaraSlug = (typeof MUGIWARA_SLUGS)[number]
export type MugiwaraCrestFormat = 'svg' | 'png'

export type MugiwaraProfile = {
  slug: MugiwaraSlug
  name: string
  role: string
  crestSvgSrc: string
  crestPngSrc: string
}

export const MUGIWARA_PROFILES: Record<MugiwaraSlug, MugiwaraProfile> = {
  luffy: {
    slug: 'luffy',
    name: 'Luffy',
    role: 'CEO y Orquestador',
    crestSvgSrc: '/assets/mugiwaras/crests/luffy.svg',
    crestPngSrc: '/assets/mugiwaras/crests-png/luffy.png',
  },
  zoro: {
    slug: 'zoro',
    name: 'Zoro',
    role: 'CTO e Ingeniero de Software',
    crestSvgSrc: '/assets/mugiwaras/crests/zoro.svg',
    crestPngSrc: '/assets/mugiwaras/crests-png/zoro.png',
  },
  franky: {
    slug: 'franky',
    name: 'Franky',
    role: 'DevOps e Ingeniero de Sistemas',
    crestSvgSrc: '/assets/mugiwaras/crests/franky.svg',
    crestPngSrc: '/assets/mugiwaras/crests-png/franky.png',
  },
  nami: {
    slug: 'nami',
    name: 'Nami',
    role: 'CFO y Directora Financiera',
    crestSvgSrc: '/assets/mugiwaras/crests/nami.svg',
    crestPngSrc: '/assets/mugiwaras/crests-png/nami.png',
  },
  usopp: {
    slug: 'usopp',
    name: 'Usopp',
    role: 'CMO y Director de Marketing',
    crestSvgSrc: '/assets/mugiwaras/crests/usopp.svg',
    crestPngSrc: '/assets/mugiwaras/crests-png/usopp.png',
  },
  robin: {
    slug: 'robin',
    name: 'Nico Robin',
    role: 'Directora de Research',
    crestSvgSrc: '/assets/mugiwaras/crests/robin.svg',
    crestPngSrc: '/assets/mugiwaras/crests-png/robin.png',
  },
  jinbe: {
    slug: 'jinbe',
    name: 'Jinbe',
    role: 'CLO y Asesor Legal-burocrático',
    crestSvgSrc: '/assets/mugiwaras/crests/jinbe.svg',
    crestPngSrc: '/assets/mugiwaras/crests-png/jinbe.png',
  },
  sanji: {
    slug: 'sanji',
    name: 'Sanji',
    role: 'Scout de Compras, Reservas y Servicios',
    crestSvgSrc: '/assets/mugiwaras/crests/sanji.svg',
    crestPngSrc: '/assets/mugiwaras/crests-png/sanji.png',
  },
  chopper: {
    slug: 'chopper',
    name: 'Chopper',
    role: 'CISO y Experto en Ciberseguridad',
    crestSvgSrc: '/assets/mugiwaras/crests/chopper.svg',
    crestPngSrc: '/assets/mugiwaras/crests-png/chopper.png',
  },
  brook: {
    slug: 'brook',
    name: 'Brook',
    role: 'CDO y Data Scientist',
    crestSvgSrc: '/assets/mugiwaras/crests/brook.svg',
    crestPngSrc: '/assets/mugiwaras/crests-png/brook.png',
  },
}

export function isMugiwaraSlug(value: string): value is MugiwaraSlug {
  return MUGIWARA_SLUGS.includes(value as MugiwaraSlug)
}

export function getMugiwaraProfile(slug: MugiwaraSlug): MugiwaraProfile {
  return MUGIWARA_PROFILES[slug]
}

export function getMugiwaraCrestSrc(slug: MugiwaraSlug, format: MugiwaraCrestFormat = 'svg'): string {
  const profile = getMugiwaraProfile(slug)
  return format === 'png' ? profile.crestPngSrc : profile.crestSvgSrc
}

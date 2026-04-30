import Link from 'next/link'

import { LayaMugiwaraMark } from '@/shared/brand/LayaMugiwaraMark'
import { appTheme } from '@/shared/theme/tokens'
import { SurfaceCard } from '@/shared/ui/cards/SurfaceCard'

const homeRouteCards = [
  {
    href: '/mugiwaras',
    icon: '⚓',
    title: 'Mugiwaras',
    description: 'Roster de especialistas, roles activos y acceso a las fichas de cada agente.',
    cta: 'Ver tripulación',
    accent: 'gold',
  },
  {
    href: '/skills',
    icon: '✦',
    title: 'Skills',
    description: 'Catálogo gobernado y única superficie editable prevista en el MVP.',
    cta: 'Abrir skills',
    accent: 'sky',
  },
  {
    href: '/memory',
    icon: '◎',
    title: 'Memory',
    description: 'Lectura de memoria técnica y relacional expuesta de forma saneada.',
    cta: 'Consultar memoria',
    accent: 'success',
  },
  {
    href: '/vault',
    icon: '◈',
    title: 'Vault',
    description: 'Explorador privado del canon Markdown de Mugiwara y Hermes.',
    cta: 'Entrar al vault',
    accent: 'gold',
  },
  {
    href: '/healthcheck',
    icon: '✓',
    title: 'Healthcheck',
    description: 'Estado de productores y señales operativas sin convertir Inicio en dashboard.',
    cta: 'Revisar salud',
    accent: 'success',
  },
  {
    href: '/git',
    icon: '⌁',
    title: 'Repos Git',
    description: 'Vista read-only de repos allowlisteados, commits y estado local.',
    cta: 'Ver repos',
    accent: 'warning',
  },
  {
    href: '/usage',
    icon: '◌',
    title: 'Uso',
    description: 'Consumo Codex/Hermes agregado para entender ritmo y ventanas de trabajo.',
    cta: 'Ver uso',
    accent: 'sky',
  },
] as const

export default function HomePage() {
  return (
    <div className="home-page">
      <section className="home-hero" aria-labelledby="home-title">
        <div className="home-hero__mark" aria-hidden>
          <LayaMugiwaraMark size="md" decorative />
        </div>
        <div className="home-hero__body">
          <p className="home-hero__eyebrow">Inicio · Control plane privado</p>
          <h1 id="home-title" className="home-hero__title">Mugiwara Control Panel</h1>
          <p className="home-hero__subtitle">
            Entrada visual y navegable al sistema Mugiwara/Hermes. Desde aquí eliges rumbo sin duplicar métricas ni estados que ya viven en sus páginas propietarias.
          </p>
          <div className="home-hero__pills" aria-label="Principios de la portada">
            <span>Privado</span>
            <span>Read-first</span>
            <span>Sin dashboard duplicado</span>
          </div>
        </div>
      </section>

      <section className="home-route-grid" aria-label="Páginas principales">
        {homeRouteCards.map((card) => (
          <Link key={card.href} href={card.href} className="home-route-card" aria-label={`${card.cta}: ${card.title}`}>
            <SurfaceCard title={card.title} elevated accent={card.accent} eyebrow="Acceso">
              <div className="home-route-card__content">
                <span className="home-route-card__icon" aria-hidden>{card.icon}</span>
                <p>{card.description}</p>
                <span className="home-route-card__cta" style={{ color: appTheme.colors.brandSky500 }}>
                  {card.cta} →
                </span>
              </div>
            </SurfaceCard>
          </Link>
        ))}
      </section>
    </div>
  )
}

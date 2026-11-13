import Button from '../Button.jsx'
import Icon from '../Icon.jsx'
import LegacyIllustration from '../decor/LegacyIllustration.jsx'
import HeroVideo from '../decor/HeroVideo.jsx'

export default function Hero({ content }) {
  const { titleLines, description, cta, card } = content

  return (
    <section className="hero">
      <HeroVideo />
      <div className="container hero__inner">
        <div className="hero__copy">
          <h1 className="hero__title">
            {titleLines.map((line) => (
              <span key={line} className="hero__title-line">
                {line}{' '}
              </span>
            ))}
          </h1>
          <p className="hero__text">{description}</p>
          <div className="hero__actions">
            <Button to={cta.to} size="lg" icon="arrowRight">
              {cta.label}
            </Button>
          </div>
        </div>

        <div className="hero__side">
          <LegacyIllustration className="hero__art" />
          <aside className="card release-card" aria-labelledby="release-card-title">
            <h2 id="release-card-title" className="release-card__title">
              {card.title}
            </h2>
            <p className="release-card__text">{card.description}</p>
            <ul className="release-list">
              {card.items.map((item) => (
                <li key={item.title} className="release-list__item">
                  <span className="icon-tile">
                    <Icon name={item.icon} />
                  </span>
                  <div>
                    <h3 className="release-list__title">{item.title}</h3>
                    <p className="release-list__text">{item.text}</p>
                  </div>
                </li>
              ))}
            </ul>
          </aside>
        </div>
      </div>
    </section>
  )
}

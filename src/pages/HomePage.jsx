import Button from '../components/Button.jsx'
import Icon from '../components/Icon.jsx'
import Header from '../components/landing/Header.jsx'
import Footer from '../components/landing/Footer.jsx'
import PageBackdrop from '../components/decor/PageBackdrop.jsx'
import HeroVideo from '../components/decor/HeroVideo.jsx'
import HandoffPanel from '../components/home/HandoffPanel.jsx'
import AddFirstCarousel from '../components/home/AddFirstCarousel.jsx'
import { homeContent } from '../data/homeContent.js'
import { landingContent } from '../data/landingContent.js'
import { useLanguage } from '../i18n/LanguageContext.jsx'
import '../styles/landing.css'
import '../styles/marketing.css'
import '../styles/home.css'

export default function HomePage() {
  const { language } = useLanguage()
  const { ui, navLinks, footer } = landingContent[language]
  const { hero, highlights, handoff, addFirst } = homeContent[language]

  return (
    <div className="marketing-page">
      <PageBackdrop />
      <Header links={navLinks} ui={ui} />
      <main>
        <section className="home-hero">
          <HeroVideo />
          <div className="container">
            <div className="home-hero__inner">
              <div className="home-hero__copy">
                <span className="eyebrow">{hero.eyebrow}</span>
                <h1 className="home-hero__title">{hero.title}</h1>
                <p className="home-hero__text">{hero.description}</p>
                <p className="home-hero__note">{hero.note}</p>
                <div className="home-hero__actions">
                  <Button to={hero.primary.to} size="lg">
                    {hero.primary.label}
                  </Button>
                  <Button href={hero.secondary.href} variant="secondary" size="lg">
                    {hero.secondary.label}
                  </Button>
                </div>
              </div>
            </div>

            <ul className="home-highlights">
              {highlights.map((text) => (
                <li key={text} className="card home-highlights__item">
                  <Icon name="check" size={18} strokeWidth={2.2} className="home-highlights__icon" />
                  <span>{text}</span>
                </li>
              ))}
            </ul>
          </div>
        </section>

        <HandoffPanel content={handoff} />
        <AddFirstCarousel content={addFirst} />
      </main>
      <Footer content={footer} navLabel={ui.footerNavLabel} />
    </div>
  )
}

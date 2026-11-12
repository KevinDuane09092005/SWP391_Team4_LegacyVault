import Button from '../Button.jsx'
import SectionArt from '../decor/SectionArt.jsx'

export default function FinalCta({ content }) {
  const { title, description, primary, secondary } = content

  return (
    <section className="section section--cta" aria-labelledby="final-cta-title">
      <div className="container">
        <div className="card final-cta">
          <SectionArt scene="family" className="final-cta__art" />
          <h2 id="final-cta-title" className="final-cta__title">
            {title}
          </h2>
          <p className="final-cta__text">{description}</p>
          <div className="final-cta__actions">
            <Button to={primary.to} size="lg">
              {primary.label}
            </Button>
            <Button href={secondary.href} variant="secondary" size="lg">
              {secondary.label}
            </Button>
          </div>
        </div>
      </div>
    </section>
  )
}

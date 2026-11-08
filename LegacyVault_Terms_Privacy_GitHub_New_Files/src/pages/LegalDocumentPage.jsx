import { useEffect } from 'react'
import { Link } from 'react-router-dom'
import { ArrowLeft, ArrowUpRight, BookOpenText, FileText, LockKeyhole, Printer, ShieldCheck } from 'lucide-react'
import Brand from '../components/Brand.jsx'
import LanguageSwitcher from '../components/LanguageSwitcher.jsx'
import ThemeToggle from '../components/ThemeToggle.jsx'
import { useLanguage } from '../i18n/LanguageContext.jsx'
import { legalContent } from '../data/legalContent.js'
import '../styles/legal-pages.css'

export default function LegalDocumentPage({ kind }) {
  const { language } = useLanguage()
  const documentKind = kind === 'privacy' ? 'privacy' : 'terms'
  const { ui, ...documents } = legalContent[language]
  const content = documents[documentKind]
  const isTerms = documentKind === 'terms'

  useEffect(() => {
    const previous = document.title
    document.title = `${content.title} | LegacyVault`
    return () => { document.title = previous }
  }, [content.title])

  return (
    <div className="legal-page">
      <header className="legal-header">
        <div className="container legal-header__inner">
          <Brand to="/" />
          <div className="legal-header__tools">
            <span className="legal-header__language-label">{ui.language}</span>
            <LanguageSwitcher label={ui.language} />
            <ThemeToggle />
          </div>
        </div>
      </header>

      <main className="container legal-main" id="main-content">
        <div className="legal-breadcrumbs">
          <Link to="/" className="legal-home-link"><ArrowLeft size={16} aria-hidden="true" /> {ui.back}</Link>
          <span className="legal-breadcrumbs__separator">/</span>
          <span aria-current="page">{content.title}</span>
        </div>

        <div className="legal-hero">
          <div className="legal-hero__copy">
            <span className="legal-eyebrow"><ShieldCheck size={15} aria-hidden="true" /> {content.eyebrow}</span>
            <h1>{content.title}</h1>
            <p className="legal-subtitle">{content.subtitle}</p>
            <p className="legal-lead">{content.lead}</p>
            <div className="legal-metadata" aria-label={ui.version}>
              <span className="legal-pill legal-pill--draft">{ui.draft}</span>
              <span className="legal-pill">{ui.version}</span>
              <span className="legal-pill">{ui.date}</span>
            </div>
          </div>
          <div className="legal-hero__symbol" aria-hidden="true">
            {isTerms ? <FileText size={84} strokeWidth={1.15} /> : <LockKeyhole size={84} strokeWidth={1.15} />}
            <div className="legal-hero__symbol-caption">LEGACYVAULT</div>
          </div>
        </div>

        <div className="legal-highlight" role="note">
          <div className="legal-highlight__icon"><ShieldCheck size={22} aria-hidden="true" /></div>
          <div><strong>{content.highlightTitle}</strong><p>{content.highlight}</p></div>
        </div>

        <div className="legal-layout">
          <aside className="legal-aside" aria-label={ui.contents}>
            <div className="legal-aside__inner">
              <div className="legal-aside__heading"><BookOpenText size={17} aria-hidden="true" /> {ui.contents}</div>
              <nav aria-label={ui.contents}>
                <ol className="legal-toc">
                  {content.sections.map((section, index) => (
                    <li key={section.id}>
                      <a href={`#${section.id}`}><span>{String(index + 1).padStart(2, '0')}</span>{section.title}</a>
                    </li>
                  ))}
                </ol>
              </nav>
              <button type="button" className="legal-print" onClick={() => window.print()}>
                <Printer size={16} aria-hidden="true" /> {ui.print}
              </button>
            </div>
          </aside>

          <div className="legal-article">
            {content.sections.map((section, index) => (
              <section className="legal-section" id={section.id} key={section.id} aria-labelledby={`${section.id}-title`}>
                <div className="legal-section__number">{String(index + 1).padStart(2, '0')}</div>
                <div className="legal-section__body">
                  <h2 id={`${section.id}-title`}>{section.title}</h2>
                  {section.paragraphs?.map((paragraph, i) => <p key={i}>{paragraph}</p>)}
                  {section.bullets && <ul>{section.bullets.map((bullet, i) => <li key={i}>{bullet}</li>)}</ul>}
                </div>
              </section>
            ))}

            <div className="legal-closing">
              <strong>{ui.reading}</strong>
              <p>{ui.contactNote}</p>
            </div>

            <div className="legal-next">
              <div>
                <div className="legal-next__caption">{ui.related}</div>
                <Link to={isTerms ? '/privacy' : '/terms'} className="legal-next__link">
                  {isTerms ? ui.otherPrivacy : ui.otherTerms}
                  <ArrowUpRight size={17} aria-hidden="true" />
                </Link>
              </div>
              <button type="button" className="legal-next__print" onClick={() => window.print()}>
                <Printer size={16} aria-hidden="true" /> {ui.print}
              </button>
            </div>
          </div>
        </div>
      </main>
      <footer className="legal-footer"><div className="container"><span>© LegacyVault</span><span>{ui.footer}</span></div></footer>
    </div>
  )
}

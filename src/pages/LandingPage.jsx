import Header from '../components/landing/Header.jsx'
import Hero from '../components/landing/Hero.jsx'
import TrustSection from '../components/landing/TrustSection.jsx'
import HowItWorks from '../components/landing/HowItWorks.jsx'
import StorageGrid from '../components/landing/StorageGrid.jsx'
import PricingCard from '../components/landing/PricingCard.jsx'
import FinalCta from '../components/landing/FinalCta.jsx'
import Footer from '../components/landing/Footer.jsx'
import PageBackdrop from '../components/decor/PageBackdrop.jsx'
import { landingContent } from '../data/landingContent.js'
import { useLanguage } from '../i18n/LanguageContext.jsx'
import '../styles/landing.css'

export default function LandingPage() {
  const { language } = useLanguage()
  const { ui, navLinks, hero, trust, howItWorks, storage, pricing, finalCta, footer } =
    landingContent[language]

  return (
    <>
      <PageBackdrop />
      <Header links={navLinks} ui={ui} />
      <main>
        <Hero content={hero} />
        <TrustSection content={trust} />
        <HowItWorks content={howItWorks} stepLabel={ui.stepLabel} />
        <StorageGrid content={storage} />
        <PricingCard content={pricing} />
        <FinalCta content={finalCta} />
      </main>
      <Footer content={footer} navLabel={ui.footerNavLabel} />
    </>
  )
}

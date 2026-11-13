import SectionArt from '../decor/SectionArt.jsx'

// Header at the top of each main Vault Owner page: one tinted card with the page title,
// a short description, the page's main actions and a small illustration on the right.
// It replaces the separate illustrated banner + plain title the pages used to stack.
//
// scene: overview | assets | contacts | assignments | dms | billing (see SectionArt)
// hue:   teal | amber | indigo | rose
export default function PageHeader({
  scene,
  hue = 'teal',
  eyebrow,
  status,
  title,
  description,
  actions,
  children,
}) {
  return (
    <header className={`page-hero page-hero--${hue}`}>
      <div className="page-hero__copy">
        {(eyebrow || status) && (
          <div className="page-hero__top">
            {eyebrow && <span className="page-hero__eyebrow">{eyebrow}</span>}
            {status}
          </div>
        )}
        <h1 className="page-hero__title">{title}</h1>
        {description && <p className="page-hero__text">{description}</p>}
        {children}
        {actions && <div className="page-hero__actions">{actions}</div>}
      </div>
      {scene && <SectionArt scene={scene} className="page-hero__art" />}
    </header>
  )
}

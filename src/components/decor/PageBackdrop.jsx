import '../../styles/decor.css'

// Full-page animated background for the public pages: drifting colour lights, a faint grid
// and small symbols (key, document, heart, shield, star) floating upwards. Decorative only.
// Positions are fixed numbers so the page looks the same on every load.
const FLOATERS = [
  { x: 6, size: 22, delay: 0, dur: 26, icon: 'key', hue: 'amber' },
  { x: 14, size: 14, delay: 9, dur: 22, icon: 'star', hue: 'indigo' },
  { x: 23, size: 18, delay: 4, dur: 30, icon: 'heart', hue: 'rose' },
  { x: 33, size: 12, delay: 14, dur: 24, icon: 'star', hue: 'amber' },
  { x: 42, size: 20, delay: 7, dur: 28, icon: 'doc', hue: 'indigo' },
  { x: 51, size: 14, delay: 18, dur: 25, icon: 'shield', hue: 'teal' },
  { x: 60, size: 24, delay: 2, dur: 32, icon: 'shield', hue: 'teal' },
  { x: 69, size: 12, delay: 11, dur: 21, icon: 'star', hue: 'rose' },
  { x: 77, size: 18, delay: 6, dur: 27, icon: 'key', hue: 'amber' },
  { x: 85, size: 16, delay: 16, dur: 23, icon: 'heart', hue: 'rose' },
  { x: 92, size: 20, delay: 3, dur: 29, icon: 'doc', hue: 'indigo' },
  { x: 97, size: 12, delay: 20, dur: 24, icon: 'star', hue: 'teal' },
]

const ICONS = {
  key: <><circle cx="8" cy="12" r="4.5" /><path d="M12.5 12h9m-3 0v3.5m-3-3.5v2.5" /></>,
  doc: <><rect x="6" y="3" width="12" height="18" rx="2.5" /><path d="M9 9h6M9 13h6M9 17h4" /></>,
  heart: <path d="M12 20c-5.5-3.6-8-6.6-8-9.6a4 4 0 0 1 8-1.6 4 4 0 0 1 8 1.6c0 3-2.5 6-8 9.6z" />,
  shield: <><path d="M12 3l7.5 2.7v5.3c0 4.8-3.3 7.9-7.5 9.4-4.2-1.5-7.5-4.6-7.5-9.4V5.7z" /><path d="M9 12l2 2 4-4" /></>,
  star: <path d="M12 3l2 6.5h6.5l-5.3 3.9 2 6.6L12 16l-5.2 4 2-6.6L3.5 9.5H10z" />,
}

export default function PageBackdrop() {
  return (
    <div className="page-backdrop" aria-hidden="true">
      <span className="page-backdrop__light page-backdrop__light--1" />
      <span className="page-backdrop__light page-backdrop__light--2" />
      <span className="page-backdrop__light page-backdrop__light--3" />
      <span className="page-backdrop__grid" />
      {FLOATERS.map((f) => (
        <svg
          key={`${f.x}-${f.icon}`}
          className={`page-backdrop__floater page-backdrop__floater--${f.hue}`}
          viewBox="0 0 24 24"
          style={{ left: `${f.x}%`, width: f.size, height: f.size, animationDelay: `-${f.delay}s`, animationDuration: `${f.dur}s` }}
        >
          {ICONS[f.icon]}
        </svg>
      ))}
    </div>
  )
}

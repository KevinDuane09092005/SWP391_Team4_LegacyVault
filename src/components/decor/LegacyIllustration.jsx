import { useId } from 'react'
import '../../styles/decor.css'

// Decorative, animated SVG scene: a vault holding a key, a document and a heart, with a
// dashed line carrying them to the person who receives them. Purely visual (aria-hidden).
// `tone="light"` is for dark/colour panels (e.g. the sign-in panel).
export default function LegacyIllustration({ className = '', tone = 'default' }) {
  const uid = useId().replace(/:/g, '')
  const id = (name) => `${name}-${uid}`

  return (
    <svg
      className={`lvart lvart--${tone} ${className}`}
      viewBox="0 0 480 400"
      aria-hidden="true"
      focusable="false"
    >
      <defs>
        <radialGradient id={id('glow')} cx="50%" cy="50%" r="50%">
          <stop offset="0%" className="lvart-stop--glow" />
          <stop offset="100%" className="lvart-stop--glow" stopOpacity="0" />
        </radialGradient>
        <linearGradient id={id('vault')} x1="0" y1="0" x2="1" y2="1">
          <stop offset="0%" className="lvart-stop--vault-a" />
          <stop offset="100%" className="lvart-stop--vault-b" />
        </linearGradient>
        <linearGradient id={id('door')} x1="0" y1="0" x2="1" y2="1">
          <stop offset="0%" className="lvart-stop--door-a" />
          <stop offset="100%" className="lvart-stop--door-b" />
        </linearGradient>
      </defs>

      {/* Soft light and orbit */}
      <circle cx="240" cy="200" r="190" fill={`url(#${id('glow')})`} className="lvart-breathe" />
      <ellipse cx="240" cy="205" rx="200" ry="132" className="lvart-orbit-line lvart-spin-slow" />
      <ellipse cx="240" cy="205" rx="150" ry="98" className="lvart-orbit-line lvart-orbit-line--inner" />

      {/* Path from the vault to the person who receives it */}
      <path d="M300 250 C 360 300, 400 300, 418 262" className="lvart-path" />

      {/* Vault */}
      <g className="lvart-float">
        <ellipse cx="240" cy="318" rx="92" ry="12" className="lvart-shadow" />
        <rect x="160" y="120" width="160" height="180" rx="26" fill={`url(#${id('vault')})`} />
        <rect x="160" y="120" width="160" height="180" rx="26" className="lvart-rim" />
        <rect x="176" y="292" width="22" height="16" rx="5" className="lvart-foot" />
        <rect x="282" y="292" width="22" height="16" rx="5" className="lvart-foot" />
        <circle cx="240" cy="208" r="58" fill={`url(#${id('door')})`} />
        <circle cx="240" cy="208" r="58" className="lvart-rim" />
        <g className="lvart-dial">
          <circle cx="240" cy="208" r="34" className="lvart-dial-face" />
          {[0, 45, 90, 135, 180, 225, 270, 315].map((angle) => (
            <rect key={angle} x="238.5" y="176" width="3" height="9" rx="1.5" className="lvart-tick"
              transform={`rotate(${angle} 240 208)`} />
          ))}
          <path d="M240 186 v22 l14 10" className="lvart-hand" />
        </g>
        {/* Shield emblem */}
        <path d="M240 134 l20 7 v14 c0 13-9 21-20 25 c-11-4-20-12-20-25 v-14 z" className="lvart-shield" />
        <path d="M232 156 l6 6 l11-12" className="lvart-check" />
      </g>

      {/* Key */}
      <g className="lvart-bob lvart-bob--1">
        <circle cx="96" cy="128" r="30" className="lvart-chip lvart-chip--amber" />
        <circle cx="87" cy="128" r="8" className="lvart-glyph" />
        <path d="M95 128 h18 m-6 0 v7 m-6 -7 v5" className="lvart-glyph-line" />
      </g>

      {/* Document */}
      <g className="lvart-bob lvart-bob--2">
        <circle cx="378" cy="104" r="30" className="lvart-chip lvart-chip--indigo" />
        <rect x="366" y="90" width="24" height="29" rx="4" className="lvart-glyph" />
        <path d="M371 99 h14 M371 105 h14 M371 111 h9" className="lvart-glyph-line lvart-glyph-line--ink" />
      </g>

      {/* Heart */}
      <g className="lvart-bob lvart-bob--3">
        <circle cx="74" cy="268" r="26" className="lvart-chip lvart-chip--rose" />
        <path d="M74 280 c-11-7-16-13-16-19 a8 8 0 0 1 16-3 a8 8 0 0 1 16 3 c0 6-5 12-16 19z" className="lvart-glyph" />
      </g>

      {/* The person who receives it */}
      <g className="lvart-bob lvart-bob--4">
        <circle cx="420" cy="240" r="30" className="lvart-chip lvart-chip--teal" />
        <circle cx="420" cy="232" r="8" className="lvart-glyph" />
        <path d="M406 254 c2-9 8-13 14-13 s12 4 14 13" className="lvart-glyph" />
      </g>

      {/* Sparkles */}
      {[[140, 70, 1], [330, 52, 2], [438, 170, 3], [52, 190, 4], [300, 345, 5], [176, 352, 6]].map(([x, y, n]) => (
        <path key={n} d={`M${x} ${y - 7} L${x + 2} ${y - 2} L${x + 7} ${y} L${x + 2} ${y + 2} L${x} ${y + 7} L${x - 2} ${y + 2} L${x - 7} ${y} L${x - 2} ${y - 2} Z`}
          className={`lvart-spark lvart-spark--${n}`} />
      ))}
    </svg>
  )
}

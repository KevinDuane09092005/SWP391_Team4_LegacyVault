import '../../styles/decor.css'

// Small animated SVG scenes, one per area of the app (all original drawings, aria-hidden).
// Colours come from the --hue-* tokens in decor.css, so they follow the light/dark theme.
// scene: overview | assets | contacts | assignments | dms | billing | security | family

function Sparkles({ points }) {
  return points.map(([x, y], n) => (
    <path
      key={`${x}-${y}`}
      d={`M${x} ${y - 5} L${x + 1.5} ${y - 1.5} L${x + 5} ${y} L${x + 1.5} ${y + 1.5} L${x} ${y + 5} L${x - 1.5} ${y + 1.5} L${x - 5} ${y} L${x - 1.5} ${y - 1.5} Z`}
      className={`lvart-spark lvart-spark--${(n % 6) + 1}`}
    />
  ))
}

function Person({ x, y, r = 16, hue, className = '' }) {
  return (
    <g className={className}>
      <circle cx={x} cy={y} r={r} className={`lvart-chip lvart-chip--${hue}`} />
      <circle cx={x} cy={y - r * 0.28} r={r * 0.3} className="lvart-glyph" />
      <path d={`M${x - r * 0.52} ${y + r * 0.55} c${r * 0.1}-${r * 0.5} ${r * 0.32}-${r * 0.62} ${r * 0.52}-${r * 0.62} s${r * 0.42} ${r * 0.12} ${r * 0.52} ${r * 0.62}`}
        className="lvart-glyph" />
    </g>
  )
}

const scenes = {
  overview: () => (
    <>
      <rect x="40" y="26" width="180" height="120" rx="14" className="sart-panel" />
      <rect x="40" y="26" width="180" height="22" rx="14" className="sart-panel-head" />
      <circle cx="56" cy="37" r="3.5" className="sart-dot sart-dot--rose" />
      <circle cx="67" cy="37" r="3.5" className="sart-dot sart-dot--amber" />
      <circle cx="78" cy="37" r="3.5" className="sart-dot sart-dot--teal" />
      {[[62, 46], [84, 64], [106, 34], [128, 56]].map(([x, h], i) => (
        <rect key={x} x={x} y={130 - h} width="14" height={h} rx="4"
          className={`sart-bar sart-bar--${i + 1}`} />
      ))}
      <circle cx="185" cy="96" r="22" className="sart-ring-bg" />
      <circle cx="185" cy="96" r="22" className="sart-ring" />
      <path d="M185 86 l8 3 v6 c0 5-3.5 8-8 10 c-4.5-2-8-5-8-10 v-6 z" className="lvart-shield" />
      <Sparkles points={[[30, 20], [232, 30], [228, 150]]} />
    </>
  ),

  assets: () => (
    <>
      <g className="lvart-bob lvart-bob--2">
        <rect x="118" y="34" width="72" height="92" rx="10" className="lvart-chip--indigo sart-tilt-r" />
        <path d="M132 58 h44 M132 70 h44 M132 82 h30" className="sart-ink-line" />
      </g>
      <g className="lvart-bob">
        <rect x="56" y="58" width="112" height="70" rx="12" className="lvart-chip--teal sart-tilt-l" />
        <rect x="70" y="74" width="20" height="15" rx="3" className="sart-gold" />
        <path d="M70 108 h50 M128 108 h22" className="sart-ink-line" />
      </g>
      <g className="lvart-bob lvart-bob--3">
        <circle cx="200" cy="114" r="20" className="lvart-chip lvart-chip--amber sart-coin" />
        <path d="M195 106 h8 a4 4 0 0 1 0 8 h-8 h9 a4 4 0 0 1 0 8 h-9 v-16 M199 103 v22" className="sart-ink-line sart-ink-line--thin" />
      </g>
      <g className="lvart-float">
        <rect x="104" y="112" width="30" height="24" rx="6" className="lvart-shield" />
        <path d="M110 112 v-7 a9 9 0 0 1 18 0 v7" className="sart-lock" />
        <circle cx="119" cy="123" r="3" className="lvart-glyph" />
      </g>
      <Sparkles points={[[44, 40], [214, 40], [40, 140]]} />
    </>
  ),

  contacts: () => (
    <>
      {[[60, 52], [200, 52], [130, 142]].map(([x, y], i) => (
        <path key={x} d={`M130 88 L${x} ${y}`} className={`sart-link sart-link--${i + 1}`} />
      ))}
      <circle cx="130" cy="88" r="30" className="sart-ping" />
      <Person x={130} y={88} r={24} hue="teal" className="lvart-float" />
      <Person x={60} y={52} hue="amber" className="lvart-bob" />
      <Person x={200} y={52} hue="indigo" className="lvart-bob lvart-bob--2" />
      <Person x={130} y={142} hue="rose" className="lvart-bob lvart-bob--3" />
      <Sparkles points={[[30, 100], [232, 110], [98, 22]]} />
    </>
  ),

  assignments: () => (
    <>
      <path d="M92 86 C 130 86, 140 44, 186 44" className="lvart-path" />
      <path d="M92 86 C 130 86, 140 128, 186 128" className="lvart-path sart-path--2" />
      <g className="lvart-float">
        <rect x="34" y="56" width="60" height="60" rx="14" className="lvart-chip--teal" />
        <rect x="48" y="74" width="32" height="26" rx="5" className="lvart-glyph" />
        <path d="M48 82 h32" className="sart-ink-line sart-ink-line--teal" />
      </g>
      <Person x={204} y={44} r={18} hue="indigo" className="lvart-bob" />
      <Person x={204} y={128} r={18} hue="rose" className="lvart-bob lvart-bob--3" />
      <g className="lvart-bob lvart-bob--2">
        <rect x="132" y="74" width="34" height="24" rx="12" className="lvart-chip--amber" />
        <text x="149" y="91" textAnchor="middle" className="sart-label">%</text>
      </g>
      <Sparkles points={[[30, 30], [236, 86], [120, 150]]} />
    </>
  ),

  dms: () => (
    <>
      <rect x="22" y="40" width="216" height="90" rx="16" className="sart-panel" />
      <path d="M34 92 h46 l10 -24 l14 46 l12 -40 l9 18 h34 l8 -14 l8 14 h48" className="sart-ekg" />
      <g className="lvart-bob lvart-bob--2">
        <circle cx="206" cy="38" r="22" className="lvart-chip lvart-chip--amber" />
        <path d="M197 26 h18 M197 50 h18 M199 26 c0 8 14 8 14 12 s-14 4-14 12 M213 26 c0 8 -14 8 -14 12 s14 4 14 12"
          className="sart-ink-line sart-ink-line--thin" />
        <path d="M203 44 h6 l-3 -4 z" className="lvart-glyph sart-sand" />
      </g>
      <g className="lvart-float">
        <circle cx="52" cy="40" r="20" className="lvart-chip lvart-chip--rose" />
        <path d="M52 50 c-9-6-13-10-13-15 a6.5 6.5 0 0 1 13-2.5 a6.5 6.5 0 0 1 13 2.5 c0 5-4 9-13 15z"
          className="lvart-glyph sart-beat" />
      </g>
      <Sparkles points={[[120, 22], [240, 140], [26, 146]]} />
    </>
  ),

  billing: () => (
    <>
      <g className="lvart-float">
        <rect x="46" y="44" width="136" height="86" rx="14" className="lvart-chip--indigo sart-tilt-l" />
        <rect x="46" y="62" width="136" height="16" className="sart-stripe sart-tilt-l" />
        <rect x="62" y="92" width="22" height="16" rx="4" className="sart-gold" />
        <path d="M62 118 h30 M100 118 h30" className="sart-ink-line" />
      </g>
      {[[192, 116, 1], [210, 96, 2], [184, 84, 3]].map(([x, y, n]) => (
        <g key={n} className={`lvart-bob lvart-bob--${n + 1}`}>
          <circle cx={x} cy={y} r="15" className="lvart-chip lvart-chip--amber sart-coin" />
          <circle cx={x} cy={y} r="8" className="sart-coin-inner" />
        </g>
      ))}
      <g className="lvart-bob">
        <circle cx="60" cy="34" r="16" className="lvart-chip lvart-chip--teal" />
        <path d="M53 34 l5 5 l9 -10" className="lvart-check" />
      </g>
      <Sparkles points={[[230, 40], [30, 120], [140, 24]]} />
    </>
  ),

  security: () => (
    <>
      <circle cx="130" cy="90" r="40" className="sart-ping" />
      <circle cx="130" cy="90" r="40" className="sart-ping sart-ping--late" />
      <g className="lvart-float">
        <path d="M130 30 l50 18 v34 c0 32-22 52-50 62 c-28-10-50-30-50-62 v-34 z" className="sart-shield-big" />
        <path d="M130 44 l36 13 v25 c0 23-16 38-36 45 c-20-7-36-22-36-45 v-25 z" className="sart-shield-inner" />
        <rect x="114" y="80" width="32" height="26" rx="6" className="lvart-glyph" />
        <path d="M120 80 v-8 a10 10 0 0 1 20 0 v8" className="sart-lock sart-lock--white" />
        <circle cx="130" cy="92" r="3.5" className="sart-keyhole" />
        <rect x="88" y="60" width="84" height="3" rx="1.5" className="sart-scan" />
      </g>
      <Person x={40} y={60} r={14} hue="amber" className="lvart-bob" />
      <Person x={222} y={120} r={14} hue="rose" className="lvart-bob lvart-bob--3" />
      <Sparkles points={[[216, 40], [40, 132], [178, 156]]} />
    </>
  ),

  family: () => (
    <>
      <path d="M40 150 C 90 132, 170 132, 220 150" className="sart-ground" />
      <Person x={92} y={108} r={26} hue="teal" className="lvart-bob" />
      <Person x={168} y={108} r={26} hue="indigo" className="lvart-bob lvart-bob--2" />
      <Person x={130} y={124} r={18} hue="amber" className="lvart-bob lvart-bob--3" />
      <g className="sart-heart-rise">
        <path d="M130 66 c-13-8-19-15-19-22 a9.5 9.5 0 0 1 19-3.5 a9.5 9.5 0 0 1 19 3.5 c0 7-6 14-19 22z"
          className="sart-heart" />
      </g>
      <Sparkles points={[[96, 40], [166, 34], [56, 70], [206, 70]]} />
    </>
  ),
}

export default function SectionArt({ scene, className = '' }) {
  const Scene = scenes[scene]
  if (!Scene) return null
  return (
    <svg className={`lvart sart sart--${scene} ${className}`} viewBox="0 0 260 170" aria-hidden="true" focusable="false">
      <Scene />
    </svg>
  )
}

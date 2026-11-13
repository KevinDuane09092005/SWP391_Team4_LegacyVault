import { useEffect, useRef, useState } from 'react'
import { useLanguage } from '../../i18n/LanguageContext.jsx'
import '../../styles/hero-video.css'

// Background video for the hero of the public pages ("/" and "/home").
// The video is a ~27 s montage of five Mixkit clips (free licence,
// https://mixkit.co/license/#videoFree), joined with cross-fades:
//   21449 old man with a photo album → 21674 grandparents reading a family letter →
//   35979 holding a grandmother's hands → 36147 grandparents and grandchildren with a tablet →
//   6472 three generations walking at sunset.
// Files live in public/videos (720p for desktop, 360p for phones, plus a poster frame).
// Decorative only: muted, no controls except a pause button, and it never starts
// for people who asked the system for reduced motion (they see the still poster).

const SOURCES = {
  small: '/videos/legacy-hero-360.mp4',
  large: '/videos/legacy-hero-720.mp4',
}
const POSTER = '/videos/legacy-hero-poster.jpg'

const LABELS = {
  en: { pause: 'Pause background video', play: 'Play background video' },
  vi: { pause: 'Tạm dừng video nền', play: 'Phát video nền' },
}

const prefersReducedMotion = () =>
  typeof window !== 'undefined' &&
  window.matchMedia?.('(prefers-reduced-motion: reduce)').matches

// Phones get the lighter 360p file (about 1.2 MB instead of 6 MB).
const pickSource = () =>
  typeof window !== 'undefined' && window.innerWidth <= 720 ? SOURCES.small : SOURCES.large

// variant 'hero' (default): fills the hero section it is placed in.
// variant 'page': fixed behind the whole viewport (used by the sign-in / sign-up frame).
export default function HeroVideo({ variant = 'hero' }) {
  const { language } = useLanguage()
  const labels = LABELS[language] ?? LABELS.en
  const videoRef = useRef(null)
  const [src] = useState(pickSource)
  const [playing, setPlaying] = useState(() => !prefersReducedMotion())

  useEffect(() => {
    const video = videoRef.current
    if (!video) return
    if (playing) {
      // Autoplay can still be refused (e.g. battery saver); then the poster stays.
      video.play().catch(() => setPlaying(false))
    } else {
      video.pause()
    }
  }, [playing])

  return (
    <div className={`hero-video hero-video--${variant}`}>
      <div className="hero-video__frame" aria-hidden="true">
        <video
          ref={videoRef}
          className="hero-video__media"
          src={src}
          poster={POSTER}
          muted
          loop
          playsInline
          preload="metadata"
          tabIndex={-1}
          disablePictureInPicture
        />
        <span className="hero-video__shade" />
      </div>
      <button
        type="button"
        className="hero-video__toggle"
        onClick={() => setPlaying((value) => !value)}
        aria-label={playing ? labels.pause : labels.play}
        title={playing ? labels.pause : labels.play}
      >
        <svg viewBox="0 0 24 24" width="16" height="16" aria-hidden="true">
          {playing ? (
            <path d="M8 5v14M16 5v14" />
          ) : (
            <path d="M8 5.5v13l10.5-6.5z" />
          )}
        </svg>
      </button>
    </div>
  )
}

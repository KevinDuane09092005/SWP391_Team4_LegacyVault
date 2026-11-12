import { createContext, useContext, useEffect, useState } from 'react'

// Light / dark theme. The page shows `theme`; colours for each theme are the CSS
// variables in global.css (`:root` and `:root[data-theme='dark']`).
// Until the user picks one, the theme follows the system setting.
// index.html sets data-theme before React loads so the page never flashes.

const STORAGE_KEY = 'legacyvault.theme'
const darkQuery = '(prefers-color-scheme: dark)'

function readSavedChoice() {
  try {
    const saved = window.localStorage.getItem(STORAGE_KEY)
    return saved === 'light' || saved === 'dark' ? saved : null
  } catch {
    return null
  }
}

const ThemeContext = createContext(null)

export function ThemeProvider({ children }) {
  const [choice, setChoice] = useState(readSavedChoice)
  const [systemDark, setSystemDark] = useState(() => window.matchMedia(darkQuery).matches)
  const theme = choice ?? (systemDark ? 'dark' : 'light')

  // Follow the system setting while the user has not picked a theme.
  useEffect(() => {
    const media = window.matchMedia(darkQuery)
    const onChange = (event) => setSystemDark(event.matches)
    media.addEventListener('change', onChange)
    return () => media.removeEventListener('change', onChange)
  }, [])

  useEffect(() => {
    document.documentElement.dataset.theme = theme
  }, [theme])

  const toggleTheme = () => {
    const next = theme === 'dark' ? 'light' : 'dark'
    const apply = () => {
      // Set the attribute right away so the browser can cross-fade old and new colours.
      document.documentElement.dataset.theme = next
      setChoice(next)
    }
    const reduceMotion = window.matchMedia?.('(prefers-reduced-motion: reduce)').matches
    if (document.startViewTransition && !reduceMotion) document.startViewTransition(apply)
    else apply()
    try {
      window.localStorage.setItem(STORAGE_KEY, next)
    } catch {
      // Not saving the choice is fine; the page still switches.
    }
  }

  return <ThemeContext.Provider value={{ theme, toggleTheme }}>{children}</ThemeContext.Provider>
}

// eslint-disable-next-line react-refresh/only-export-components
export function useTheme() {
  const context = useContext(ThemeContext)
  if (!context) throw new Error('useTheme must be used inside <ThemeProvider>')
  return context
}

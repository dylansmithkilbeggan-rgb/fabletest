import { createContext, useContext, useEffect, useMemo, useState } from 'react'

const STORAGE_KEY = 'faithfull-theme'

// localStorage may be unavailable in sandboxed environments; fall back to
// in-memory state so the toggle still works for the session.
function readStoredTheme() {
  try {
    const v = window.localStorage.getItem(STORAGE_KEY)
    return v === 'dark' || v === 'light' ? v : null
  } catch {
    return null
  }
}

function storeTheme(theme) {
  try {
    window.localStorage.setItem(STORAGE_KEY, theme)
  } catch {
    // ignore — theme just won't persist across reloads
  }
}

const ThemeContext = createContext(null)

export function ThemeProvider({ children }) {
  const [theme, setTheme] = useState(
    () =>
      readStoredTheme() ??
      (window.matchMedia?.('(prefers-color-scheme: dark)').matches ? 'dark' : 'light'),
  )

  useEffect(() => {
    document.documentElement.dataset.theme = theme
    storeTheme(theme)
  }, [theme])

  const value = useMemo(
    () => ({
      theme,
      toggleTheme: () => setTheme((t) => (t === 'dark' ? 'light' : 'dark')),
    }),
    [theme],
  )

  return <ThemeContext.Provider value={value}>{children}</ThemeContext.Provider>
}

export function useTheme() {
  const ctx = useContext(ThemeContext)
  if (!ctx) throw new Error('useTheme must be used inside ThemeProvider')
  return ctx
}

export type Theme = 'light' | 'dark'

export const DARK_MEDIA_QUERY = '(prefers-color-scheme: dark)'

// The inline script in index.html reads this same key to apply the theme before the first paint.
const THEME_STORAGE_KEY = 'futbol-stats-theme'

/** The slice of `document.documentElement` that applying a theme touches. */
export interface ThemeRoot {
  classList: { toggle(token: string, force: boolean): unknown }
  style: { colorScheme: string }
}

/** The saved choice, or `null` when there is none (or it is not a valid theme). */
export function parseStoredTheme(value: string | null): Theme | null {
  return value === 'light' || value === 'dark' ? value : null
}

/** An explicit choice always wins; the system preference only decides while nothing was chosen. */
export function resolveInitialTheme(stored: Theme | null, systemPrefersDark: boolean): Theme {
  if (stored) {
    return stored
  }
  return systemPrefersDark ? 'dark' : 'light'
}

export function applyTheme(theme: Theme, root: ThemeRoot = document.documentElement): void {
  root.classList.toggle('dark', theme === 'dark')
  // Lets the browser draw native widgets (scrollbars, form controls) in the matching scheme.
  root.style.colorScheme = theme
}

export function readStoredTheme(): Theme | null {
  try {
    return parseStoredTheme(localStorage.getItem(THEME_STORAGE_KEY))
  } catch (error) {
    // Storage can be blocked (private mode, strict privacy settings); the system preference is the fallback.
    console.warn('Could not read the saved theme', error)
    return null
  }
}

export function storeTheme(theme: Theme): void {
  try {
    localStorage.setItem(THEME_STORAGE_KEY, theme)
  } catch (error) {
    // The choice still applies to this session; it just will not survive a reload.
    console.warn('Could not save the theme', error)
  }
}

export function getInitialTheme(): Theme {
  return resolveInitialTheme(readStoredTheme(), window.matchMedia(DARK_MEDIA_QUERY).matches)
}

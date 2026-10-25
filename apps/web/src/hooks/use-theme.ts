import { useEffect, useState } from 'react'
import { applyTheme, getInitialTheme, storeTheme, type Theme } from '@/lib/theme'

export function useTheme() {
  const [theme, setTheme] = useState<Theme>(getInitialTheme)

  useEffect(() => {
    applyTheme(theme)
  }, [theme])

  // Only an explicit choice is saved, so until then the app keeps following the system on each visit.
  function changeTheme(next: Theme) {
    storeTheme(next)
    setTheme(next)
  }

  return { theme, changeTheme }
}

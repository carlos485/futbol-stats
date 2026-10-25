import { describe, expect, it, vi } from 'vitest'
import { applyTheme, parseStoredTheme, resolveInitialTheme, type ThemeRoot } from './theme'

function createRoot() {
  const toggle = vi.fn()
  const root: ThemeRoot = { classList: { toggle }, style: { colorScheme: '' } }
  return { root, toggle }
}

describe('parseStoredTheme', () => {
  it.each(['light', 'dark'] as const)('should_return_%s_when_it_is_the_stored_value', (value) => {
    expect(parseStoredTheme(value)).toBe(value)
  })

  it.each([null, '', 'system', 'blue', 'DARK'])('should_report_no_choice_when_the_stored_value_is_%j', (value) => {
    expect(parseStoredTheme(value)).toBeNull()
  })
})

describe('resolveInitialTheme', () => {
  it.each([
    [null, true, 'dark'],
    [null, false, 'light'],
    ['light', true, 'light'],
    ['dark', false, 'dark'],
  ] as const)('should_resolve_stored_%s_with_system_dark_%s_to_%s', (stored, systemPrefersDark, expected) => {
    expect(resolveInitialTheme(stored, systemPrefersDark)).toBe(expected)
  })
})

describe('applyTheme', () => {
  it('should_add_the_dark_class_and_color_scheme_when_the_theme_is_dark', () => {
    const { root, toggle } = createRoot()

    applyTheme('dark', root)

    expect(toggle).toHaveBeenCalledWith('dark', true)
    expect(root.style.colorScheme).toBe('dark')
  })

  it('should_remove_the_dark_class_when_the_theme_is_light', () => {
    const { root, toggle } = createRoot()

    applyTheme('light', root)

    expect(toggle).toHaveBeenCalledWith('dark', false)
    expect(root.style.colorScheme).toBe('light')
  })
})

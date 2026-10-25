import { MoonIcon, SunIcon } from 'lucide-react'
import type { ComponentType } from 'react'
import { Button } from '@/components/ui/button'
import type { Theme } from '@/lib/theme'

interface ThemeOption {
  value: Theme
  label: string
  Icon: ComponentType
}

const THEME_OPTIONS: ThemeOption[] = [
  { value: 'light', label: 'Claro', Icon: SunIcon },
  { value: 'dark', label: 'Oscuro', Icon: MoonIcon },
]

interface ThemeToggleProps {
  theme: Theme
  onChange: (theme: Theme) => void
}

export function ThemeToggle({ theme, onChange }: ThemeToggleProps) {
  return (
    <div role="radiogroup" aria-label="Tema de color" className="flex items-center gap-0.5 rounded-lg border bg-muted p-0.5">
      {THEME_OPTIONS.map(({ value, label, Icon }) => {
        const isSelected = theme === value
        return (
          <Button
            key={value}
            type="button"
            role="radio"
            aria-checked={isSelected}
            variant={isSelected ? 'default' : 'ghost'}
            size="sm"
            className={isSelected ? 'shadow-sm' : 'text-muted-foreground'}
            onClick={() => onChange(value)}
          >
            <Icon />
            {label}
          </Button>
        )
      })}
    </div>
  )
}

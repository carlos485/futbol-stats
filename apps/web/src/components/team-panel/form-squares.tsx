import type { MatchResult } from '@futbol/core'
import { CheckIcon, MinusIcon, XIcon } from 'lucide-react'
import type { ComponentType } from 'react'
import { FORM_LENGTH, type FormSquare } from '@/lib/form'

const RESULT_STYLES: Record<MatchResult, { className: string; Icon: ComponentType }> = {
  W: { className: 'bg-emerald-600', Icon: CheckIcon },
  D: { className: 'bg-zinc-500', Icon: MinusIcon },
  L: { className: 'bg-red-600', Icon: XIcon },
}

interface FormSquaresProps {
  squares: FormSquare[]
}

export function FormSquares({ squares }: FormSquaresProps) {
  const missing = FORM_LENGTH - squares.length
  return (
    <div className="flex items-center justify-center gap-1.5">
      {Array.from({ length: missing }, (_, index) => (
        <span key={`missing-${index}`} aria-hidden className="size-8 rounded-md border border-dashed" />
      ))}
      {squares.map((square) => {
        const { className, Icon } = RESULT_STYLES[square.result]
        return (
          <span
            key={square.fixtureId}
            role="img"
            aria-label={square.description}
            title={square.description}
            className={`flex size-8 items-center justify-center rounded-md text-white ${className}`}
          >
            <Icon />
          </span>
        )
      })}
    </div>
  )
}

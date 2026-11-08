import type { Fixture } from '@futbol/core'
import type { ReactNode } from 'react'

interface FixtureRowProps {
  fixture: Fixture
  selected: boolean
  onSelect: (fixture: Fixture) => void
  /** Right-hand side of the row: kickoff time, status, competition... */
  detail: ReactNode
}

/** A match as two team lines with their goals, selectable. Goals are hidden until the match has a score. */
export function FixtureRow({ fixture, selected, onSelect, detail }: FixtureRowProps) {
  const { home, away } = fixture.teams
  return (
    <button
      type="button"
      onClick={() => onSelect(fixture)}
      aria-pressed={selected}
      className="flex w-full items-center gap-3 rounded-lg border p-3 text-left transition-colors hover:bg-muted aria-pressed:border-primary aria-pressed:bg-muted"
    >
      <div className="flex min-w-0 flex-1 flex-col gap-1.5">
        <TeamLine name={home.name} logo={home.logo} goals={fixture.goals.home} />
        <TeamLine name={away.name} logo={away.logo} goals={fixture.goals.away} />
      </div>
      <div className="shrink-0 text-right text-xs text-muted-foreground">{detail}</div>
    </button>
  )
}

function TeamLine({ name, logo, goals }: { name: string; logo: string; goals: number | null }) {
  return (
    <div className="flex items-center gap-2">
      <img src={logo} alt="" className="size-5 shrink-0 object-contain" />
      <span className="truncate text-sm font-medium">{name}</span>
      {goals === null ? null : <span className="ml-auto pl-2 text-sm font-semibold tabular-nums">{goals}</span>}
    </div>
  )
}

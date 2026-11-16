import type { Fixture, LineupPlayer, TeamLineup } from '@futbol/core'
import { ErrorMessage } from '@/components/error-message'
import { Skeleton } from '@/components/ui/skeleton'
import { useLineups } from '@/hooks/use-football-queries'
import { layoutLineup, type PitchSide } from '@/lib/lineup-layout'
import { readableTextColor, type SideColors } from '@/lib/team-colors'

interface LineupsPanelProps {
  fixture: Fixture
  colors: SideColors
}

export function LineupsPanel({ fixture, colors }: LineupsPanelProps) {
  const { data, isPending, isError, error } = useLineups(fixture.league.id, fixture.fixture.id)

  if (isPending) return <Skeleton className="mt-2 h-72 w-full" />
  if (isError) return <ErrorMessage title="No se pudieron cargar las formaciones" error={error} />
  if (!data.home && !data.away) {
    return (
      <p className="py-4 text-sm text-muted-foreground">
        Las alineaciones aún no están disponibles. Suelen publicarse cerca de la hora del partido.
      </p>
    )
  }

  const { home, away } = fixture.teams
  return (
    <div className="flex flex-col gap-4 pt-2">
      <div className="flex justify-between gap-4 text-sm font-medium">
        <FormationTitle name={home.name} lineup={data.home} />
        <FormationTitle name={away.name} lineup={data.away} alignRight />
      </div>
      <Pitch home={data.home} away={data.away} colors={colors} />
      <div className="grid gap-4 sm:grid-cols-2">
        <Substitutes name={home.name} lineup={data.home} />
        <Substitutes name={away.name} lineup={data.away} />
      </div>
    </div>
  )
}

function FormationTitle({ name, lineup, alignRight = false }: { name: string; lineup: TeamLineup | null; alignRight?: boolean }) {
  return (
    <p className={alignRight ? 'text-right' : undefined}>
      {name}
      {lineup ? <span className="ml-2 text-muted-foreground">{lineup.formation}</span> : null}
    </p>
  )
}

function Pitch({ home, away, colors }: { home: TeamLineup | null; away: TeamLineup | null; colors: SideColors }) {
  const sides: { lineup: TeamLineup | null; side: PitchSide; color: string }[] = [
    { lineup: home, side: 'home', color: colors.home },
    { lineup: away, side: 'away', color: colors.away },
  ]
  return (
    <div className="relative aspect-[2/1] w-full overflow-hidden rounded-lg bg-emerald-700" role="img" aria-label="Formaciones en la cancha">
      <PitchLines />
      {sides.flatMap(({ lineup, side, color }) =>
        lineup
          ? layoutLineup(lineup, side).map(({ player, x, y }) => (
              <PlayerMarker key={`${side}-${player.name}`} player={player} color={color} x={x} y={y} />
            ))
          : [],
      )}
    </div>
  )
}

function PitchLines() {
  return (
    <svg viewBox="0 0 100 50" preserveAspectRatio="none" aria-hidden className="absolute inset-0 size-full fill-none stroke-white/60">
      <g strokeWidth={0.4} vectorEffect="non-scaling-stroke">
        <rect x="1" y="1" width="98" height="48" />
        <line x1="50" y1="1" x2="50" y2="49" />
        <circle cx="50" cy="25" r="6" />
        <rect x="1" y="14" width="13" height="22" />
        <rect x="86" y="14" width="13" height="22" />
        <rect x="1" y="20" width="5" height="10" />
        <rect x="94" y="20" width="5" height="10" />
      </g>
    </svg>
  )
}

function PlayerMarker({ player, color, x, y }: { player: LineupPlayer; color: string; x: number; y: number }) {
  return (
    <div
      className="absolute flex w-16 -translate-x-1/2 -translate-y-1/2 flex-col items-center gap-0.5"
      style={{ left: `${x}%`, top: `${y}%` }}
    >
      <span
        className="flex size-6 items-center justify-center rounded-full border border-white text-[10px] font-semibold sm:size-7 sm:text-xs"
        style={{ backgroundColor: color, color: readableTextColor(color) }}
      >
        {player.jersey}
      </span>
      <span className="max-w-full truncate text-[10px] leading-3 font-medium text-white [text-shadow:0_1px_2px_rgb(0_0_0/0.8)]">
        {surnameOf(player.name)}
      </span>
    </div>
  )
}

function surnameOf(name: string): string {
  return name.split(' ').at(-1) ?? name
}

function Substitutes({ name, lineup }: { name: string; lineup: TeamLineup | null }) {
  if (!lineup || lineup.substitutes.length === 0) return null
  return (
    <section aria-label={`Suplentes de ${name}`}>
      <h4 className="mb-1 text-xs font-medium text-muted-foreground">Suplentes · {name}</h4>
      <ul className="flex flex-col text-sm">
        {lineup.substitutes.map((player) => (
          <li key={`${player.jersey}-${player.name}`} className="flex gap-2 border-b py-1 last:border-b-0">
            <span className="w-6 shrink-0 text-right tabular-nums text-muted-foreground">{player.jersey}</span>
            <span className="truncate">{player.name}</span>
          </li>
        ))}
      </ul>
    </section>
  )
}

import type { Fixture } from '@futbol/core'
import { Card, CardContent } from '@/components/ui/card'
import { formatLimaDateTime, formatScore } from '@/lib/format'

interface MatchHeaderProps {
  fixture: Fixture
}

export function MatchHeader({ fixture }: MatchHeaderProps) {
  const { home, away } = fixture.teams
  const hasResult = fixture.goals.home !== null && fixture.goals.away !== null
  return (
    <Card>
      <CardContent className="flex flex-col items-center gap-3">
        <div className="flex w-full items-center justify-center gap-4 sm:gap-8">
          <TeamBadge name={home.name} logo={home.logo} />
          <div className="flex flex-col items-center">
            <span className={hasResult ? 'text-2xl font-semibold' : 'text-sm font-medium text-muted-foreground'}>
              {hasResult ? formatScore(fixture.goals.home, fixture.goals.away) : 'vs'}
            </span>
            {hasResult ? <span className="text-xs text-muted-foreground">resultado real</span> : null}
          </div>
          <TeamBadge name={away.name} logo={away.logo} />
        </div>
        <p className="text-center text-sm text-muted-foreground">
          {fixture.league.name} · {formatLimaDateTime(fixture.fixture.date)} (hora de Lima)
        </p>
      </CardContent>
    </Card>
  )
}

function TeamBadge({ name, logo }: { name: string; logo: string }) {
  return (
    <div className="flex flex-1 flex-col items-center gap-2 text-center">
      <img src={logo} alt="" className="size-14 object-contain" />
      <span className="font-heading text-base font-semibold">{name}</span>
    </div>
  )
}

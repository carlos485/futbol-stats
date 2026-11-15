import type { Fixture, Team } from '@futbol/core'
import { ClubHeader } from '@/components/club/club-header'
import { StandingCard } from '@/components/club/standing-card'
import { StatsCard } from '@/components/club/stats-card'
import { TeamFixtures } from '@/components/team-fixtures'

interface ClubViewProps {
  team: Team
  onSelectFixture: (fixture: Fixture) => void
  /** Leaves the club and goes back to the matches of the day. */
  onBack: () => void
}

export function ClubView({ team, onSelectFixture, onBack }: ClubViewProps) {
  return (
    <div className="flex flex-col gap-6">
      <ClubHeader team={team} />
      <div className="grid items-start gap-6 xl:grid-cols-3">
        <TeamFixtures team={team} onSelect={onSelectFixture} onBack={onBack} />
        <StandingCard team={team} />
        <StatsCard team={team} />
      </div>
    </div>
  )
}

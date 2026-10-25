import type { Fixture, Team } from '@futbol/core'
import { useState } from 'react'
import { AnalysisView } from '@/components/analysis/analysis-view'
import { TeamFixtures } from '@/components/team-fixtures'
import { TeamPanel, type RivalTeam } from '@/components/team-panel/team-panel'
import { ThemeToggle } from '@/components/theme-toggle'
import { useTheme } from '@/hooks/use-theme'

function findRival(fixture: Fixture | null, team: Team | null): RivalTeam | null {
  if (!fixture || !team) return null
  const { home, away } = fixture.teams
  return home.id === team.team.id ? away : home
}

function App() {
  const [team, setTeam] = useState<Team | null>(null)
  const [fixture, setFixture] = useState<Fixture | null>(null)
  const { theme, changeTheme } = useTheme()

  function handleSelectTeam(selected: Team) {
    setTeam(selected)
    setFixture(null)
  }

  return (
    <div className="min-h-svh bg-background text-foreground">
      <header className="border-b">
        <div className="mx-auto flex max-w-7xl items-center justify-between gap-4 px-4 py-3">
          <h1 className="font-heading text-lg font-semibold">Futbol Stats</h1>
          <div className="flex items-center gap-3">
            <span className="hidden text-xs text-muted-foreground sm:inline">Datos: ESPN (API no oficial)</span>
            <ThemeToggle theme={theme} onChange={changeTheme} />
          </div>
        </div>
      </header>
      <main className="mx-auto grid max-w-7xl gap-6 px-4 py-6 lg:grid-cols-[20rem_minmax(0,1fr)]">
        <aside>
          <TeamPanel team={team} rival={findRival(fixture, team)} onSelectTeam={handleSelectTeam} />
        </aside>
        {/* The remaining columns are not designed yet; the existing views stay here as they were. */}
        <div className="flex min-w-0 flex-col gap-6">
          {team ? (
            <TeamFixtures team={team} selectedFixtureId={fixture?.fixture.id ?? null} onSelect={setFixture} />
          ) : null}
          {fixture ? <AnalysisView key={fixture.fixture.id} fixture={fixture} /> : null}
        </div>
      </main>
    </div>
  )
}

export default App

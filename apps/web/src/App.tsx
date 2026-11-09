import type { Fixture, Team } from '@futbol/core'
import { MousePointerClickIcon } from 'lucide-react'
import { useState } from 'react'
import { AnalysisView } from '@/components/analysis/analysis-view'
import { TodaysMatches } from '@/components/matches/todays-matches'
import { TeamFixtures } from '@/components/team-fixtures'
import { TeamPanel } from '@/components/team-panel/team-panel'
import { TeamSearch } from '@/components/team-search'
import { ThemeToggle } from '@/components/theme-toggle'
import { useTheme } from '@/hooks/use-theme'

function App() {
  const [team, setTeam] = useState<Team | null>(null)
  const [fixture, setFixture] = useState<Fixture | null>(null)
  const { theme, changeTheme } = useTheme()

  function handleSelectTeam(selected: Team) {
    setTeam(selected)
    setFixture(null)
  }

  function handleBackToToday() {
    setTeam(null)
    setFixture(null)
  }

  const selectedFixtureId = fixture?.fixture.id ?? null
  // Once a match is chosen only its own analysis is shown, so the middle column holds just the searched team's fixtures.
  const showTeamColumn = team !== null || fixture === null

  return (
    <div className="min-h-svh bg-background text-foreground">
      <header className="border-b">
        <div className="mx-auto flex max-w-[110rem] items-center justify-between gap-4 px-4 py-3">
          <h1 className="font-heading text-lg font-semibold">Futbol Stats</h1>
          <div className="flex items-center gap-3">
            <span className="hidden text-xs text-muted-foreground sm:inline">Datos: ESPN (API no oficial)</span>
            <ThemeToggle theme={theme} onChange={changeTheme} />
          </div>
        </div>
      </header>
      <main
        className={`mx-auto grid max-w-[110rem] gap-6 px-4 py-6 lg:grid-cols-[24rem_minmax(0,1fr)] ${
          showTeamColumn ? 'xl:grid-cols-[24rem_minmax(0,24rem)_minmax(0,1fr)]' : ''
        }`}
      >
        <aside aria-label="Búsqueda y partidos de hoy" className="flex flex-col gap-4">
          <TeamSearch selected={team} onSelect={handleSelectTeam} />
          <TodaysMatches selectedFixtureId={selectedFixtureId} onSelect={setFixture} />
        </aside>
        {/* Below the xl breakpoint columns 2 and 3 share one stacked column; from xl they become grid columns. */}
        <div className="flex min-w-0 flex-col gap-6 xl:contents">
          {showTeamColumn ? (
            <section aria-label="Equipo" className="flex min-w-0 flex-col gap-4">
              {fixture ? null : <TeamPanel team={team} />}
              {team ? (
                <TeamFixtures team={team} selectedFixtureId={selectedFixtureId} onSelect={setFixture} onBack={handleBackToToday} />
              ) : null}
            </section>
          ) : null}
          <section aria-label="Análisis" className="min-w-0">
            {fixture ? (
              <AnalysisView key={fixture.fixture.id} fixture={fixture} />
            ) : (
              <div className="flex flex-col items-center gap-2 rounded-xl border border-dashed p-6 text-center text-sm text-muted-foreground">
                <MousePointerClickIcon className="size-6" />
                <p>Elige un partido para ver su análisis.</p>
              </div>
            )}
          </section>
        </div>
      </main>
    </div>
  )
}

export default App

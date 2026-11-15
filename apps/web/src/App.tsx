import type { Fixture, Team } from '@futbol/core'
import { ArrowLeftIcon, MousePointerClickIcon } from 'lucide-react'
import { useState } from 'react'
import { AnalysisView } from '@/components/analysis/analysis-view'
import { ClubView } from '@/components/club/club-view'
import { TodaysMatches } from '@/components/matches/todays-matches'
import { TeamSearch } from '@/components/team-search'
import { Button } from '@/components/ui/button'
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

  function renderDetail() {
    if (fixture) {
      return (
        <div className="flex flex-col gap-4">
          <Button variant="ghost" size="sm" className="self-start" onClick={() => setFixture(null)}>
            <ArrowLeftIcon />
            {team ? team.team.name : 'Inicio'}
          </Button>
          <AnalysisView key={fixture.fixture.id} fixture={fixture} />
        </div>
      )
    }
    if (team) {
      return <ClubView team={team} onSelectFixture={setFixture} onBack={handleBackToToday} />
    }
    return (
      <div className="flex flex-col items-center gap-2 rounded-xl border border-dashed p-6 text-center text-sm text-muted-foreground">
        <MousePointerClickIcon className="size-6" />
        <p>Busca un equipo o elige un partido de hoy para ver su análisis.</p>
      </div>
    )
  }

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
      <main className="mx-auto grid max-w-[110rem] gap-6 px-4 py-6 lg:grid-cols-[24rem_minmax(0,1fr)]">
        <aside aria-label="Búsqueda y partidos de hoy" className="flex flex-col gap-4">
          <TeamSearch selected={team} onSelect={handleSelectTeam} />
          <TodaysMatches selectedFixtureId={selectedFixtureId} onSelect={setFixture} />
        </aside>
        <section aria-label='Detalle' className="min-w-0">{renderDetail()}</section>
      </main>
    </div>
  )
}

export default App

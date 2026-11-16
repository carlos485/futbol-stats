import type { AnalysisResponse, Fixture } from '@futbol/core'
import { ComparisonSection } from '@/components/analysis/comparison-section'
import { LineupsPanel } from '@/components/analysis/lineups-panel'
import { MatchesTable } from '@/components/analysis/matches-table'
import { Card, CardContent } from '@/components/ui/card'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { pickSideColors } from '@/lib/team-colors'

// Underlined tabs on a divider line, left aligned, for the main tabs; the nested ones keep the default button look.
const TAB_LIST_CLASS = 'h-9 w-full justify-start gap-2 border-b p-0'
const TAB_TRIGGER_CLASS = 'flex-none px-3'

interface MatchDetailsCardProps {
  fixture: Fixture
  analysis: AnalysisResponse
  homeName: string
  awayName: string
}

/** Lineups, statistics comparison and recent results of the match, one tab each. */
export function MatchDetailsCard({ fixture, analysis, homeName, awayName }: MatchDetailsCardProps) {
  return (
    <Card>
      <CardContent>
        <Tabs defaultValue="lineups">
          <TabsList variant="line" className={TAB_LIST_CLASS}>
            <TabsTrigger value="lineups" className={TAB_TRIGGER_CLASS}>
              Formaciones
            </TabsTrigger>
            <TabsTrigger value="statistics" className={TAB_TRIGGER_CLASS}>
              Estadísticas
            </TabsTrigger>
            <TabsTrigger value="results" className={TAB_TRIGGER_CLASS}>
              Últimos resultados
            </TabsTrigger>
          </TabsList>
          <TabsContent value="lineups">
            <LineupsPanel fixture={fixture} colors={pickSideColors(analysis.colors.home, analysis.colors.away)} />
          </TabsContent>
          <TabsContent value="statistics">
            <ComparisonSection home={analysis.home} away={analysis.away} homeName={homeName} awayName={awayName} />
          </TabsContent>
          <TabsContent value="results">
            <Tabs defaultValue="home" className="pt-2">
              <TabsList>
                <TabsTrigger value="home">Últimos 5 — Local</TabsTrigger>
                <TabsTrigger value="away">Últimos 5 — Visitante</TabsTrigger>
                <TabsTrigger value="h2h">Cara a cara</TabsTrigger>
              </TabsList>
              <TabsContent value="home">
                <MatchesTable analysis={analysis.home} />
              </TabsContent>
              <TabsContent value="away">
                <MatchesTable analysis={analysis.away} />
              </TabsContent>
              <TabsContent value="h2h">
                <MatchesTable analysis={analysis.headToHead} />
              </TabsContent>
            </Tabs>
          </TabsContent>
        </Tabs>
      </CardContent>
    </Card>
  )
}

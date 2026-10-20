import { getMatchResult, type MatchResult, type MatchSummary, type TeamAnalysis } from '@futbol/core'
import { Badge } from '@/components/ui/badge'
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table'
import { formatCorners, formatCount, formatLimaDate, formatScore } from '@/lib/format'

const RESULT_LABELS: Record<MatchResult, string> = { W: 'G', D: 'E', L: 'P' }
const RESULT_VARIANTS: Record<MatchResult, 'default' | 'secondary' | 'destructive'> = {
  W: 'default',
  D: 'secondary',
  L: 'destructive',
}

interface MatchesTableProps {
  analysis: TeamAnalysis
}

export function MatchesTable({ analysis }: MatchesTableProps) {
  if (analysis.matches.length === 0) {
    return <p className="py-4 text-sm text-muted-foreground">No hay partidos disponibles.</p>
  }

  return (
    <div className="flex flex-col gap-3">
      <div className="flex items-center gap-1.5 text-sm text-muted-foreground">
        Forma:
        {analysis.aggregate.form.map((result, index) => (
          <ResultBadge key={index} result={result} />
        ))}
      </div>
      <Table>
        <TableHeader>
          <TableRow>
            <TableHead>Fecha</TableHead>
            <TableHead>Competición</TableHead>
            <TableHead>Rival</TableHead>
            <TableHead>Resultado</TableHead>
            <TableHead title="A favor / total del partido">Córners</TableHead>
            <TableHead>Tiros</TableHead>
            <TableHead>Al arco</TableHead>
            <TableHead>Atajadas</TableHead>
            <TableHead>Amarillas</TableHead>
            <TableHead>Rojas</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {analysis.matches.map((match) => (
            <MatchRow key={match.fixtureId} match={match} teamId={analysis.teamId} />
          ))}
        </TableBody>
      </Table>
    </div>
  )
}

function ResultBadge({ result }: { result: MatchResult }) {
  return <Badge variant={RESULT_VARIANTS[result]}>{RESULT_LABELS[result]}</Badge>
}

function MatchRow({ match, teamId }: { match: MatchSummary; teamId: number }) {
  const isHome = match.home.id === teamId
  const opponent = isHome ? match.away : match.home
  const result = getMatchResult(match.stats)
  const { stats } = match

  return (
    <TableRow>
      <TableCell className="whitespace-nowrap">{formatLimaDate(match.date)}</TableCell>
      <TableCell className="whitespace-nowrap text-muted-foreground">{match.leagueName}</TableCell>
      <TableCell className="whitespace-nowrap">
        {isHome ? 'vs' : 'en'} {opponent.name}
      </TableCell>
      <TableCell className="whitespace-nowrap">
        <span className="mr-2">{formatScore(stats.goalsFor, stats.goalsAgainst)}</span>
        {result ? <ResultBadge result={result} /> : null}
      </TableCell>
      <TableCell>{formatCorners(stats)}</TableCell>
      <TableCell>{formatCount(stats.shotsTotal)}</TableCell>
      <TableCell>{formatCount(stats.shotsOnTarget)}</TableCell>
      <TableCell>{formatCount(stats.saves)}</TableCell>
      <TableCell>{formatCount(stats.yellowCards)}</TableCell>
      <TableCell>{formatCount(stats.redCards)}</TableCell>
    </TableRow>
  )
}

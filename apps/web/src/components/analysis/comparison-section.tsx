import type { AnalysisResponse } from '@futbol/core'
import { Bar, BarChart, CartesianGrid, Legend, ResponsiveContainer, Tooltip, XAxis, YAxis } from 'recharts'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table'
import { formatAverage } from '@/lib/format'
import { COMPARISON_METRICS } from '@/lib/metrics'

const CHART_HEIGHT_PX = 300
const CHART_DECIMALS = 2
// Recharts draws with inline styles, so the theme colors are passed as CSS variables to follow light and dark.
const AXIS_TICK = { fontSize: 12, fill: 'var(--muted-foreground)' }
const TOOLTIP_STYLE = {
  backgroundColor: 'var(--popover)',
  color: 'var(--popover-foreground)',
  border: '1px solid var(--border)',
  borderRadius: 'var(--radius)',
}

interface ComparisonSectionProps {
  home: AnalysisResponse['home']
  away: AnalysisResponse['away']
  homeName: string
  awayName: string
}

export function ComparisonSection({ home, away, homeName, awayName }: ComparisonSectionProps) {
  const chartData = COMPARISON_METRICS.filter((metric) => metric.inChart).map((metric) => ({
    metric: metric.label,
    [homeName]: home.aggregate.metrics[metric.key].average ?? undefined,
    [awayName]: away.aggregate.metrics[metric.key].average ?? undefined,
  }))

  return (
    <Card>
      <CardHeader>
        <CardTitle>Comparativa de promedios</CardTitle>
        <CardDescription>
          Promedio por partido sobre los últimos 5. Entre paréntesis, los partidos con dato (n) de cada métrica.
        </CardDescription>
      </CardHeader>
      <CardContent className="flex flex-col gap-6">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Métrica</TableHead>
              <TableHead>{homeName}</TableHead>
              <TableHead>{awayName}</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {COMPARISON_METRICS.map((metric) => {
              const homeSummary = home.aggregate.metrics[metric.key]
              const awaySummary = away.aggregate.metrics[metric.key]
              return (
                <TableRow key={metric.key}>
                  <TableCell>{metric.label}</TableCell>
                  <TableCell>
                    {formatAverage(homeSummary)} <span className="text-xs text-muted-foreground">(n={homeSummary.n})</span>
                  </TableCell>
                  <TableCell>
                    {formatAverage(awaySummary)} <span className="text-xs text-muted-foreground">(n={awaySummary.n})</span>
                  </TableCell>
                </TableRow>
              )
            })}
          </TableBody>
        </Table>

        <div style={{ height: CHART_HEIGHT_PX }} aria-label="Gráfico comparativo de promedios" role="img">
          <ResponsiveContainer width="100%" height="100%">
            <BarChart data={chartData}>
              <CartesianGrid stroke="var(--border)" strokeDasharray="3 3" vertical={false} />
              <XAxis dataKey="metric" tick={AXIS_TICK} interval={0} stroke="var(--border)" />
              <YAxis allowDecimals tick={AXIS_TICK} stroke="var(--border)" />
              <Tooltip
                formatter={(value) => Number(value).toFixed(CHART_DECIMALS)}
                contentStyle={TOOLTIP_STYLE}
                cursor={{ fill: 'var(--muted)', opacity: 0.5 }}
              />
              <Legend formatter={(name) => <span className="text-foreground">{name}</span>} />
              <Bar dataKey={homeName} fill="var(--chart-1)" radius={[4, 4, 0, 0]} />
              <Bar dataKey={awayName} fill="var(--chart-2)" radius={[4, 4, 0, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </div>
      </CardContent>
    </Card>
  )
}

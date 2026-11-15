import type { CompetitionRegion } from '@futbol/core'

type RegionMap = 'south-america' | 'europe' | 'world'

// Simplified silhouettes on a 100x100 canvas, drawn with the text color so they follow the theme.
const MAP_SHAPES: Record<RegionMap, string[]> = {
  'south-america': [
    'M30 8 L45 6 L58 14 L72 22 L84 34 L92 44 L84 58 L68 70 L58 82 L50 96 L44 92 L42 76 L36 62 L26 52 L20 38 L24 22 Z',
  ],
  europe: [
    'M4 50 L10 44 L22 44 L20 34 L30 28 L34 18 L44 10 L52 16 L50 28 L60 22 L66 8 L78 6 L90 14 L96 30 L88 46 L92 60 L78 66 L70 60 L60 66 L62 76 L52 70 L46 58 L40 66 L44 80 L38 84 L32 66 L26 60 L20 70 L8 66 Z',
    'M22 20 L28 16 L30 26 L24 30 Z',
  ],
  world: [
    'M6 16 L30 10 L42 18 L36 40 L26 48 L16 36 Z',
    'M30 52 L42 54 L44 70 L36 92 L30 70 Z',
    'M46 18 L60 16 L62 30 L74 42 L66 60 L58 86 L50 70 L46 48 Z',
    'M62 14 L92 14 L96 34 L82 46 L70 40 Z',
    'M80 66 L94 66 L92 80 L80 78 Z',
  ],
}

function mapOf(region: Exclude<CompetitionRegion, { kind: 'country' }>): RegionMap {
  return region.kind === 'continent' ? region.continent : 'world'
}

/** The country flag or a map silhouette of the continent / world, followed by the region name. */
export function RegionLabel({ region }: { region: CompetitionRegion }) {
  return (
    <span className="flex items-center gap-1.5 text-xs leading-4 font-normal text-muted-foreground">
      {region.kind === 'country' ? (
        <img src={region.flagUrl} alt="" className="h-3 w-4 shrink-0 object-contain" />
      ) : (
        <svg aria-hidden viewBox="0 0 100 100" className="size-4 shrink-0 fill-current">
          {MAP_SHAPES[mapOf(region)].map((path) => (
            <path key={path} d={path} />
          ))}
        </svg>
      )}
      {region.name}
    </span>
  )
}

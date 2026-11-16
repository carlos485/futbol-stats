import type { CompetitionRegion } from '@futbol/core'

/** The flag or map of the region followed by its name. */
export function RegionLabel({ region }: { region: CompetitionRegion }) {
  return (
    <span className="flex items-center gap-1.5 text-xs leading-4 font-normal text-muted-foreground">
      <img src={region.image} alt="" className="h-3 w-4 shrink-0 object-contain" />
      {region.name}
    </span>
  )
}

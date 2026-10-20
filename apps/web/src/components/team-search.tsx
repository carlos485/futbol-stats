import type { Team } from '@futbol/core'
import { ChevronsUpDownIcon } from 'lucide-react'
import { useState } from 'react'
import { buttonVariants } from '@/components/ui/button'
import { Command, CommandEmpty, CommandGroup, CommandInput, CommandItem, CommandList } from '@/components/ui/command'
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover'
import { useDebouncedValue } from '@/hooks/use-debounced-value'
import { MIN_SEARCH_LENGTH, useTeamSearch } from '@/hooks/use-football-queries'
import { leagueLabel } from '@/lib/leagues'
import { cn } from '@/lib/utils'

const SEARCH_DEBOUNCE_MS = 400

interface TeamSearchProps {
  selected: Team | null
  onSelect: (team: Team) => void
}

export function TeamSearch({ selected, onSelect }: TeamSearchProps) {
  const [open, setOpen] = useState(false)
  const [input, setInput] = useState('')
  const debouncedInput = useDebouncedValue(input, SEARCH_DEBOUNCE_MS)
  const { data, isFetching, isError, error } = useTeamSearch(debouncedInput)

  const hasEnoughCharacters = debouncedInput.trim().length >= MIN_SEARCH_LENGTH
  const isWaitingForDebounce = input !== debouncedInput

  function emptyMessage(): string {
    if (!hasEnoughCharacters) return `Escribe al menos ${MIN_SEARCH_LENGTH} caracteres`
    if (isWaitingForDebounce || isFetching) return 'Buscando…'
    if (isError) return error.message
    return 'Sin resultados'
  }

  function handleSelect(team: Team) {
    onSelect(team)
    setOpen(false)
  }

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger className={cn(buttonVariants({ variant: 'outline', size: 'lg' }), 'w-full justify-between sm:w-80')}>
        <span className={cn('flex items-center gap-2', !selected && 'text-muted-foreground')}>
          {selected ? <img src={selected.team.logo} alt="" className="size-5 object-contain" /> : null}
          {selected ? selected.team.name : 'Buscar equipo…'}
        </span>
        <ChevronsUpDownIcon className="opacity-50" />
      </PopoverTrigger>
      <PopoverContent align="start" className="w-(--anchor-width) min-w-72 p-0">
        <Command shouldFilter={false}>
          <CommandInput value={input} onValueChange={setInput} placeholder="Nombre del equipo" />
          <CommandList>
            <CommandEmpty>{emptyMessage()}</CommandEmpty>
            {hasEnoughCharacters && data ? (
              <CommandGroup>
                {data.map((team) => (
                  <CommandItem
                    key={`${team.league.id}-${team.team.id}`}
                    value={`${team.league.id}-${team.team.id}`}
                    onSelect={() => handleSelect(team)}
                  >
                    <img src={team.team.logo} alt="" className="size-5 object-contain" />
                    <span>{team.team.name}</span>
                    <span className="ml-auto text-xs text-muted-foreground">{leagueLabel(team.league.id)}</span>
                  </CommandItem>
                ))}
              </CommandGroup>
            ) : null}
          </CommandList>
        </Command>
      </PopoverContent>
    </Popover>
  )
}

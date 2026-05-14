'use client'

import * as React from 'react'
import { Check, ChevronsUpDown, Film } from 'lucide-react'
import { cn } from '@/lib/utils'
import { Button } from '@/components/ui/button'
import {
  Command,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
  CommandList,
} from '@/components/ui/command'
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover'
import type { Movie } from '@/types/movie'

interface MovieComboboxFormProps {
  movies: Movie[]
  value: string
  onValueChange: (value: string) => void
  placeholder?: string
  searchPlaceholder?: string
  className?: string
  disabled?: boolean
}

export function MovieComboboxForm({
  movies,
  value,
  onValueChange,
  placeholder = 'Chọn phim...',
  searchPlaceholder = 'Nhập tên phim để tìm...',
  className,
  disabled = false,
}: MovieComboboxFormProps) {
  const [open, setOpen] = React.useState(false)

  const selectedMovie = movies.find(m => m._id === value)
  const displayLabel = selectedMovie
    ? `${selectedMovie.title}${selectedMovie.duration ? ` (${selectedMovie.duration} phút)` : ''}`
    : placeholder

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger asChild>
        <Button
          variant="outline"
          role="combobox"
          aria-expanded={open}
          disabled={disabled}
          className={cn(
            'w-full justify-between hover:bg-gray-50',
            !value && 'text-muted-foreground',
            className
          )}
        >
          <span className="truncate flex items-center gap-2">
            <Film className="w-4 h-4 text-gray-400 flex-shrink-0" />
            {displayLabel}
          </span>
          <ChevronsUpDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
        </Button>
      </PopoverTrigger>
      <PopoverContent className="w-[var(--radix-popover-trigger-width)] p-0" align="start">
        <Command>
          <CommandInput placeholder={searchPlaceholder} />
          <CommandList>
            <CommandEmpty>Không tìm thấy phim nào.</CommandEmpty>
            <CommandGroup>
              {movies.map(movie => (
                <CommandItem
                  key={movie._id}
                  value={movie._id}
                  keywords={[movie.title, movie.country || '', movie.director || '']}
                  onSelect={currentValue => {
                    onValueChange(currentValue)
                    setOpen(false)
                  }}
                >
                  <Check
                    className={cn(
                      'mr-2 h-4 w-4 flex-shrink-0',
                      value === movie._id ? 'opacity-100' : 'opacity-0'
                    )}
                  />
                  <div className="flex flex-col flex-1 min-w-0">
                    <span className="font-medium truncate">{movie.title}</span>
                    <span className="text-xs text-muted-foreground truncate">
                      {[
                        movie.duration ? `${movie.duration} phút` : null,
                        movie.country,
                        movie.director ? `ĐD: ${movie.director}` : null,
                      ]
                        .filter(Boolean)
                        .join(' • ')}
                    </span>
                  </div>
                </CommandItem>
              ))}
            </CommandGroup>
          </CommandList>
        </Command>
      </PopoverContent>
    </Popover>
  )
}

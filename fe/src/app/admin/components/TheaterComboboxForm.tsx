'use client'

import * as React from 'react'
import { Check, ChevronsUpDown, Building2 } from 'lucide-react'
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
import { Theater } from '@/types/theater'

interface TheaterComboboxFormProps {
  theaters: Theater[]
  value: string
  onValueChange: (value: string) => void
  placeholder?: string
  searchPlaceholder?: string
  className?: string
  disabled?: boolean
  showAllOption?: boolean // Option để hiển thị "Tất cả" hay không
}

export function TheaterComboboxForm({
  theaters,
  value,
  onValueChange,
  placeholder = 'Chọn rạp...',
  searchPlaceholder = 'Tìm kiếm rạp...',
  className,
  disabled = false,
  showAllOption = false,
}: TheaterComboboxFormProps) {
  const [open, setOpen] = React.useState(false)

  // Tìm theater được chọn
  const selectedTheater = theaters.find(theater => theater._id === value)
  const displayLabel = value === 'all' ? 'Tất cả các rạp' : selectedTheater?.name || placeholder

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
            <Building2 className="w-4 h-4 text-gray-400 flex-shrink-0" />
            {displayLabel}
          </span>
          <ChevronsUpDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
        </Button>
      </PopoverTrigger>
      <PopoverContent className="w-[var(--radix-popover-trigger-width)] p-0" align="start">
        <Command>
          <CommandInput placeholder={searchPlaceholder} />
          <CommandList>
            <CommandEmpty>Không tìm thấy rạp phim.</CommandEmpty>
            <CommandGroup>
              {/* Option "Tất cả" (chỉ hiển thị nếu showAllOption = true) */}
              {showAllOption && (
                <CommandItem
                  value="all"
                  onSelect={() => {
                    onValueChange('all')
                    setOpen(false)
                  }}
                >
                  <Check
                    className={cn('mr-2 h-4 w-4', value === 'all' ? 'opacity-100' : 'opacity-0')}
                  />
                  Tất cả các rạp
                </CommandItem>
              )}

              {/* Danh sách theaters */}
              {theaters.map(theater => (
                <CommandItem
                  key={theater._id}
                  value={theater._id}
                  keywords={[theater.name, theater.address || '']}
                  onSelect={currentValue => {
                    onValueChange(currentValue)
                    setOpen(false)
                  }}
                >
                  <Check
                    className={cn(
                      'mr-2 h-4 w-4',
                      value === theater._id ? 'opacity-100' : 'opacity-0'
                    )}
                  />
                  <div className="flex flex-col flex-1 min-w-0">
                    <span className="font-medium truncate">{theater.name}</span>
                    {theater.address && (
                      <span className="text-xs text-muted-foreground truncate">
                        {theater.address}
                      </span>
                    )}
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

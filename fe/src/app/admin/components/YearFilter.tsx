'use client'

import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'

interface YearFilterProps {
  selectedYear: number
  onYearChange: (year: number) => void
  label?: string
}

export function YearFilter({ selectedYear, onYearChange, label }: YearFilterProps) {
  const currentYear = new Date().getFullYear()

  // Generate years: current year + 5 years back
  const years = Array.from({ length: 6 }, (_, i) => currentYear - i)

  return (
    <Select value={selectedYear.toString()} onValueChange={value => onYearChange(Number(value))}>
      <SelectTrigger className="w-[180px]">
        <SelectValue placeholder="Chọn năm" />
      </SelectTrigger>
      <SelectContent>
        {years.map(year => (
          <SelectItem key={year} value={year.toString()}>
            {label ? `${label} ${year}` : `Năm ${year}`}
          </SelectItem>
        ))}
      </SelectContent>
    </Select>
  )
}

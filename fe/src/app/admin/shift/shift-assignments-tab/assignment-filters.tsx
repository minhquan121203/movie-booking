// app/(admin)/shift-manager/components/assignment-filters.tsx
'use client'

import { useCallback } from 'react'
import { Card } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { TheaterCombobox } from '@/components/ui/combobox'

import { Search, Calendar } from 'lucide-react'
import type { Theater } from '@/types/theater'
interface AssignmentFiltersProps {
  theaters: Theater[]
  selectedTheaterId: string
  selectedDate: string
  selectedShiftCode: string
  searchQuery: string
  availableShiftCodes: string[] | undefined
  onTheaterChange: (value: string) => void
  onDateChange: (value: string) => void
  onShiftCodeChange: (value: string) => void
  onSearchChange: (value: string) => void
}

export default function AssignmentFilters({
  theaters,
  selectedTheaterId,
  selectedDate,
  selectedShiftCode,
  searchQuery,
  availableShiftCodes,
  onTheaterChange,
  onDateChange,
  onShiftCodeChange,
  onSearchChange,
}: AssignmentFiltersProps) {
  const handleDateChange = useCallback(
    (e: React.ChangeEvent<HTMLInputElement>) => {
      onDateChange(e.target.value)
    },
    [onDateChange]
  )

  const handleSearchChange = useCallback(
    (e: React.ChangeEvent<HTMLInputElement>) => {
      onSearchChange(e.target.value)
    },
    [onSearchChange]
  )

  return (
    <Card className="p-4 rounded-2xl border-gray-100 shadow-sm bg-white">
      <div className="flex flex-col md:flex-row gap-4 items-center">
        {/* Theater Select */}
        <TheaterCombobox
          theaters={theaters}
          value={selectedTheaterId}
          onValueChange={onTheaterChange}
          placeholder="Lọc theo rạp"
          searchPlaceholder="Tìm kiếm rạp..."
          className="w-full md:w-[220px] rounded-xl bg-gray-50 border-gray-200"
        />

        {/* Date Picker */}
        <div className="relative w-full md:w-[180px]">
          <Calendar className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 w-4 h-4 pointer-events-none" />
          <Input
            type="date"
            value={selectedDate}
            onChange={handleDateChange}
            className="pl-9 rounded-xl bg-gray-50 border-gray-200"
          />
        </div>

        {/* Shift Filter */}
        <Select value={selectedShiftCode} onValueChange={onShiftCodeChange}>
          <SelectTrigger className="w-full md:w-40 rounded-xl bg-gray-50 border-gray-200">
            <SelectValue placeholder="Lọc ca" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">Tất cả ca</SelectItem>
            {availableShiftCodes &&
              availableShiftCodes.map(code => (
                <SelectItem key={code} value={code}>
                  Ca {code}
                </SelectItem>
              ))}
          </SelectContent>
        </Select>

        {/* Search */}
        <div className="relative flex-1 w-full">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 w-4 h-4" />
          <Input
            placeholder="Tìm tên nhân viên..."
            value={searchQuery}
            onChange={handleSearchChange}
            className="pl-9 rounded-xl bg-gray-50 border-gray-200"
          />
        </div>
      </div>
    </Card>
  )
}

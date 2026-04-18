'use client'

import { Card } from '@/components/ui/card'
import type { Theater } from '@/types/theater'
import { VIETNAM_CITIES } from '@/constants/location'

type FilterSidebarProps = {
  selectedCity: string
  onSelectCity: (id: string) => void
  currentCinemas: Theater[]
  selectedCinema: Theater | undefined
  onSelectCinema: (theater: Theater | undefined) => void
  isLoading: boolean
}

export default function FilterSidebar({
  selectedCity,
  onSelectCity,
  currentCinemas,
  selectedCinema,
  onSelectCinema,
  isLoading,
}: FilterSidebarProps) {
  return (
    <div className="space-y-3 sm:space-y-4">
      {/* --- 1. City Filter --- */}
      <Card className="bg-surface border-border p-3 sm:p-4" style={{ borderRadius: '16px' }}>
        <h3 className="text-text-primary mb-3 text-sm sm:text-base" style={{ fontWeight: 600 }}>
          Khu vực
        </h3>
        <div className="space-y-2 max-h-[300px] sm:max-h-[500px] overflow-y-auto">
          {VIETNAM_CITIES.map(city => (
            <button
              key={city}
              onClick={() => onSelectCity(city)}
              className={`w-full flex items-center justify-between px-2.5 sm:px-3 py-2 rounded-lg transition-all text-sm sm:text-base ${
                selectedCity === city
                  ? 'bg-primary text-white'
                  : 'hover:bg-bg-secondary text-text-primary'
              }`}
            >
              <span>{city}</span>
            </button>
          ))}
        </div>
      </Card>

      {/* --- 2. Cinema Filter --- */}
      {isLoading && (!currentCinemas || currentCinemas.length === 0) ? (
        <div className="text-center text-text-secondary py-4">Đang tải danh sách rạp...</div>
      ) : (
        <Card className="bg-surface border-border p-3 sm:p-4" style={{ borderRadius: '16px' }}>
          <h3 className="text-text-primary mb-3 text-sm sm:text-base" style={{ fontWeight: 600 }}>
            Rạp
          </h3>
          <div className="space-y-2">
            {/* Nút Tất cả */}
            {/* <button
                key={'all'}
                onClick={() => {onSelectCinema(undefined)}}
                className={`w-full text-left px-2.5 sm:px-3 py-2 rounded-lg transition-all text-sm sm:text-base ${
                  // SỬA: Check chính xác null để active
                  selectedCinema === null
                    ? 'bg-primary text-white'
                    : 'hover:bg-bg-secondary text-text-secondary'
                }`}
              >
                Tất cả
              </button> */}

            {currentCinemas.map(cinema => (
              <button
                key={cinema._id}
                onClick={() => onSelectCinema(cinema)}
                className={`w-full text-left px-2.5 sm:px-3 py-2 rounded-lg transition-all text-sm sm:text-base ${
                  // Check ID trùng khớp
                  selectedCinema?._id === cinema._id
                    ? 'bg-primary text-white'
                    : 'hover:bg-bg-secondary text-text-secondary'
                }`}
              >
                {cinema.name}
              </button>
            ))}

            {currentCinemas.length === 0 && (
              <p className="text-sm text-text-secondary px-2">Không có rạp nào tại khu vực này.</p>
            )}
          </div>
        </Card>
      )}
    </div>
  )
}

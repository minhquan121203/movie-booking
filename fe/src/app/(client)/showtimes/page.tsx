'use client'

import { useState, useEffect, useMemo } from 'react'
import type { Theater } from '@/types/theater'
import { useSchedules } from '@/lib/api/schedules'
import { useTheaters } from '@/lib/api/theaters'
import PageHeader from '@/app/(client)/showtimes/components/PageHeader'
import FilterSidebar from '@/app/(client)/showtimes/components/FilterSidebar'
import ShowtimeContent from '@/app/(client)/showtimes/components/ShowtimeContent'
import { DEFAULT_THEATER_LIST } from '@/constants'

export default function LichChieuHomNay() {
  const [selectedCity, setSelectedCity] = useState('Hà Nội')
  // Để mặc định là undefined (hoặc ngày hôm nay nếu bạn muốn user vào thấy luôn)
  // const [selectedDate, setSelectedDate] = useState<string | undefined>(new Date().toLocaleDateString('en-CA'))
  const [selectedDate, setSelectedDate] = useState<string | undefined>(undefined)
  const [manualCinema, setManualCinema] = useState<Theater | undefined>(undefined)

  const { data: theaterData = DEFAULT_THEATER_LIST, isLoading: isLoadingTheaters } = useTheaters({
    city: selectedCity,
  })

  const theaters: Theater[] = theaterData ? theaterData.theaters : []
  const activeCinema = manualCinema || theaters[0] || null

  const { data: scheduleData, isFetching: isSchedulesLoading } = useSchedules({
    theaterId: activeCinema?._id,
    showDate: selectedDate,
  })
  const schedules = useMemo(() => {
    return scheduleData?.schedules || []
  }, [scheduleData])
  const handleSelectCity = (city: string) => {
    setSelectedCity(city)
    setManualCinema(undefined)
  }

  return (
    <div className="min-h-screen bg-bg-primary">
      <div className="max-w-[1400px] mx-auto px-4 sm:px-6 py-6 sm:py-8">
        <PageHeader
          title="📅 Lịch chiếu phim hôm nay"
          subtitle="Xem lịch chiếu phim theo rạp, suất chiếu và định dạng phim"
        />

        <div className="grid grid-cols-1 lg:grid-cols-[260px_1fr] xl:grid-cols-[280px_1fr] gap-4 lg:gap-6">
          <FilterSidebar
            selectedCity={selectedCity}
            onSelectCity={handleSelectCity}
            currentCinemas={theaters}
            selectedCinema={activeCinema}
            onSelectCinema={setManualCinema}
            isLoading={isLoadingTheaters}
          />

          <ShowtimeContent
            // Bỏ prop dates vì DateSelector tự lo
            selectedDate={selectedDate}
            onSelectDate={setSelectedDate}
            selectedCinema={activeCinema}
            schedules={schedules}
            checkCinema={activeCinema !== null}
            isLoading={isSchedulesLoading}
          />
        </div>
      </div>
    </div>
  )
}

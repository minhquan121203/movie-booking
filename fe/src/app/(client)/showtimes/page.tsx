'use client'

import { useState } from 'react'
import { ShowtimeSection } from '@/app/(client)/components/showtimeSection'
import { ShowtimeSectionSkeleton } from '@/app/(client)/components/ShowtimeSectionSkeleton'
import { useTheaters } from '@/lib/api/theaters'
import { DEFAULT_THEATER_LIST } from '@/constants'
import { CalendarDays } from 'lucide-react'

export default function ShowtimesPage() {
  // 1. Quản lý state thành phố y hệt trang chủ
  const [selectedCity, setSelectedCity] = useState('Hà Nội')

  // 2. Gọi API lấy danh sách rạp theo thành phố y hệt trang chủ
  const { data: listTheater = DEFAULT_THEATER_LIST, isLoading: loadingTheater } = useTheaters({
    city: selectedCity,
    limit: 100,
    isActive: 'true',
    sortBy: 'name',
    order: 'asc',
  })

  const handleCityChange = (city: string) => {
    setSelectedCity(city)
  }

  return (
    <main className="w-full max-w-none px-[25px] md:px-[60px] xl:px-[86px] py-12 min-h-screen">

      {/* Tiêu đề trang cho sang trọng */}
      <div className="flex flex-col items-center justify-center mb-10 text-center animate-in fade-in slide-in-from-bottom-4 duration-700">
        <div className="inline-flex items-center justify-center p-3 bg-primary/10 rounded-2xl mb-4 text-primary">
          <CalendarDays className="w-8 h-8" />
        </div>
        <h1 className="text-3xl md:text-4xl font-black text-transparent bg-clip-text bg-gradient-to-r from-primary to-purple-600 mb-3 tracking-tight">
          Lịch Chiếu Phim
        </h1>
        <p className="text-muted-foreground font-medium max-w-lg">
          Cập nhật lịch chiếu phim mới nhất tại các cụm rạp CineBooking trên toàn quốc
        </p>
      </div>

      {/* Tái sử dụng nguyên xi Component Lịch chiếu cực đẹp từ trang chủ */}
      {loadingTheater ? (
        <ShowtimeSectionSkeleton />
      ) : (
        <div className="animate-in fade-in duration-700 delay-150">
          <ShowtimeSection
            cinemas={listTheater.theaters}
            selectedCity={selectedCity}
            onCityChange={handleCityChange}
          />
        </div>
      )}

    </main>
  )
}
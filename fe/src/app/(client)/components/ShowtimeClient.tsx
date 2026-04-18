'use client'

import {
  useState,
  useMemo,
  useCallback,
  MouseEvent as ReactMouseEvent,
  useRef,
  useEffect,
} from 'react'
import { MapPin, Search, Loader2, CalendarDays } from 'lucide-react'
import { Card } from '@/components/ui/card'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { Input } from '@/components/ui/input'
import type { Theater } from '@/types/theater'
import type { Schedule } from '@/types/schedule'
import type { Movie } from '@/types/movie'
import { useSchedules } from '@/lib/api/schedules'
import { VIETNAM_CITIES } from '@/constants/location'
import MovieShowtimeCard from '@/app/(client)/showtimes/components/MovieShowtimeCard'
import { useDebounce } from '@/hooks/useDebounce'

interface ShowtimeClientProps {
  cinemas: Theater[]
  selectedCity: string
  onCityChange: (city: string) => void
}

type GroupedMovieSchedule = {
  uniqueKey: string
  date: string
  movie: Movie
  schedules: Schedule[]
}

export default function ShowtimeClient({
  cinemas,
  selectedCity,
  onCityChange,
}: ShowtimeClientProps) {
  const [searchCinema, setSearchCinema] = useState('')
  const debouncedSearchCinema = useDebounce(searchCinema, 300)
  const [selectedDate, setSelectedDate] = useState<string | undefined>(undefined)

  const dateScrollRef = useRef<HTMLDivElement>(null)
  const [isDragging, setIsDragging] = useState(false)
  const [startX, setStartX] = useState(0)
  const [scrollLeft, setScrollLeft] = useState(0)

  // Filtered cinemas
  const filteredCinemas = useMemo(() => {
    if (!cinemas) return []
    const lowerSearch = debouncedSearchCinema.toLowerCase()
    return cinemas.filter(
      c => c.city === selectedCity && c.name.toLowerCase().includes(lowerSearch)
    )
  }, [cinemas, selectedCity, debouncedSearchCinema])

  const defaultCinemaId = useMemo(() => {
    return filteredCinemas.length > 0 ? filteredCinemas[0]._id : ''
  }, [filteredCinemas])

  const [selectedCinemaId, setSelectedCinemaId] = useState<string>(defaultCinemaId)

  // Auto-select first cinema when filtered list changes
  useEffect(() => {
    if (defaultCinemaId && !selectedCinemaId) {
      setSelectedCinemaId(defaultCinemaId)
    }
  }, [defaultCinemaId, selectedCinemaId])

  const selectedCinema = useMemo(() => {
    return filteredCinemas.find(c => c._id === selectedCinemaId) || null
  }, [filteredCinemas, selectedCinemaId])

  // Handlers
  const handleSearchChange = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    setSearchCinema(e.target.value)
  }, [])

  const handleCityChange = useCallback(
    (city: string) => {
      onCityChange(city)
      setSearchCinema('')
      setSelectedCinemaId('')
    },
    [onCityChange]
  )

  const handleCinemaSelect = useCallback((id: string) => {
    setSelectedCinemaId(id)
  }, [])

  const handleDateSelect = useCallback((dateValue: string | undefined) => {
    setSelectedDate(dateValue)
  }, [])

  // Drag handlers
  const handleMouseDown = useCallback((e: ReactMouseEvent<HTMLDivElement>) => {
    if (!dateScrollRef.current) return
    setIsDragging(true)
    setStartX(e.pageX - dateScrollRef.current.offsetLeft)
    setScrollLeft(dateScrollRef.current.scrollLeft)
  }, [])

  const handleMouseMove = useCallback(
    (e: ReactMouseEvent<HTMLDivElement>) => {
      if (!isDragging || !dateScrollRef.current) return
      e.preventDefault()
      const x = e.pageX - dateScrollRef.current.offsetLeft
      const walk = (x - startX) * 0.7
      dateScrollRef.current.scrollLeft = scrollLeft - walk
    },
    [isDragging, startX, scrollLeft]
  )

  const handleMouseUpOrLeave = useCallback(() => {
    setIsDragging(false)
  }, [])

  // Fetch schedules với params từ API
  const { data: scheduleData, isFetching: isLoadingSchedules } = useSchedules({
    theaterId: selectedCinemaId,
    showDate: selectedDate, // YYYY-MM-DD
  })

  const schedules = useMemo(() => {
    return scheduleData?.schedules || []
  }, [scheduleData])

  // Group schedules by movie + date
  const groupedData = useMemo(() => {
    const groups: Record<string, GroupedMovieSchedule> = {}

    schedules.forEach(schedule => {
      const dateKey = schedule.showDate.split('T')[0]
      const movieId = schedule.movie._id
      const uniqueKey = `${movieId}_${dateKey}`

      if (!groups[uniqueKey]) {
        groups[uniqueKey] = {
          uniqueKey,
          date: dateKey,
          movie: schedule.movie,
          schedules: [],
        }
      }
      groups[uniqueKey].schedules.push(schedule)
    })

    return Object.values(groups).sort((a, b) => {
      if (a.date !== b.date) {
        return a.date.localeCompare(b.date)
      }
      return a.movie.title.localeCompare(b.movie.title)
    })
  }, [schedules])

  // Generate dates
  const dates = useMemo(() => {
    const days = []
    const today = new Date()

    days.push({ label: 'Tất cả', displayDate: 'All', value: undefined })

    for (let i = 0; i < 12; i++) {
      const date = new Date(today)
      date.setDate(today.getDate() + i)
      const value = date.toISOString().split('T')[0] // YYYY-MM-DD
      const label =
        i === 0 ? 'Hôm nay' : new Intl.DateTimeFormat('vi-VN', { weekday: 'short' }).format(date)
      const displayDate = new Intl.DateTimeFormat('vi-VN', {
        day: '2-digit',
        month: '2-digit',
      }).format(date)
      days.push({ value, label, displayDate })
    }
    return days
  }, [])

  return (
    <>
      {/* Top Toolbar */}
      <div className="flex flex-col md:flex-row flex-wrap gap-4 mb-6 pb-6 border-b border-border">
        <div className="flex items-center gap-2">
          <MapPin className="w-5 h-5 text-muted-foreground shrink-0" />
          <Select value={selectedCity} onValueChange={handleCityChange}>
            <SelectTrigger className="w-[160px] sm:w-[180px] rounded-2xl border-border bg-muted">
              <SelectValue placeholder="Chọn thành phố" />
            </SelectTrigger>
            <SelectContent>
              {VIETNAM_CITIES.map(city => (
                <SelectItem key={city} value={city}>
                  {city}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        <div className="flex-1 min-w-[200px]">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
            <Input
              type="text"
              placeholder="Tìm theo tên rạp..."
              value={searchCinema}
              onChange={handleSearchChange}
              className="w-full bg-muted border-border rounded-full pl-10"
            />
          </div>
        </div>
      </div>

      {/* City Quick Tabs */}
      <div className="flex gap-2 mb-6 overflow-x-auto pb-2 scrollbar-hide -mx-4 px-4 md:mx-0 md:px-0">
        {VIETNAM_CITIES.slice(0, 5).map(city => (
          <button
            key={city}
            onClick={() => handleCityChange(city)}
            className={`px-4 sm:px-6 py-2 rounded-full text-sm whitespace-nowrap transition-all ${
              selectedCity === city
                ? 'bg-primary text-primary-foreground shadow'
                : 'bg-muted text-muted-foreground hover:bg-primary/10 hover:text-foreground'
            }`}
          >
            {city}
          </button>
        ))}
      </div>

      {/* Main Layout */}
      <div className="grid grid-cols-1 lg:grid-cols-[280px_1fr] gap-6 lg:gap-8">
        {/* Left: Cinema List */}
        <div className="space-y-3 max-h-[400px] lg:max-h-[600px] overflow-y-auto pr-1 custom-scrollbar">
          {filteredCinemas.length > 0 ? (
            filteredCinemas.map(cinema => (
              <button
                key={cinema._id}
                onClick={() => handleCinemaSelect(cinema._id)}
                className={`w-full text-left p-3 sm:p-4 rounded-2xl transition-all border-2 ${
                  selectedCinemaId === cinema._id
                    ? 'bg-primary/5 border-primary shadow-sm'
                    : 'border-transparent hover:bg-muted'
                }`}
              >
                <div className="flex items-center gap-3">
                  <div
                    className={`w-10 h-10 rounded-xl flex items-center justify-center shrink-0 ${
                      selectedCinemaId === cinema._id
                        ? 'bg-primary text-white'
                        : 'bg-muted text-muted-foreground'
                    }`}
                  >
                    <span className="font-bold">{cinema.name.charAt(0)}</span>
                  </div>
                  <div className="min-w-0 flex-1">
                    <h5
                      className={`truncate font-medium text-sm sm:text-base ${
                        selectedCinemaId === cinema._id ? 'text-primary' : 'text-foreground'
                      }`}
                    >
                      {cinema.name}
                    </h5>
                    <p className="text-xs text-muted-foreground truncate">{cinema.address}</p>
                  </div>
                </div>
              </button>
            ))
          ) : (
            <p className="text-center text-muted-foreground py-4 text-sm">
              Không tìm thấy rạp nào.
            </p>
          )}
        </div>

        {/* Right: Date & Showtimes */}
        <div className="space-y-6 min-w-0">
          {/* Date Selector */}
          <div
            ref={dateScrollRef}
            onMouseDown={handleMouseDown}
            onMouseMove={handleMouseMove}
            onMouseUp={handleMouseUpOrLeave}
            onMouseLeave={handleMouseUpOrLeave}
            className={`flex gap-2 overflow-x-auto pb-2 scrollbar-hide -mx-4 px-4 sm:mx-0 sm:px-0 select-none ${
              isDragging ? 'cursor-grabbing' : 'cursor-grab'
            }`}
          >
            {dates.map(date => (
              <button
                key={date.value || 'all'}
                onClick={() => handleDateSelect(date.value)}
                className={`flex-shrink-0 w-16 sm:w-20 py-2 sm:py-3 rounded-xl text-center transition-all border ${
                  selectedDate === date.value
                    ? 'bg-primary text-primary-foreground border-primary shadow'
                    : 'bg-muted text-muted-foreground border-transparent hover:bg-primary/10'
                }`}
              >
                <div className="text-[10px] sm:text-xs capitalize opacity-90">{date.label}</div>
                <div className="font-bold text-sm sm:text-lg">{date.displayDate}</div>
              </button>
            ))}
          </div>

          {/* Showtimes Content */}
          {!selectedCinemaId || !selectedCinema ? (
            <div className="text-center py-16 bg-surface border border-border rounded-2xl flex flex-col items-center justify-center gap-4">
              <div className="w-16 h-16 rounded-full bg-muted flex items-center justify-center">
                <MapPin className="w-8 h-8 text-muted-foreground" />
              </div>
              <div>
                <h3 className="text-lg font-bold text-foreground">Chưa chọn rạp chiếu</h3>
                <p className="text-muted-foreground">Vui lòng chọn rạp để xem lịch chiếu.</p>
              </div>
            </div>
          ) : (
            <div className="space-y-4">
              {/* Selected Cinema Header */}
              <Card className="p-4 rounded-2xl bg-primary/5 border-primary/20">
                <div className="flex items-start gap-3">
                  <div className="w-12 h-12 rounded-xl bg-primary flex items-center justify-center shrink-0">
                    <span className="text-white font-bold text-lg">
                      {selectedCinema.name.charAt(0)}
                    </span>
                  </div>
                  <div>
                    <h3 className="font-semibold text-lg text-foreground">{selectedCinema.name}</h3>
                    <p className="text-sm text-muted-foreground">{selectedCinema.address}</p>
                  </div>
                </div>
              </Card>

              {/* Schedules */}
              {isLoadingSchedules ? (
                <div className="flex flex-col items-center justify-center py-12 text-muted-foreground">
                  <Loader2 className="w-8 h-8 animate-spin mb-2" />
                  <p>Đang tải lịch chiếu...</p>
                </div>
              ) : groupedData.length > 0 ? (
                <div className="space-y-4">
                  {groupedData.map(({ uniqueKey, movie, schedules, date }) => (
                    <div key={uniqueKey} className="flex flex-col gap-2">
                      {!selectedDate && (
                        <span className="text-sm font-bold text-muted-foreground ml-1">
                          Ngày: {new Date(date).toLocaleDateString('vi-VN')}
                        </span>
                      )}
                      <MovieShowtimeCard movie={movie} schedules={schedules} />
                    </div>
                  ))}
                </div>
              ) : (
                <div className="text-center py-12 bg-muted/30 rounded-2xl border border-dashed border-border">
                  <CalendarDays className="w-12 h-12 mx-auto text-muted-foreground/50 mb-3" />
                  <p className="text-muted-foreground text-sm sm:text-base">
                    Không có suất chiếu nào vào ngày này.
                  </p>
                </div>
              )}
            </div>
          )}
        </div>
      </div>
    </>
  )
}

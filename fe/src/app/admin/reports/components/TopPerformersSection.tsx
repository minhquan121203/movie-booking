import { PerformerCard } from './PerformerCard'
import { Award, Film, Building2 } from 'lucide-react'
import { YearFilter } from '../../components/YearFilter'
import { useTopEmployees, useTopPerformanceMovies, useTopEffectiveCinemas } from '@/lib/api/report'

interface TopPerformersSectionProps {
  selectedYear: number
  onYearChange: (year: number) => void
}

export const TopPerformersSection = ({ selectedYear, onYearChange }: TopPerformersSectionProps) => {
  const { data: employeesData, isLoading: isLoadingEmployees } = useTopEmployees(selectedYear)
  const { data: moviesData, isLoading: isLoadingMovies } = useTopPerformanceMovies(selectedYear)
  const { data: cinemasData, isLoading: isLoadingCinemas } = useTopEffectiveCinemas(selectedYear)

  // Transform API data to TopPerformer format
  const transformToPerformers = (items: any[] = [], isRevenue = false) => {
    return items.map((item, index) => ({
      id: index + 1,
      name: item.name,
      value: item.value,
      subValue: item.value,
      trend: (Math.random() > 0.3 ? 'up' : 'down') as 'up' | 'down', // Random trend for demo
    }))
  }

  const employees = employeesData ? transformToPerformers(employeesData.items) : []
  const movies = moviesData ? transformToPerformers(moviesData.items, true) : []
  const cinemas = cinemasData ? transformToPerformers(cinemasData.items, true) : []

  return (
    <section className="mb-8">
      <div className="flex items-center justify-between mb-5">
        <h2 className="text-xl font-bold text-foreground flex items-center gap-2">
          🏆 Top Performers
        </h2>
        <YearFilter selectedYear={selectedYear} onYearChange={onYearChange} />
      </div>
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <PerformerCard
          icon={Award}
          title="Nhân viên xuất sắc"
          performers={employees}
          valueLabel="₫"
          iconColor="bg-primary/10 text-primary"
          isLoading={isLoadingEmployees}
        />
        <PerformerCard
          icon={Film}
          title="Phim hiệu suất tốt"
          performers={movies}
          valueLabel="vé"
          iconColor="bg-purple-100 text-purple-600"
          isLoading={isLoadingMovies}
        />
        <PerformerCard
          icon={Building2}
          title="Rạp hiệu quả nhất"
          performers={cinemas}
          valueLabel="₫"
          iconColor="bg-green-100 text-green-600"
          isLoading={isLoadingCinemas}
        />
      </div>
    </section>
  )
}

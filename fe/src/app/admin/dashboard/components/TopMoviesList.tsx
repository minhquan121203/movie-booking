'use client'
import { motion } from 'framer-motion'
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { topMovies } from '../constants/mockData'

export function TopMoviesList() {
  return (
    <Card className="border-none shadow-sm bg-gray-50">
      <CardHeader>
        <CardTitle>Top Phim Xem Nhiều</CardTitle>
        <CardDescription>Xếp hạng theo lượt xem tháng này</CardDescription>
      </CardHeader>
      <CardContent className="space-y-6">
        {topMovies.map((movie, index) => (
          <div key={index} className="space-y-2">
            <div className="flex justify-between text-sm">
              <span className="font-medium text-gray-700 truncate max-w-[180px]" title={movie.name}>
                {index + 1}. {movie.name}
              </span>
              <span className="text-gray-500 text-xs">{movie.views.toLocaleString()} vé</span>
            </div>
            <div className="h-2 w-full bg-gray-100 rounded-full overflow-hidden">
              <motion.div
                initial={{ width: 0 }}
                animate={{ width: `${movie.percent}%` }}
                transition={{ duration: 1, delay: 0.5 + index * 0.1 }}
                className="h-full bg-gradient-to-r from-primary to-purple-400 rounded-full"
              />
            </div>
          </div>
        ))}
        <Button variant="outline" className="w-full text-xs h-9">
          Xem chi tiết báo cáo
        </Button>
      </CardContent>
    </Card>
  )
}

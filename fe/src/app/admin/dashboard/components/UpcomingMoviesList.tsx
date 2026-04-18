import { Film } from 'lucide-react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { upcomingMovies } from '../constants/mockData'

export function UpcomingMoviesList() {
  return (
    <Card className="border-none shadow-sm h-full bg-gray-50">
      <CardHeader>
        <CardTitle>Phim Sắp Chiếu</CardTitle>
      </CardHeader>
      <CardContent>
        <div className="space-y-4">
          Chức năng đang phát triển
          {/* {upcomingMovies.map((movie) => (
            <div key={movie.id} className="flex items-center justify-between p-3 bg-gray-50 rounded-xl hover:bg-gray-100 transition-colors">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-lg bg-primary/10 flex items-center justify-center text-primary">
                  <Film className="w-5 h-5" />
                </div>
                <div>
                  <p className="font-medium text-sm text-gray-900">{movie.title}</p>
                  <p className="text-xs text-gray-500">{movie.genre} • {movie.releaseDate}</p>
                </div>
              </div>
              <Badge variant="outline" className="bg-white text-xs">{movie.status}</Badge>
            </div>
          ))} */}
        </div>
      </CardContent>
    </Card>
  )
}

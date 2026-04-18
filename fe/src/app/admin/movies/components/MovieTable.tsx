import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Edit, Trash2, Star, Eye } from 'lucide-react'
import { Movie } from '@/types/movie'
import Image from 'next/image'

interface MovieTableProps {
  movies: Movie[]
  isLoading: boolean
  onEdit: (movie: Movie) => void
  onDelete: (id: string) => void
}

export function MovieTable({ movies, isLoading, onEdit, onDelete }: MovieTableProps) {
  if (isLoading) {
    return <div className="text-center py-10">Đang tải dữ liệu...</div>
  }

  if (movies.length === 0) {
    return <div className="text-center py-10 text-gray-500">Không tìm thấy phim nào.</div>
  }

  return (
    <div className="bg-white border border-gray-200 rounded-xl overflow-hidden shadow-sm">
      <Table>
        <TableHeader className="bg-gray-50/50 ">
          <TableRow className="hover:bg-gray-100/50!">
            <TableHead className="w-[80px]">Poster</TableHead>
            <TableHead>Thông tin phim</TableHead>
            <TableHead>Thể loại</TableHead>
            <TableHead className="text-center">Chỉ số</TableHead>
            <TableHead className="text-center">Trạng thái</TableHead>
            <TableHead className="text-right">Thao tác</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {movies.map(movie => (
            <TableRow key={movie._id} className="hover:bg-gray-50/50 transition-colors">
              <TableCell>
                <div className="relative w-12 h-16 rounded-md overflow-hidden bg-gray-100 border border-gray-200">
                  <Image
                    src={movie.posterUrl || '/placeholder-movie.png'}
                    alt={movie.title}
                    fill
                    className="object-cover"
                  />
                </div>
              </TableCell>
              <TableCell>
                <div className="font-medium text-gray-900">{movie.title}</div>
                <div className="text-xs text-gray-500 mt-1">
                  {movie.duration} phút • {new Date(movie.releaseDate).toLocaleDateString('vi-VN')}
                </div>
              </TableCell>
              <TableCell className="text-gray-600 max-w-[200px]">
                <div className="flex flex-wrap gap-1">
                  {/* Map genres: Xử lý trường hợp genre là object hoặc string ID */}
                  {movie.genres?.map((g: any) => (
                    <Badge
                      key={g._id || g}
                      variant="secondary"
                      className="text-[10px] px-1.5 h-5 font-normal bg-gray-100 text-gray-600"
                    >
                      {typeof g === 'string' ? 'Thể loại' : g.name}
                    </Badge>
                  ))}
                </div>
              </TableCell>
              <TableCell>
                <div className="flex flex-col gap-1 items-center">
                  <div className="flex items-center gap-1 text-yellow-600 bg-yellow-50 px-2 py-0.5 rounded-full text-xs font-medium">
                    <Star className="w-3 h-3 fill-yellow-500" />{' '}
                    {movie.averageRating?.toFixed(1) || 0}
                  </div>
                  <div className="flex items-center gap-1 text-blue-600 bg-blue-50 px-2 py-0.5 rounded-full text-xs font-medium">
                    <Eye className="w-3 h-3" /> {movie.viewCount || 0}
                  </div>
                </div>
              </TableCell>
              <TableCell className="text-center">
                <Badge
                  className={`whitespace-nowrap ${
                    movie.status === 'Đang chiếu'
                      ? 'bg-green-100 text-green-700 hover:bg-green-100'
                      : movie.status === 'Sắp chiếu'
                        ? 'bg-orange-100 text-orange-700 hover:bg-orange-100'
                        : 'bg-gray-100 text-gray-600 hover:bg-gray-100'
                  }`}
                >
                  {movie.status}
                </Badge>
              </TableCell>
              <TableCell className="text-right">
                <div className="flex justify-end gap-2">
                  <Button
                    size="icon"
                    variant="ghost"
                    className="h-8 w-8 text-blue-600 hover:text-blue-700 hover:bg-blue-50"
                    onClick={() => onEdit(movie)}
                  >
                    <Edit className="w-4 h-4" />
                  </Button>
                  <Button
                    size="icon"
                    variant="ghost"
                    className="h-8 w-8 text-red-600 hover:text-red-700 hover:bg-red-50"
                    onClick={() => onDelete(movie._id)}
                  >
                    <Trash2 className="w-4 h-4" />
                  </Button>
                </div>
              </TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>
    </div>
  )
}

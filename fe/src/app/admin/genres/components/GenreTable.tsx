import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table'
import { Button } from '@/components/ui/button'
import { Edit, Trash2 } from 'lucide-react'
import { Genre } from '@/types/genre'
import { Badge } from '@/components/ui/badge'

interface GenreTableProps {
  genres: Genre[] | []
  isLoading: boolean
  onEdit: (genre: Genre) => void
  onDelete: (id: string) => void
}

export function GenreTable({ genres, isLoading, onEdit, onDelete }: GenreTableProps) {
  if (isLoading) {
    return <div className="text-center py-10 text-gray-500">Đang tải dữ liệu...</div>
  }

  if (genres.length === 0) {
    return <div className="text-center py-10 text-gray-500">Không có dữ liệu.</div>
  }

  return (
    <div className="bg-white border border-gray-200 rounded-xl overflow-hidden shadow-sm">
      <Table>
        <TableHeader className="bg-gray-50/50">
          <TableRow>
            <TableHead className="w-[50px] text-center">STT</TableHead>
            <TableHead>Tên Thể Loại</TableHead>
            <TableHead>Mô Tả</TableHead>
            <TableHead className="text-center">Icon/Màu</TableHead>
            <TableHead className="text-center">Ngày Tạo</TableHead>
            <TableHead className="text-right">Hành Động</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {genres.map((genre, index) => (
            <TableRow key={genre._id} className="hover:bg-gray-50/50 transition-colors">
              <TableCell className="text-center font-medium">{index + 1}</TableCell>
              <TableCell className="font-semibold text-gray-900">{genre.name}</TableCell>
              <TableCell className="text-gray-500 max-w-[300px] truncate" title={genre.description}>
                {genre.description || '-'}
              </TableCell>
              <TableCell className="text-center">
                <div className="flex justify-center items-center gap-2">
                  <span className="text-xl">{genre.icon}</span>
                  {genre.color && (
                    <div
                      className="w-4 h-4 rounded-full border border-gray-200"
                      style={{ backgroundColor: genre.color }}
                    />
                  )}
                </div>
              </TableCell>
              <TableCell className="text-center text-gray-500 text-sm">
                {new Date(genre.createdAt || '--').toLocaleDateString('vi-VN')}
              </TableCell>
              <TableCell className="text-right">
                <div className="flex justify-end gap-2">
                  <Button
                    size="icon"
                    variant="ghost"
                    className="h-8 w-8 text-blue-600 hover:text-blue-700 hover:bg-blue-50"
                    onClick={() => onEdit(genre)}
                  >
                    <Edit className="w-4 h-4" />
                  </Button>
                  <Button
                    size="icon"
                    variant="ghost"
                    className="h-8 w-8 text-red-600 hover:text-red-700 hover:bg-red-50"
                    onClick={() => onDelete(genre._id)}
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

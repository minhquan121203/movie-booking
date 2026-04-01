import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table'
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Eye, Trash2, Building2, Pencil } from 'lucide-react'
import { User } from '@/types/user'

interface UserTableProps {
  users: User[]
  onViewDetail: (user: User) => void
  onDelete: (id: string) => void
  onAssignTheater?: (user: User) => void
  onEdit?: (user: User) => void 
  showAssignTheater?: boolean
}

export function UserTable({
  users,
  onViewDetail,
  onDelete,
  onAssignTheater,
  onEdit, // Nhận prop
  showAssignTheater = false,
}: UserTableProps) {
  if (users.length === 0)
    return <div className="text-center py-10 text-gray-500">Không có người dùng nào.</div>

  return (
    <div className="bg-white border border-gray-200 rounded-xl overflow-hidden shadow-sm">
      <Table>
        <TableHeader className="bg-gray-50/50 ">
          <TableRow className="hover:bg-gray-100/50!">
            <TableHead>Người Dùng</TableHead>
            <TableHead>Email</TableHead>
            <TableHead>SĐT</TableHead>
            <TableHead>Vai Trò</TableHead>
            {showAssignTheater && <TableHead>Rạp</TableHead>}
            <TableHead>Trạng Thái</TableHead>
            <TableHead className="text-right">Thao Tác</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {users.map(user => (
            <TableRow key={user._id} className="hover:bg-gray-100/50!">
              <TableCell>
                <div className="flex items-center gap-3">
                  <Avatar className="w-9 h-9 border border-gray-100">
                    <AvatarImage src={user.profilePicture} alt={user.fullName} />
                    <AvatarFallback className="bg-primary/10 text-primary">
                      {user.fullName?.charAt(0).toUpperCase()}
                    </AvatarFallback>
                  </Avatar>
                  <span className="font-medium text-gray-900">{user.fullName}</span>
                </div>
              </TableCell>
              <TableCell className="text-gray-600">{user.email}</TableCell>
              <TableCell className="text-gray-600">{user.phoneNumber || '-'}</TableCell>
              <TableCell>
                <Badge
                  variant={user.role === 'admin' ? 'destructive' : 'outline'}
                  className="capitalize text-gray-950"
                >
                  {user.role}
                </Badge>
              </TableCell>
              {showAssignTheater && (
                <TableCell className="text-gray-600">
                  {user.staffInfo?.assignedTheater ? (
                    <div className="flex flex-col">
                      <span className="font-medium">{user.staffInfo.assignedTheater.name}</span>
                    </div>
                  ) : (
                    <span className="text-gray-400 italic">Chưa gắn</span>
                  )}
                </TableCell>
              )}
              <TableCell>
                <Badge
                  className={
                    user.isActive ? 'bg-green-100 text-green-700' : 'bg-red-100 text-red-700'
                  }
                >
                  {user.isActive ? 'Hoạt động' : 'Khóa'}
                </Badge>
              </TableCell>
              <TableCell className="text-right">
                <div className="flex justify-end gap-2">
                  <Button
                    size="icon"
                    variant="ghost"
                    className="h-8 w-8 text-blue-600 hover:bg-blue-50"
                    onClick={() => onViewDetail(user)}
                    title="Xem chi tiết"
                  >
                    <Eye className="w-4 h-4" />
                  </Button>
                  
                  {onEdit && (
                    <Button
                      size="icon"
                      variant="ghost"
                      className="h-8 w-8 text-orange-600 hover:bg-orange-50"
                      onClick={() => onEdit(user)}
                      title="Sửa thông tin"
                    >
                      <Pencil className="w-4 h-4" />
                    </Button>
                  )}

                  {showAssignTheater && onAssignTheater && (
                    <Button
                      size="icon"
                      variant="ghost"
                      className="h-8 w-8 text-purple-600 hover:bg-purple-50"
                      onClick={() => onAssignTheater(user)}
                      title="Gắn rạp"
                    >
                      <Building2 className="w-4 h-4" />
                    </Button>
                  )}
                  <Button
                    size="icon"
                    variant="ghost"
                    className="h-8 w-8 text-red-600 hover:bg-red-50"
                    onClick={() => onDelete(user._id)}
                    title="Xóa"
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
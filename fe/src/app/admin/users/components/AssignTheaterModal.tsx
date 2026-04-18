import { useState, useEffect } from 'react'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'
import { Button } from '@/components/ui/button'
import { Label } from '@/components/ui/label'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { useTheaters } from '@/lib/api/theaters'
import { useUserMutations } from '../hooks/useUserMutations'
import { User } from '@/types/user'

interface AssignTheaterModalProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  staff: User | null
}

export function AssignTheaterModal({ open, onOpenChange, staff }: AssignTheaterModalProps) {
  const [selectedTheaterId, setSelectedTheaterId] = useState<string>('')
  const { data: theaters } = useTheaters({ limit: 100 })
  const { assignTheaterMutation } = useUserMutations()

  useEffect(() => {
    if (open && staff?.staffInfo?.assignedTheater?._id) {
      setSelectedTheaterId(staff.staffInfo.assignedTheater._id)
    } else {
      setSelectedTheaterId('')
    }
  }, [open, staff])

  const handleSubmit = async () => {
    if (!staff?._id || !selectedTheaterId) return

    await assignTheaterMutation.mutateAsync({
      staffId: staff._id,
      theaterId: selectedTheaterId,
    })
    onOpenChange(false)
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[425px] bg-gray-50">
        <DialogHeader>
          <DialogTitle>Gắn Rạp Cho Nhân Viên</DialogTitle>
          <DialogDescription>
            Chọn rạp phim để gắn cho nhân viên {staff?.fullName}
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4 py-4">
          <div className="space-y-2">
            <Label htmlFor="theater">Rạp Phim</Label>
            <Select value={selectedTheaterId} onValueChange={setSelectedTheaterId}>
              <SelectTrigger id="theater" className="bg-white">
                <SelectValue placeholder="Chọn rạp phim" />
              </SelectTrigger>
              <SelectContent className="max-h-[300px] overflow-y-auto">
                {theaters?.theaters?.map((theater: any) => (
                  <SelectItem key={theater._id} value={theater._id}>
                    {theater.name} - {theater.city}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          {staff?.staffInfo?.assignedTheater && (
            <div className="text-sm text-gray-600 bg-blue-50 p-3 rounded-lg">
              <strong>Rạp hiện tại:</strong> {staff.staffInfo.assignedTheater.name}
            </div>
          )}
        </div>

        <div className="flex justify-end gap-3">
          <Button
            variant="outline"
            onClick={() => onOpenChange(false)}
            disabled={assignTheaterMutation.isPending}
          >
            Hủy
          </Button>
          <Button
            onClick={handleSubmit}
            disabled={!selectedTheaterId || assignTheaterMutation.isPending}
            className="bg-primary hover:bg-primary/90"
          >
            {assignTheaterMutation.isPending ? 'Đang xử lý...' : 'Xác nhận'}
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  )
}

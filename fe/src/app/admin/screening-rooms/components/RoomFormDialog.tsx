import { useEffect } from 'react'
import { useForm } from 'react-hook-form'
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { Loader2 } from 'lucide-react'
import { Theater, Room } from '@/types/theater'
import { useRoomMutations } from '../hooks/useRoomMutations'
import { generateSeatMap } from '@/lib/api/rooms'
import { TheaterComboboxForm } from '../../components/TheaterComboboxForm'

export interface FlatRoom extends Room {
  theater: Theater
  _id: string
}

interface RoomFormDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  roomToEdit?: FlatRoom | null
  theaters: Theater[]
}

export function RoomFormDialog({ open, onOpenChange, roomToEdit, theaters }: RoomFormDialogProps) {
  const { createMutation, updateMutation } = useRoomMutations()
  const isEditMode = !!roomToEdit
  const isLoading = createMutation.isPending || updateMutation.isPending

  const { register, handleSubmit, reset, setValue, watch } = useForm({
    defaultValues: {
      roomName: '',
      theaterId: '',
      roomType: '2D',
      screenType: 'Standard',
      rows: 10,
      seatsPerRow: 12,
      totalSeats: 120,
      isActive: 'true',
    },
  })

  const rows = watch('rows')
  const cols = watch('seatsPerRow')
  const theaterId = watch('theaterId')

  useEffect(() => {
    setValue('totalSeats', rows * cols)
  }, [rows, cols, setValue])

  useEffect(() => {
    if (roomToEdit) {
      setValue('roomName', roomToEdit.roomName)
      setValue('theaterId', roomToEdit.theater._id)
      setValue('roomType', roomToEdit.roomType)
      setValue('screenType', roomToEdit.screenType)
      setValue('rows', roomToEdit.rows)
      setValue('seatsPerRow', roomToEdit.seatsPerRow)
      setValue('totalSeats', roomToEdit.totalSeats)
      setValue('isActive', String(roomToEdit.isActive))
    } else {
      reset({
        roomName: '',
        theaterId: '',
        roomType: '2D',
        screenType: 'Standard',
        rows: 10,
        seatsPerRow: 12,
        totalSeats: 120,
        isActive: 'true',
      })
    }
  }, [roomToEdit, open, reset, setValue])

  const onSubmit = (data: any) => {
    if (!data.theaterId && !isEditMode) {
      return
    }

    const seatMap = generateSeatMap(Number(data.rows), Number(data.seatsPerRow))

    const payload: any = {
      roomName: data.roomName,
      roomType: data.roomType,
      rows: Number(data.rows),
      seatsPerRow: Number(data.seatsPerRow),
      totalSeats: Number(data.totalSeats),
      screenType: data.screenType,
      isActive: data.isActive === 'true',
      seatMap: seatMap,
    }

    if (isEditMode && roomToEdit) {
      updateMutation.mutate(
        { theaterId: roomToEdit.theater._id, roomId: roomToEdit._id, data: payload },
        { onSuccess: () => onOpenChange(false) }
      )
    } else {
      createMutation.mutate(
        { theaterId: data.theaterId, data: payload },
        { onSuccess: () => onOpenChange(false) }
      )
    }
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[600px] max-h-[90vh] overflow-y-auto bg-gray-50 text-gray-900">
        <DialogHeader>
          <DialogTitle>{isEditMode ? 'Cập Nhật Phòng Chiếu' : 'Thêm Phòng Mới'}</DialogTitle>
        </DialogHeader>

        <form onSubmit={handleSubmit(onSubmit)} className="space-y-4 py-4">
          {/* Tên Phòng */}
          <div className="space-y-2">
            <Label htmlFor="roomName">
              Tên Phòng <span className="text-red-500">*</span>
            </Label>
            <Input
              id="roomName"
              {...register('roomName', { required: true })}
              placeholder="VD: Phòng 1, Screen A"
            />
          </div>

          {/* Rạp Chiếu */}
          <div className="space-y-2">
            <Label htmlFor="theater">
              Rạp Chiếu <span className="text-red-500">*</span>
            </Label>
            {isEditMode ? (
              <Input
                value={roomToEdit?.theater.name || ''}
                disabled
                className="bg-gray-100 cursor-not-allowed"
              />
            ) : (
              <>
                <TheaterComboboxForm
                  theaters={theaters}
                  value={theaterId}
                  onValueChange={val => setValue('theaterId', val)}
                  placeholder="Chọn rạp chiếu..."
                  searchPlaceholder="Tìm kiếm rạp..."
                  showAllOption={false}
                />
                {!theaterId && <p className="text-xs text-red-500">Vui lòng chọn rạp chiếu</p>}
              </>
            )}
          </div>

          {/* Loại Phòng & Công Nghệ */}
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label>Loại Phòng</Label>
              <Select onValueChange={val => setValue('roomType', val)} value={watch('roomType')}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent className="bg-gray-50 text-gray-900">
                  <SelectItem value="2D">2D</SelectItem>
                  <SelectItem value="3D">3D</SelectItem>
                  <SelectItem value="IMAX">IMAX</SelectItem>
                  <SelectItem value="4DX">4DX</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Label>Công Nghệ Màn Hình</Label>
              <Select
                onValueChange={val => setValue('screenType', val)}
                value={watch('screenType')}
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent className="bg-gray-50 text-gray-900">
                  <SelectItem value="Standard">Standard</SelectItem>
                  <SelectItem value="IMAX">IMAX</SelectItem>
                  <SelectItem value="Dolby Atmos">Dolby Atmos</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>

          {/* Cấu hình ghế */}
          <div className="grid grid-cols-3 gap-4">
            <div className="space-y-2">
              <Label>Số Hàng</Label>
              <Input type="number" min="1" {...register('rows')} />
            </div>
            <div className="space-y-2">
              <Label>Số Cột</Label>
              <Input type="number" min="1" {...register('seatsPerRow')} />
            </div>
            <div className="space-y-2">
              <Label>Tổng Ghế</Label>
              <Input type="number" {...register('totalSeats')} readOnly className="bg-gray-100" />
            </div>
          </div>

          {/* Trạng Thái */}
          <div className="space-y-2">
            <Label>Trạng Thái</Label>
            <Select onValueChange={val => setValue('isActive', val)} value={watch('isActive')}>
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent className="bg-gray-50 text-gray-900">
                <SelectItem value="true">Hoạt động</SelectItem>
                <SelectItem value="false">Bảo trì</SelectItem>
              </SelectContent>
            </Select>
          </div>

          {/* Actions */}
          <div className="flex justify-end gap-3 pt-4">
            <Button
              type="button"
              variant="outline"
              onClick={() => onOpenChange(false)}
              disabled={isLoading}
            >
              Hủy
            </Button>
            <Button
              type="submit"
              disabled={isLoading || (!isEditMode && !theaterId)}
              className="bg-blue-600 hover:bg-blue-700 text-white disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {isLoading ? (
                <>
                  <Loader2 className="animate-spin h-4 w-4 mr-2" />
                  Đang lưu...
                </>
              ) : (
                'Lưu'
              )}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  )
}

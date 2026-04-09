'use client'

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
import { Schedule } from '@/types/schedule'
import { useScheduleMutations } from '../hooks/useScheduleMutations'
import { Loader2 } from 'lucide-react'
import { TheaterComboboxForm } from '@/app/admin/components/TheaterComboboxForm'
import type { Movie } from '@/types/movie'
import type { Theater } from '@/types/theater'

interface ScheduleFormDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  scheduleToEdit?: Schedule | null
  movies: Movie[]
  theaters: Theater[]
  isReferenceLoading: boolean
  isReferenceError: boolean
}

export function ScheduleFormDialog({
  open,
  onOpenChange,
  scheduleToEdit,
  movies,
  theaters,
  isReferenceLoading,
  isReferenceError,
}: ScheduleFormDialogProps) {
  const { createMutation, updateMutation } = useScheduleMutations()

  const isSubmitting = createMutation.isPending || updateMutation.isPending

  const { register, handleSubmit, reset, setValue, watch } = useForm({
    defaultValues: {
      movieId: '',
      theaterId: '',
      roomId: '',
      roomName: '',
      showDate: '',
      startTime: '',
      endTime: '',
      standardPrice: 80000,
      vipPrice: 100000,
      couplePrice: 180000,
    },
  })

  const selectedTheaterId = watch('theaterId')
  const currentTheater = theaters.find(t => t._id === selectedTheaterId)
  const rooms = currentTheater?.rooms || []

  // THEO DÕI SỰ THAY ĐỔI CỦA PHIM VÀ GIỜ BẮT ĐẦU
  const selectedMovieId = watch('movieId')
  const startTime = watch('startTime')

  // EFFECT TỰ ĐỘNG TÍNH GIỜ KẾT THÚC
  useEffect(() => {
    // Chỉ tính toán khi người dùng đang thêm mới (không phải edit) 
    // và đã chọn đủ Phim + Giờ bắt đầu
    if (!scheduleToEdit && selectedMovieId && startTime) {
      const selectedMovie = movies.find(m => m._id === selectedMovieId)
      
      if (selectedMovie && selectedMovie.duration) {
        // Tách giờ và phút từ input (VD: "18:30" -> hours=18, mins=30)
        const [hours, mins] = startTime.split(':').map(Number)
        
        // Tạo một object Date tạm thời để cộng phút cho dễ
        const timeObj = new Date()
        timeObj.setHours(hours, mins, 0, 0)

        // Cộng thời lượng phim + 15 phút dọn rạp vào thời gian hiện tại
        timeObj.setMinutes(timeObj.getMinutes() + selectedMovie.duration + 15)
        
        // Format lại thành chuỗi HH:mm để nhét vào input
        const endHours = String(timeObj.getHours()).padStart(2, '0')
        const endMins = String(timeObj.getMinutes()).padStart(2, '0')
        const calculatedEndTime = `${endHours}:${endMins}`
        
        // Tự động điền vào ô Giờ Kết Thúc
        setValue('endTime', calculatedEndTime)
      }
    }
  }, [selectedMovieId, startTime, movies, setValue, scheduleToEdit])


  useEffect(() => {
    if (scheduleToEdit) {
      setValue('movieId', scheduleToEdit.movie._id)
      setValue('theaterId', scheduleToEdit.theater._id)
      setValue('roomId', scheduleToEdit.room.roomName)
      setValue('showDate', new Date(scheduleToEdit.showDate).toISOString().split('T')[0])
      setValue('startTime', scheduleToEdit.startTime)
      setValue('endTime', scheduleToEdit.endTime)
      setValue('standardPrice', scheduleToEdit.ticketPrices.standard)
      setValue('vipPrice', scheduleToEdit.ticketPrices.vip || 0)
    } else {
      reset()
    }
  }, [scheduleToEdit, open, reset, setValue])

  const onSubmit = (data: any) => {
    const selectedMovie = movies.find(m => m._id === data.movieId)
    const selectedRoom = rooms.find((r: any) => r.roomName === data.roomName) || {
      roomName: 'Phòng 1',
      roomType: '2D',
    }

    const payload: any = {
      movieId: data.movieId,
      theaterId: data.theaterId,
      roomId: data.roomId,
      roomName: selectedRoom.roomName,
      roomType: '2D',
      showDate: data.showDate,
      startTime: data.startTime,
      endTime: data.endTime,
      ticketPrices: {
        standard: Number(data.standardPrice),
        vip: Number(data.vipPrice),
        couple: Number(data.couplePrice),
      },
      language: selectedMovie?.language || 'English',
      subtitles: selectedMovie?.subtitles || ['Vietnamese'],
      status: 'Sắp chiếu',
    }

    if (scheduleToEdit) {
      updateMutation.mutate(
        { id: scheduleToEdit._id, data: payload },
        { onSuccess: () => onOpenChange(false) }
      )
    } else {
      createMutation.mutate(payload, { onSuccess: () => onOpenChange(false) })
    }
  }

  if (isReferenceError) {
    return <>Lỗi!</>
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[600px] max-h-[90vh] overflow-y-auto bg-gray-50 text-gray-900 transition-all">
        <DialogHeader>
          <DialogTitle>
            {scheduleToEdit ? 'Cập Nhật Lịch Chiếu' : 'Thêm Lịch Chiếu Mới'}
          </DialogTitle>
        </DialogHeader>

        {isReferenceLoading ? (
          <div className="flex flex-col items-center justify-center py-12 space-y-4">
            <Loader2 className="h-10 w-10 animate-spin text-blue-600" />
            <p className="text-sm text-gray-500 font-medium">Đang tải dữ liệu phim và rạp...</p>
          </div>
        ) : (
          <form onSubmit={handleSubmit(onSubmit)} className="space-y-4 py-4">
            {/* Phim, Rạp, Phòng */}
            <div className="space-y-2">
              <Label>Phim</Label>
              <Select onValueChange={val => setValue('movieId', val)} defaultValue={watch('movieId')}>
                <SelectTrigger><SelectValue placeholder="Chọn phim..." /></SelectTrigger>
                <SelectContent className="bg-gray-100 text-gray-900/90 max-h-[300px] overflow-y-auto">
                  {movies.map(m => <SelectItem key={m._id} value={m._id}>{m.title}</SelectItem>)}
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label>Rạp</Label>
              <TheaterComboboxForm
                theaters={theaters}
                value={watch('theaterId')}
                onValueChange={val => setValue('theaterId', val)}
                placeholder="Chọn rạp chiếu..."
                searchPlaceholder="Tìm kiếm rạp..."
                showAllOption={false}
              />
            </div>

            <div className="space-y-2">
              <Label>Phòng Chiếu</Label>
              <Select onValueChange={val => setValue('roomId', val)} defaultValue={watch('roomId')} disabled={!selectedTheaterId}>
                <SelectTrigger><SelectValue placeholder="Chọn phòng..." /></SelectTrigger>
                <SelectContent className="bg-gray-100 text-gray-900/90 max-h-[300px] overflow-y-auto">
                  {rooms.length > 0 ? (
                    rooms.map((r: any) => <SelectItem key={r._id} value={r._id}>{r.roomName} ({r.roomType})</SelectItem>)
                  ) : (
                    <SelectItem value="mock_room_1">Phòng 1 (2D) - Mock</SelectItem>
                  )}
                </SelectContent>
              </Select>
            </div>

            {/* Ngày Giờ */}
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label>Ngày Chiếu</Label>
                <Input type="date" {...register('showDate')} />
              </div>
              <div className="space-y-2">
                <Label>Giờ Bắt Đầu</Label>
                <Input type="time" {...register('startTime')} />
              </div>
            </div>

            <div className="space-y-2">
              {/* THÊM THÔNG BÁO VÀ KHÓA Ô GIỜ KẾT THÚC */}
              <div className="flex items-center justify-between">
                <Label>Giờ Kết Thúc</Label>
                {selectedMovieId && (
                  <span className="text-xs text-blue-600">
                    (Tự động tính theo thời lượng phim)
                  </span>
                )}
              </div>
              <Input 
                type="time" 
                {...register('endTime')} 
                className="bg-gray-200 cursor-not-allowed" 
                readOnly // Không cho nhân viên sửa tay
              />
            </div>

            {/* Giá Vé */}
            <div className="grid grid-cols-3 gap-4 bg-gray-100 text-gray-900/90">
              <div className="space-y-2"><Label>Giá Thường</Label><Input type="number" {...register('standardPrice')} /></div>
              <div className="space-y-2"><Label>Giá VIP</Label><Input type="number" {...register('vipPrice')} /></div>
              <div className="space-y-2"><Label>Giá Couple</Label><Input type="number" {...register('couplePrice')} /></div>
            </div>

            <div className="flex justify-end gap-3 pt-4">
              <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>Hủy</Button>
              <Button type="submit" disabled={isSubmitting} className="bg-blue-600 hover:bg-blue-700 text-white">
                {isSubmitting ? <Loader2 className="animate-spin h-4 w-4" /> : 'Lưu Lịch'}
              </Button>
            </div>
          </form>
        )}
      </DialogContent>
    </Dialog>
  )
}
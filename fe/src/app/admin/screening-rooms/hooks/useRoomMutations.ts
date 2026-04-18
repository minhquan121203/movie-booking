import { useMutation, useQueryClient } from '@tanstack/react-query'
import type { Seat } from '@/types/theater'
import {
  createRoom,
  updateRoom,
  deleteRoom,
  RoomCreateDTO,
  RoomUpdateDTO,
  updateSeat,
} from '@/lib/api/rooms'
import { toast } from 'sonner'
import { useNotification } from '@/providers/NotificationProvider'

export function useRoomMutations() {
  const queryClient = useQueryClient()
  const { showSuccess, showError } = useNotification()
  const createMutation = useMutation({
    mutationFn: ({ theaterId, data }: { theaterId: string; data: RoomCreateDTO }) =>
      createRoom(theaterId, data),
    onSuccess: () => {
      showSuccess('Tạo thành công!')
      queryClient.invalidateQueries({ queryKey: ['theaters'] }) // Refresh lại theaters để lấy rooms mới
    },
    onError: (error: any) => showError('Lỗi!', error.response?.data?.message),
  })

  const updateMutation = useMutation({
    mutationFn: ({
      theaterId,
      roomId,
      data,
    }: {
      theaterId: string
      roomId: string
      data: RoomUpdateDTO
    }) => updateRoom(theaterId, roomId, data),
    onSuccess: () => {
      showSuccess('Cập nhập thành công!')
      queryClient.invalidateQueries({ queryKey: ['theaters'] })
    },
    onError: (error: any) => showError('Lỗi!', error.response?.data?.message),
  })

  const updateSeatMutation = useMutation({
    mutationFn: ({
      theaterId,
      roomId,
      data,
    }: {
      theaterId: string
      roomId: string
      data: {
        seats: Seat[]
      }
    }) => updateSeat(theaterId, roomId, data),
    onSuccess: () => {
      showSuccess('Cập nhập thành công!')
      queryClient.invalidateQueries({ queryKey: ['theaters'] })
    },
    onError: (error: any) => showError('Lỗi!', error.response?.data?.message),
  })

  const deleteMutation = useMutation({
    mutationFn: ({ theaterId, roomId }: { theaterId: string; roomId: string }) =>
      deleteRoom(theaterId, roomId),
    onSuccess: () => {
      showSuccess('Xoá thành công!')
      queryClient.invalidateQueries({ queryKey: ['theaters'] })
    },
    onError: (error: any) => showError('Lỗi!', error.response?.data?.message),
  })

  return { createMutation, updateMutation, deleteMutation, updateSeatMutation }
}

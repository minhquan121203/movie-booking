// app/(admin)/shift-manager/components/modals/update-assignment-modal.tsx
'use client'

import { useEffect, useCallback } from 'react'
import { useForm, Controller } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import * as z from 'zod'
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from '@/components/ui/dialog'
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
import { Loader2, AlertCircle } from 'lucide-react'
import { toast } from 'sonner'
import { format } from 'date-fns'

// API & Types
import { useAssignmentMutations } from '@/lib/api/shift-assignments'
import { AssignedEmployee, UpdateAssignmentDTO } from '@/types/shift'

// Validation Schema
const updateAssignmentSchema = z
  .object({
    checkInTime: z.string().optional(),
    checkOutTime: z.string().optional(),
    status: z.enum(['assigned', 'working', 'completed', 'absent']),
  })
  .refine(
    data => {
      if (data.checkInTime && data.checkOutTime) {
        return data.checkInTime <= data.checkOutTime
      }
      return true
    },
    {
      message: 'Giờ check-out phải sau giờ check-in',
      path: ['checkOutTime'],
    }
  )

type UpdateAssignmentFormData = z.infer<typeof updateAssignmentSchema>

interface UpdateAssignmentModalProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  employee: AssignedEmployee | null
}

export default function UpdateAssignmentModal({
  open,
  onOpenChange,
  employee,
}: UpdateAssignmentModalProps) {
  // --- API Hooks ---
  const { update } = useAssignmentMutations()

  // --- React Hook Form ---
  const {
    control,
    handleSubmit,
    formState: { errors, isSubmitting },
    reset,
    watch,
  } = useForm<UpdateAssignmentFormData>({
    resolver: zodResolver(updateAssignmentSchema),
    defaultValues: {
      checkInTime: '',
      checkOutTime: '',
      status: 'assigned',
    },
  })

  const currentStatus = watch('status')

  // Populate form when employee changes
  useEffect(() => {
    if (employee && open) {
      // Convert ISO timestamps to time format (HH:mm)
      const checkInTime = employee.checkInTime
        ? format(new Date(employee.checkInTime), 'HH:mm')
        : ''
      const checkOutTime = employee.checkOutTime
        ? format(new Date(employee.checkOutTime), 'HH:mm')
        : ''

      // Determine status based on check-in/out
      let status: 'assigned' | 'working' | 'completed' | 'absent' = 'assigned'
      if (checkOutTime) {
        status = 'completed'
      } else if (checkInTime) {
        status = 'working'
      }

      reset({
        checkInTime,
        checkOutTime,
        status,
      })
    }
  }, [employee, open, reset])

  // --- Handlers ---
  const onSubmit = useCallback(
    async (data: UpdateAssignmentFormData) => {
      if (!employee) return

      try {
        // Convert time strings back to ISO format (use today's date + time)
        const today = format(new Date(), 'yyyy-MM-dd')
        const checkInTime = data.checkInTime
          ? new Date(`${today}T${data.checkInTime}:00`).toISOString()
          : undefined
        const checkOutTime = data.checkOutTime
          ? new Date(`${today}T${data.checkOutTime}:00`).toISOString()
          : undefined

        const payload: UpdateAssignmentDTO = {
          checkInTime,
          checkOutTime,
          status: data.status,
        }

        await update.mutateAsync({
          id: employee.assignmentId,
          data: payload,
        })

        toast.success('Cập nhật thành công!', {
          description: `Đã cập nhật thông tin phân công của ${employee.fullName}`,
        })

        onOpenChange(false)
      } catch (error: any) {
        toast.error('Lỗi khi cập nhật', {
          description: error?.message || 'Vui lòng thử lại',
        })
      }
    },
    [employee, update, onOpenChange]
  )

  const handleCancel = useCallback(() => {
    onOpenChange(false)
  }, [onOpenChange])

  // Get status label
  const getStatusLabel = useCallback((status: string) => {
    switch (status) {
      case 'working':
        return 'Đang làm việc'
      case 'completed':
        return 'Đã hoàn thành'
      case 'absent':
        return 'Vắng mặt'
      default:
        return 'Đã phân công'
    }
  }, [])

  if (!employee) return null

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[480px] bg-white text-gray-900">
        <DialogHeader>
          <DialogTitle className="text-xl font-semibold">Cập nhật Phân Công</DialogTitle>
          <div className="text-sm text-gray-500 mt-1">
            {employee.fullName} • {employee.email}
          </div>
        </DialogHeader>

        <form onSubmit={handleSubmit(onSubmit)}>
          <div className="grid gap-5 py-4">
            {/* Check-in/Check-out Time */}
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="checkInTime">Giờ Check-in</Label>
                <Controller
                  name="checkInTime"
                  control={control}
                  render={({ field }) => (
                    <Input
                      {...field}
                      id="checkInTime"
                      type="time"
                      className={`bg-gray-50 border-gray-200 ${errors.checkInTime ? 'border-red-500' : ''}`}
                    />
                  )}
                />
                {errors.checkInTime && (
                  <p className="text-xs text-red-500 flex items-center gap-1">
                    <AlertCircle className="w-3 h-3" />
                    {errors.checkInTime.message}
                  </p>
                )}
              </div>

              <div className="space-y-2">
                <Label htmlFor="checkOutTime">Giờ Check-out</Label>
                <Controller
                  name="checkOutTime"
                  control={control}
                  render={({ field }) => (
                    <Input
                      {...field}
                      id="checkOutTime"
                      type="time"
                      className={`bg-gray-50 border-gray-200 ${errors.checkOutTime ? 'border-red-500' : ''}`}
                    />
                  )}
                />
                {errors.checkOutTime && (
                  <p className="text-xs text-red-500 flex items-center gap-1">
                    <AlertCircle className="w-3 h-3" />
                    {errors.checkOutTime.message}
                  </p>
                )}
              </div>
            </div>

            {/* Status */}
            <div className="space-y-2">
              <Label htmlFor="status">
                Trạng thái <span className="text-red-500">*</span>
              </Label>
              <Controller
                name="status"
                control={control}
                render={({ field }) => (
                  <Select value={field.value} onValueChange={field.onChange}>
                    <SelectTrigger
                      id="status"
                      className={`bg-gray-50 border-gray-200 ${errors.status ? 'border-red-500' : ''}`}
                    >
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="assigned">{getStatusLabel('assigned')}</SelectItem>
                      <SelectItem value="working">{getStatusLabel('working')}</SelectItem>
                      <SelectItem value="completed">{getStatusLabel('completed')}</SelectItem>
                      <SelectItem value="absent">{getStatusLabel('absent')}</SelectItem>
                    </SelectContent>
                  </Select>
                )}
              />
              {errors.status && (
                <p className="text-xs text-red-500 flex items-center gap-1">
                  <AlertCircle className="w-3 h-3" />
                  {errors.status.message}
                </p>
              )}
            </div>

            {/* Warning for Absent */}
            {currentStatus === 'absent' && (
              <div className="p-3 bg-amber-50 rounded-lg border border-amber-200">
                <p className="text-xs text-amber-900">
                  ⚠️ Đánh dấu vắng mặt sẽ ảnh hưởng đến báo cáo chấm công
                </p>
              </div>
            )}
          </div>

          <DialogFooter className="gap-2">
            <Button type="button" variant="ghost" onClick={handleCancel} disabled={isSubmitting}>
              Hủy
            </Button>
            <Button
              type="submit"
              disabled={isSubmitting}
              className="bg-[#6C63FF] hover:bg-[#5a52e0] text-white min-w-[100px]"
            >
              {isSubmitting ? (
                <>
                  <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                  Đang lưu...
                </>
              ) : (
                'Lưu Thay Đổi'
              )}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  )
}

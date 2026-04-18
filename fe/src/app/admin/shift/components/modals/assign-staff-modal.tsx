// app/(admin)/shift-manager/components/modals/assign-staff-modal.tsx
'use client'

import { useEffect, useMemo, useCallback, useState } from 'react' // Thêm useState
import { useForm, Controller } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import * as z from 'zod'
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
  DialogDescription,
} from '@/components/ui/dialog'
import { Button } from '@/components/ui/button'
import { Label } from '@/components/ui/label'
// Xóa Select imports cũ, thay bằng Command và Popover
import {
  Command,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
  CommandList,
} from "@/components/ui/command"
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover"

import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar'
import { Loader2, AlertCircle, Check, ChevronsUpDown } from 'lucide-react' // Thêm icons
import { toast } from 'sonner'
import { cn } from '@/lib/utils' // Import cn utility

// API & Types
import { useAssignmentMutations } from '@/lib/api/shift-assignments'
import { useUsers } from '@/lib/api/user'
import { ShiftWithEmployees } from '@/types/shift'

// Validation Schema
const assignStaffSchema = z.object({
  userId: z.string().min(1, 'Vui lòng chọn nhân viên'),
})

type AssignStaffFormData = z.infer<typeof assignStaffSchema>

interface AssignStaffModalProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  selectedSchedule?: ShiftWithEmployees | null
  selectedTheaterId: string
}

export default function AssignStaffModal({
  open,
  onOpenChange,
  selectedSchedule,
  selectedTheaterId,
}: AssignStaffModalProps) {
  const { data: usersData, isLoading: isLoadingUsers } = useUsers({ role: 'staff', limit: 100 })
  const { bulkCreate } = useAssignmentMutations()
  
  // State quản lý đóng mở combobox
  const [openCombobox, setOpenCombobox] = useState(false)

  const users = useMemo(() => {
    const allStaffs = usersData?.users || []
    
    return allStaffs.filter(user => {
      // Chỉ dùng isActive thôi vì TypeScript nó chỉ nhận chữ này
      const isUserActive = user.isActive === true;

      // Lọc đúng Rạp
      const userTheaterId = user.staffInfo?.assignedTheater?._id || user.staffInfo?.assignedTheater;
      const isRightTheater = String(userTheaterId) === String(selectedTheaterId);
      
      return isUserActive && isRightTheater;
    })
  }, [usersData, selectedTheaterId])

  // --- React Hook Form ---
  const {
    control,
    handleSubmit,
    formState: { errors, isSubmitting },
    reset,
  } = useForm<AssignStaffFormData>({
    resolver: zodResolver(assignStaffSchema),
    defaultValues: {
      userId: '',
    },
  })

  // Reset form when modal opens
  useEffect(() => {
    if (open) {
      reset({ userId: '' })
      setOpenCombobox(false)
    }
  }, [open, reset])

  // --- Handlers ---
  const onSubmit = useCallback(
    async (data: AssignStaffFormData) => {
      if (!selectedSchedule || !selectedTheaterId) return

      try {
        const payload = {
          theaterId: selectedTheaterId,
          assignments: [
            {
              workScheduleId: selectedSchedule.scheduleId,
              userId: data.userId,
              role: 'staff',
            },
          ],
        }

        await bulkCreate.mutateAsync(payload)

        const user = users.find(u => u._id === data.userId)
        toast.success('Phân công thành công!', {
          description: `Đã phân công ${user?.fullName} vào ca ${selectedSchedule.shift.name}`,
        })

        onOpenChange(false)
      } catch (error: any) {
        toast.error('Lỗi khi phân công', {
          description: error?.message || 'Vui lòng thử lại',
        })
      }
    },
    [selectedSchedule, selectedTheaterId, bulkCreate, onOpenChange, users]
  )

  const handleCancel = useCallback(() => {
    onOpenChange(false)
  }, [onOpenChange])

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[480px] bg-white text-gray-900">
        <DialogHeader>
          <DialogTitle className="text-xl font-semibold">Phân Công Nhân Viên</DialogTitle>
          {selectedSchedule && (
            <DialogDescription className="text-sm text-gray-500 mt-1">
              {selectedSchedule.date} - {selectedSchedule.shift.name} (
              {selectedSchedule.shift.startTime} - {selectedSchedule.shift.endTime})
            </DialogDescription>
          )}
        </DialogHeader>

        <form onSubmit={handleSubmit(onSubmit)}>
          <div className="grid gap-5 py-4">
            {/* Select User via Combobox */}
            <div className="space-y-2 flex flex-col">
              <Label htmlFor="userId">
                Chọn Nhân Viên <span className="text-red-500">*</span>
              </Label>
              
              <Controller
                name="userId"
                control={control}
                render={({ field }) => (
                  <Popover open={openCombobox} onOpenChange={setOpenCombobox}>
                    <PopoverTrigger asChild>
                      <Button
                        variant="outline"
                        role="combobox"
                        aria-expanded={openCombobox}
                        className={cn(
                          "w-full justify-between h-12",
                          !field.value && "text-muted-foreground",
                          errors.userId && "border-red-500"
                        )}
                        disabled={isLoadingUsers}
                      >
                        {field.value
                          ? (() => {
                              const user = users.find((u) => u._id === field.value)
                              return user ? (
                                <div className="flex items-center gap-2">
                                  <Avatar className="h-6 w-6">
                                    <AvatarImage src={user.profilePicture} />
                                    <AvatarFallback className="text-[10px]">
                                      {user.fullName.charAt(0)}
                                    </AvatarFallback>
                                  </Avatar>
                                  <span>{user.fullName}</span>
                                </div>
                              ) : "Chọn nhân viên..."
                            })()
                          : "Tìm kiếm nhân viên..."}
                        <ChevronsUpDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
                      </Button>
                    </PopoverTrigger>
                    <PopoverContent className="w-[430px] p-0" align="start">
                      <Command>
                        <CommandInput placeholder="Tìm tên nhân viên..." />
                        <CommandList>
                          <CommandEmpty>Không tìm thấy nhân viên.</CommandEmpty>
                          <CommandGroup>
                            {users.map((user) => (
                              <CommandItem
                                key={user._id}
                                value={user.fullName} // Search dựa trên value này
                                onSelect={() => {
                                  field.onChange(user._id)
                                  setOpenCombobox(false)
                                }}
                              >
                                <Check
                                  className={cn(
                                    "mr-2 h-4 w-4",
                                    field.value === user._id ? "opacity-100" : "opacity-0"
                                  )}
                                />
                                <div className="flex items-center gap-2">
                                  <Avatar className="h-6 w-6">
                                    <AvatarImage src={user.profilePicture} />
                                    <AvatarFallback className="text-[10px]">
                                      {user.fullName.charAt(0)}
                                    </AvatarFallback>
                                  </Avatar>
                                  <div className="flex flex-col">
                                    <span>{user.fullName}</span>
                                    <span className="text-xs text-muted-foreground">{user.email}</span>
                                  </div>
                                </div>
                              </CommandItem>
                            ))}
                          </CommandGroup>
                        </CommandList>
                      </Command>
                    </PopoverContent>
                  </Popover>
                )}
              />

              {errors.userId && (
                <p className="text-xs text-red-500 flex items-center gap-1">
                  <AlertCircle className="w-3 h-3" />
                  {errors.userId.message}
                </p>
              )}
            </div>

            {/* Info Box */}
            <div className="p-3 bg-blue-50 rounded-lg border border-blue-200">
              <p className="text-xs text-blue-900">
                💡 Nhân viên sẽ nhận thông báo qua email sau khi được phân công
              </p>
            </div>
          </div>

          <DialogFooter className="gap-2">
            <Button type="button" variant="outline" onClick={handleCancel} disabled={isSubmitting}>
              Hủy
            </Button>
            <Button
              type="submit"
              disabled={isSubmitting || isLoadingUsers}
              className="bg-[#6C63FF] hover:bg-[#5a52e0] text-white min-w-[100px]"
            >
              {isSubmitting ? (
                <>
                  <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                  Đang xử lý...
                </>
              ) : (
                'Xác Nhận'
              )}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  )
}
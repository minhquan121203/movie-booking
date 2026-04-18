// app/(admin)/shift-manager/components/modals/update-template-modal.tsx
'use client'

import { useEffect } from 'react'
import { useForm } from 'react-hook-form'
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
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from '@/components/ui/form'
import { ShiftTemplate } from '@/types/shift'
import { ShiftTemplateCreateDTO } from '@/lib/api/shift-templates'

// Zod schema validation
const shiftTemplateSchema = z.object({
  code: z.string().min(1, 'Mã ca không được để trống'),
  name: z.string().min(1, 'Tên ca không được để trống'),
  startTime: z.string().min(1, 'Giờ bắt đầu không được để trống'),
  endTime: z.string().min(1, 'Giờ kết thúc không được để trống'),
  color: z.string().min(1, 'Vui lòng chọn màu sắc'),
  isActive: z.boolean(),
}) satisfies z.ZodType<ShiftTemplateCreateDTO>

interface UpdateTemplateModalProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  initialData: ShiftTemplate | null
  onSubmit: (data: ShiftTemplateCreateDTO) => void
}

export default function UpdateTemplateModal({
  open,
  onOpenChange,
  initialData,
  onSubmit,
}: UpdateTemplateModalProps) {
  const form = useForm<ShiftTemplateCreateDTO>({
    resolver: zodResolver(shiftTemplateSchema),
    defaultValues: {
      code: '',
      name: '',
      startTime: '',
      endTime: '',
      color: 'blue',
      isActive: true,
    },
  })

  // Reset form khi initialData thay đổi
  useEffect(() => {
    if (initialData) {
      form.reset({
        code: initialData.code,
        name: initialData.name,
        startTime: initialData.startTime,
        endTime: initialData.endTime,
        color: initialData.color,
        isActive: initialData.isActive,
      })
    }
  }, [initialData, form])

  const handleFormSubmit = form.handleSubmit(data => {
    onSubmit(data)
    onOpenChange(false)
  })

  const handleCancel = () => {
    form.reset()
    onOpenChange(false)
  }

  if (!initialData) return null

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[425px] bg-white text-gray-900">
        <DialogHeader>
          <DialogTitle>
            Cập nhật Ca Mẫu: <span className="text-[#6C63FF]">{initialData.name}</span>
          </DialogTitle>
        </DialogHeader>

        <Form {...form}>
          <div className="grid gap-5 py-4">
            <FormField
              control={form.control}
              name="code"
              render={({ field }) => (
                <FormItem className="grid grid-cols-4 items-center gap-4">
                  <FormLabel className="text-right text-gray-500">Mã Ca</FormLabel>
                  <div className="col-span-3">
                    <FormControl>
                      <Input
                        {...field}
                        className="bg-gray-50 border-gray-200 focus-visible:ring-[#6C63FF]"
                      />
                    </FormControl>
                    <FormMessage />
                  </div>
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="name"
              render={({ field }) => (
                <FormItem className="grid grid-cols-4 items-center gap-4">
                  <FormLabel className="text-right text-gray-500">Tên Ca</FormLabel>
                  <div className="col-span-3">
                    <FormControl>
                      <Input
                        {...field}
                        className="bg-gray-50 border-gray-200 focus-visible:ring-[#6C63FF]"
                      />
                    </FormControl>
                    <FormMessage />
                  </div>
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="startTime"
              render={({ field: startField }) => (
                <FormItem className="grid grid-cols-4 items-center gap-4">
                  <FormLabel className="text-right text-gray-500">Thời gian</FormLabel>
                  <div className="col-span-3 space-y-1">
                    <div className="flex items-center gap-2">
                      <FormControl>
                        <Input type="time" {...startField} className="bg-gray-50 border-gray-200" />
                      </FormControl>
                      <span className="text-gray-400">-</span>
                      <FormField
                        control={form.control}
                        name="endTime"
                        render={({ field: endField }) => (
                          <FormControl>
                            <Input
                              type="time"
                              {...endField}
                              className="bg-gray-50 border-gray-200"
                            />
                          </FormControl>
                        )}
                      />
                    </div>
                    <FormMessage />
                  </div>
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="isActive"
              render={({ field }) => (
                <FormItem className="grid grid-cols-4 items-center gap-4">
                  <FormLabel className="text-right text-gray-500">Trạng thái</FormLabel>
                  <div className="col-span-3">
                    <Select
                      value={field.value ? 'active' : 'inactive'}
                      onValueChange={val => field.onChange(val === 'active')}
                    >
                      <FormControl>
                        <SelectTrigger className="bg-gray-50 border-gray-200">
                          <SelectValue />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        <SelectItem value="active">Đang hoạt động</SelectItem>
                        <SelectItem value="inactive">Ngưng hoạt động</SelectItem>
                      </SelectContent>
                    </Select>
                    <FormMessage />
                  </div>
                </FormItem>
              )}
            />
          </div>
        </Form>

        <DialogFooter>
          <Button variant="ghost" onClick={handleCancel} className="rounded-xl">
            Hủy
          </Button>
          <Button
            onClick={handleFormSubmit}
            className="bg-[#6C63FF] hover:bg-[#5a52e0] text-white rounded-xl shadow-md"
          >
            Lưu Thay Đổi
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}

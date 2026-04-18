// app/(admin)/shift-manager/components/modals/create-template-modal.tsx
'use client'

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
import type { ShiftTemplateCreateDTO } from '@/lib/api/shift-templates'

// Zod schema validation
const shiftTemplateSchema = z.object({
  code: z.string().min(1, 'Mã ca không được để trống'),
  name: z.string().min(1, 'Tên ca không được để trống'),
  startTime: z.string().min(1, 'Giờ bắt đầu không được để trống'),
  endTime: z.string().min(1, 'Giờ kết thúc không được để trống'),
  color: z.string().min(1, 'Vui lòng chọn màu sắc'),
  isActive: z.boolean(),
}) satisfies z.ZodType<ShiftTemplateCreateDTO>

interface CreateTemplateModalProps {
  open: boolean
  isLoading: boolean
  onOpenChange: (open: boolean) => void
  onSubmit: (data: ShiftTemplateCreateDTO) => void
}

export default function CreateTemplateModal({
  open,
  isLoading,
  onOpenChange,
  onSubmit,
}: CreateTemplateModalProps) {
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

  const handleFormSubmit = form.handleSubmit(async data => {
    await onSubmit(data)
    form.reset()
  })

  const handleCancel = () => {
    form.reset()
    onOpenChange(false)
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[425px] bg-white text-gray-900">
        <DialogHeader>
          <DialogTitle>Tạo Ca Mẫu Mới</DialogTitle>
        </DialogHeader>

        <Form {...form}>
          <div className="space-y-4">
            <FormField
              control={form.control}
              name="code"
              render={({ field }) => (
                <FormItem className="grid grid-cols-4 items-center gap-4">
                  <FormLabel className="text-right">Mã Ca</FormLabel>
                  <div className="col-span-3">
                    <FormControl>
                      <Input placeholder="SANG" {...field} />
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
                  <FormLabel className="text-right">Tên Ca</FormLabel>
                  <div className="col-span-3">
                    <FormControl>
                      <Input placeholder="Ca Sáng" {...field} />
                    </FormControl>
                    <FormMessage />
                  </div>
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="startTime"
              render={({ field }) => (
                <FormItem className="grid grid-cols-4 items-center gap-4">
                  <FormLabel className="text-right">Bắt đầu</FormLabel>
                  <div className="col-span-3">
                    <FormControl>
                      <Input type="time" {...field} />
                    </FormControl>
                    <FormMessage />
                  </div>
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="endTime"
              render={({ field }) => (
                <FormItem className="grid grid-cols-4 items-center gap-4">
                  <FormLabel className="text-right">Kết thúc</FormLabel>
                  <div className="col-span-3">
                    <FormControl>
                      <Input type="time" {...field} />
                    </FormControl>
                    <FormMessage />
                  </div>
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="color"
              render={({ field }) => (
                <FormItem className="grid grid-cols-4 items-center gap-4">
                  <FormLabel className="text-right">Màu sắc</FormLabel>
                  <div className="col-span-3">
                    <Select onValueChange={field.onChange} defaultValue={field.value}>
                      <FormControl>
                        <SelectTrigger>
                          <SelectValue placeholder="Chọn màu hiển thị" />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        <SelectItem value="blue">Xanh Dương (Sáng)</SelectItem>
                        <SelectItem value="orange">Cam (Chiều)</SelectItem>
                        <SelectItem value="purple">Tím (Tối)</SelectItem>
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
          <Button type="button" variant="outline" onClick={handleCancel}>
            Hủy
          </Button>
          <Button
            type="button"
            onClick={handleFormSubmit}
            className="bg-[#6C63FF] hover:bg-[#5a52e0] text-white"
          >
            {isLoading ? 'Đang lưu...' : 'Lưu Ca Mẫu'}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}

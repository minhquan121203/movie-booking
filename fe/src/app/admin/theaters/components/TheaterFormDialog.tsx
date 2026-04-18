import { useEffect } from 'react'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import * as z from 'zod'
import { Loader2 } from 'lucide-react'
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'

import { Theater } from '@/types/theater'
import { useTheaterMutations } from '../hooks/useTheaterMutations'
import { VIETNAM_CITIES } from '@/constants/location'
// Schema Validate
const theaterSchema = z.object({
  name: z.string().min(2, 'Tên rạp là bắt buộc'),
  address: z.string().min(5, 'Địa chỉ quá ngắn'),
  city: z.string().min(1, 'Vui lòng chọn thành phố'),
  phoneNumber: z.string().optional(),
  openingHours: z.string().optional(),
  isActive: z.boolean(), // Boolean flag for active state
})

type TheaterFormValues = z.infer<typeof theaterSchema>

interface TheaterFormDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  theaterToEdit?: Theater | null
}

export function TheaterFormDialog({ open, onOpenChange, theaterToEdit }: TheaterFormDialogProps) {
  const { createMutation, updateMutation } = useTheaterMutations()
  const isEditMode = !!theaterToEdit
  const isLoading = createMutation.isPending || updateMutation.isPending

  const {
    register,
    handleSubmit,
    reset,
    setValue,
    watch,
    formState: { errors },
  } = useForm<TheaterFormValues>({
    resolver: zodResolver(theaterSchema),
    defaultValues: {
      name: '',
      address: '',
      city: '',
      phoneNumber: '',
      openingHours: '08:00 - 23:00',
      isActive: true, // Default active
    },
  })

  // Reset form data
  useEffect(() => {
    if (open) {
      if (theaterToEdit) {
        setValue('name', theaterToEdit.name)
        setValue('address', theaterToEdit.address)
        setValue('city', theaterToEdit.city)
        setValue('phoneNumber', theaterToEdit.phoneNumber || '')
        setValue('openingHours', theaterToEdit.openingHours || '08:00 - 23:00')
        setValue('isActive', theaterToEdit.isActive)
      } else {
        reset({
          name: '',
          address: '',
          city: '',
          phoneNumber: '',
          openingHours: '08:00 - 23:00',
          isActive: true,
        })
      }
    }
  }, [open, theaterToEdit, setValue, reset])

  const onSubmit = (data: TheaterFormValues) => {
    const payload = {
      ...data,
      location: { type: 'Point' as const, coordinates: [105.8, 21.0] as [number, number] },
    }

    if (isEditMode && theaterToEdit) {
      updateMutation.mutate(
        { id: theaterToEdit._id, data: payload },
        { onSuccess: () => onOpenChange(false) }
      )
    } else {
      createMutation.mutate(payload, { onSuccess: () => onOpenChange(false) })
    }
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[600px] max-h-[90vh] overflow-y-auto bg-gray-50 text-gray-900">
        <DialogHeader>
          <DialogTitle>{isEditMode ? 'Cập Nhật Thông Tin Rạp' : 'Thêm Rạp Mới'}</DialogTitle>
        </DialogHeader>

        <form onSubmit={handleSubmit(onSubmit)} className="space-y-4 py-4">
          {/* Tên rạp */}
          <div>
            <Label>
              Tên Rạp <span className="text-red-500">*</span>
            </Label>
            <Input {...register('name')} placeholder="CGV Vincom..." className="mt-1.5" />
            {errors.name && <p className="text-xs text-red-500 mt-1">{errors.name.message}</p>}
          </div>

          {/* Địa chỉ */}
          <div>
            <Label>
              Địa Chỉ <span className="text-red-500">*</span>
            </Label>
            <Textarea {...register('address')} placeholder="191 Bà Triệu..." className="mt-1.5" />
            {errors.address && (
              <p className="text-xs text-red-500 mt-1">{errors.address.message}</p>
            )}
          </div>

          <div className="grid grid-cols-2 gap-4">
            {/* Thành phố */}
            <div>
              <Label>Thành Phố / Tỉnh</Label>
              <Select
                onValueChange={val => setValue('city', val)}
                defaultValue={theaterToEdit?.city}
              >
                <SelectTrigger className="mt-1.5">
                  <SelectValue placeholder="Chọn thành phố" />
                </SelectTrigger>
                <SelectContent className="max-h-[300px] overflow-y-auto">
                  {VIETNAM_CITIES.map(city => {
                    return (
                      <SelectItem key={city} value={city}>
                        {city}
                      </SelectItem>
                    )
                  })}
                </SelectContent>
              </Select>
              {errors.city && <p className="text-xs text-red-500 mt-1">{errors.city.message}</p>}
            </div>

            {/* SĐT */}
            <div>
              <Label>Số Điện Thoại</Label>
              <Input {...register('phoneNumber')} placeholder="1900 xxxx" className="mt-1.5" />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            {/* Giờ mở cửa */}
            <div>
              <Label>Giờ mở cửa</Label>
              <Input {...register('openingHours')} placeholder="08:00 - 24:00" className="mt-1.5" />
            </div>

            {/* Tình trạng */}
            <div>
              <Label>Tình Trạng</Label>
              <Select
                onValueChange={val => setValue('isActive', val === 'true')}
                defaultValue={theaterToEdit ? String(theaterToEdit.isActive) : 'true'}
              >
                <SelectTrigger className="mt-1.5">
                  <SelectValue placeholder="Chọn tình trạng" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="true">Hoạt động</SelectItem>
                  <SelectItem value="false">Bảo trì / Đóng cửa</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>

          {/* Mock input cho Ảnh (Có thể nâng cấp upload file sau) */}
          {/* <div>
            <Label>Ảnh / Logo Rạp (URL)</Label>
            <Input placeholder="https://..." className="mt-1.5" />
          </div> */}

          <div className="flex justify-end gap-3 pt-4">
            <Button type="button" variant="default" onClick={() => onOpenChange(false)}>
              Hủy
            </Button>
            <Button
              type="submit"
              disabled={isLoading}
              className="bg-blue-600 hover:bg-blue-700 text-white"
            >
              {isLoading ? <Loader2 className="h-4 w-4 animate-spin" /> : 'Lưu'}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  )
}

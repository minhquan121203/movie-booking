import { useEffect } from 'react'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import * as z from 'zod'
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { Genre } from '@/types/genre'
import { useGenreMutations } from '../hooks/useGenreMutations'
import { Loader2 } from 'lucide-react'

// Schema validate
const genreSchema = z.object({
  name: z.string().min(2, 'Tên thể loại phải có ít nhất 2 ký tự'),
  description: z.string().optional(),
  icon: z.string().optional(),
  color: z.string().optional(),
})

type GenreFormValues = z.infer<typeof genreSchema>

interface GenreFormDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  genreToEdit?: Genre | null
}

export function GenreFormDialog({ open, onOpenChange, genreToEdit }: GenreFormDialogProps) {
  const { createMutation, updateMutation } = useGenreMutations()
  const isEditMode = !!genreToEdit
  const isLoading = createMutation.isPending || updateMutation.isPending

  const {
    register,
    handleSubmit,
    reset,
    setValue,
    formState: { errors },
  } = useForm<GenreFormValues>({
    resolver: zodResolver(genreSchema),
    defaultValues: { name: '', description: '', icon: '', color: '#000000' },
  })

  // Reset form khi mở dialog
  useEffect(() => {
    if (open) {
      if (genreToEdit) {
        setValue('name', genreToEdit.name)
        setValue('description', genreToEdit.description || '')
        setValue('icon', genreToEdit.icon || '')
        setValue('color', genreToEdit.color || '')
      } else {
        reset({ name: '', description: '', icon: '', color: '' })
      }
    }
  }, [open, genreToEdit, setValue, reset])

  const onSubmit = (data: GenreFormValues) => {
    if (isEditMode && genreToEdit) {
      updateMutation.mutate(
        { id: genreToEdit._id, data },
        {
          onSuccess: () => onOpenChange(false),
        }
      )
    } else {
      createMutation.mutate(data, {
        onSuccess: () => onOpenChange(false),
      })
    }
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[500px] bg-gray-50 text-gray-900">
        <DialogHeader>
          <DialogTitle>{isEditMode ? 'Cập nhật thể loại' : 'Thêm thể loại mới'}</DialogTitle>
        </DialogHeader>

        <form onSubmit={handleSubmit(onSubmit)} className="space-y-4 py-4 bg-gray-50">
          <div className="grid gap-4">
            {/* Tên */}
            <div className="space-y-2">
              <Label htmlFor="name">
                Tên Thể Loại <span className="text-red-500">*</span>
              </Label>
              <Input id="name" {...register('name')} placeholder="Ví dụ: Hành động" />
              {errors.name && <p className="text-sm text-red-500">{errors.name.message}</p>}
            </div>

            {/* Mô tả */}
            <div className="space-y-2">
              <Label htmlFor="description">Mô Tả</Label>
              <Textarea
                id="description"
                {...register('description')}
                placeholder="Nhập mô tả..."
                className="h-24"
              />
            </div>

            {/* (Optional) Các field khác nếu cần */}
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label>Icon (Emoji/URL)</Label>
                <Input {...register('icon')} placeholder="🎬" />
              </div>
              <div className="space-y-2">
                <Label>Màu sắc</Label>

                <Input
                  type="color"
                  {...register('color')}
                  className="w-12 p-1 h-10 cursor-pointer"
                />
              </div>
            </div>
          </div>

          <div className="flex justify-end gap-3 pt-4">
            <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>
              Hủy
            </Button>
            <Button
              type="submit"
              disabled={isLoading}
              className="bg-blue-600 hover:bg-blue-700 text-white"
            >
              {isLoading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
              {isEditMode ? 'Lưu thay đổi' : 'Thêm mới'}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  )
}

// app/(admin)/shift-manager/components/modals/generate-schedule-modal.tsx
'use client'

import { useEffect, useMemo, useCallback } from 'react'
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
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Checkbox } from '@/components/ui/checkbox'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { TheaterComboboxForm } from '@/app/admin/components/TheaterComboboxForm'
import { Loader2, AlertCircle } from 'lucide-react'
import { useShiftTemplates } from '@/lib/api/shift-templates'
import { useTheaters } from '@/lib/api/theaters'
import { useWorkScheduleMutations } from '@/lib/api/work-schedules'
import { GenerateWorkScheduleDTO } from '@/types/work-schedule'
import { toast } from 'sonner'
import { format } from 'date-fns'
// --- Validation Schema ---
const generateScheduleSchema = z
  .object({
    theaterId: z.string().min(1, 'Vui lòng chọn rạp'),
    fromDate: z.string().min(1, 'Vui lòng chọn ngày bắt đầu'),
    toDate: z.string().min(1, 'Vui lòng chọn ngày kết thúc'),
    templateIds: z.array(z.string()).min(1, 'Vui lòng chọn ít nhất 1 ca mẫu'),
    skipExisting: z.boolean(),
  })
  .refine(data => new Date(data.fromDate) <= new Date(data.toDate), {
    message: 'Ngày bắt đầu phải trước hoặc bằng ngày kết thúc',
    path: ['toDate'],
  })

type GenerateScheduleFormData = z.infer<typeof generateScheduleSchema>

interface GenerateScheduleModalProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  defaultTheaterId?: string
  defaultFromDate?: string
  defaultToDate?: string
}

export default function GenerateScheduleModal({
  open,
  onOpenChange,
  defaultTheaterId,
  defaultFromDate,
  defaultToDate,
}: GenerateScheduleModalProps) {
  // --- API Hooks ---
  const { data: templatesData, isLoading: isLoadingTemplates } = useShiftTemplates({
    isActive: true,
  })
  const { data: theatersData, isLoading: isLoadingTheaters } = useTheaters({ limit: 100 })
  const { generate } = useWorkScheduleMutations()

  // --- Memoized Data ---
  const templates = useMemo(() => templatesData || [], [templatesData])
  const theaters = useMemo(() => theatersData?.theaters || [], [theatersData])

  // --- React Hook Form ---
  const {
    control,
    handleSubmit,
    formState: { errors, isSubmitting },
    reset,
    watch,
    setValue,
  } = useForm<GenerateScheduleFormData>({
    resolver: zodResolver(generateScheduleSchema),
    defaultValues: {
      theaterId: defaultTheaterId || '',
      fromDate: defaultFromDate || '',
      toDate: defaultToDate || '',
      templateIds: [],
      skipExisting: true,
    },
  })

  const selectedTemplateIds = watch('templateIds')

  // --- Reset form khi modal đóng/mở ---
  useEffect(() => {
    if (open) {
      reset({
        theaterId: defaultTheaterId || '',
        fromDate: defaultFromDate || format(new Date(), 'yyyy-MM-dd'),
        toDate: defaultToDate || format(new Date(), 'yyyy-MM-dd'),
        templateIds: [],
        skipExisting: true,
      })
    }
  }, [open, reset, defaultTheaterId, defaultFromDate, defaultToDate])

  // --- Handlers ---
  const handleTemplateToggle = useCallback(
    (templateId: string, checked: boolean) => {
      const currentIds = selectedTemplateIds || []
      if (checked) {
        setValue('templateIds', [...currentIds, templateId], { shouldValidate: true })
      } else {
        setValue(
          'templateIds',
          currentIds.filter(id => id !== templateId),
          { shouldValidate: true }
        )
      }
    },
    [selectedTemplateIds, setValue]
  )

  const onSubmit = useCallback(
    async (data: GenerateScheduleFormData) => {
      try {
        const payload: GenerateWorkScheduleDTO = {
          theaterId: data.theaterId,
          range: {
            from: data.fromDate,
            to: data.toDate,
          },
          templateIds: data.templateIds,
          skipExisting: data.skipExisting,
        }

        await generate.mutateAsync(payload)

        toast.success('Sinh lịch thành công!', {
          description: `Đã tạo lịch từ ${data.fromDate} đến ${data.toDate}`,
        })

        onOpenChange(false)
      } catch (error: any) {
        toast.error('Lỗi khi sinh lịch', {
          description: error?.message || 'Vui lòng thử lại',
        })
      }
    },
    [generate, onOpenChange]
  )

  const handleCancel = useCallback(() => {
    onOpenChange(false)
  }, [onOpenChange])

  // --- Loading State ---
  const isLoading = isLoadingTemplates || isLoadingTheaters

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[540px] bg-white text-gray-900">
        <DialogHeader>
          <DialogTitle className="text-xl font-semibold">Sinh Lịch Tự Động</DialogTitle>
          <DialogDescription>
            Hệ thống sẽ tạo lịch làm việc trống cho khoảng thời gian bạn chọn.
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSubmit(onSubmit)}>
          <div className="grid gap-5 py-4">
            {/* Chọn Rạp */}
            <div className="space-y-2">
              <Label htmlFor="theaterId">
                Áp dụng cho Rạp <span className="text-red-500">*</span>
              </Label>
              <TheaterComboboxForm
                theaters={theaters}
                value={watch('theaterId')}
                onValueChange={val => setValue('theaterId', val)}
                placeholder="Chọn rạp chiếu..."
                searchPlaceholder="Tìm kiếm rạp..."
                showAllOption={false}
              />
              {errors.theaterId && (
                <p className="text-xs text-red-500 flex items-center gap-1">
                  <AlertCircle className="w-3 h-3" />
                  {errors.theaterId.message}
                </p>
              )}
            </div>

            {/* Chọn Thời Gian */}
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="fromDate">
                  Từ ngày <span className="text-red-500">*</span>
                </Label>
                <Controller
                  name="fromDate"
                  control={control}
                  render={({ field }) => (
                    <Input
                      {...field}
                      id="fromDate"
                      type="date"
                      className={errors.fromDate ? 'border-red-500' : ''}
                    />
                  )}
                />
                {errors.fromDate && (
                  <p className="text-xs text-red-500 flex items-center gap-1">
                    <AlertCircle className="w-3 h-3" />
                    {errors.fromDate.message}
                  </p>
                )}
              </div>

              <div className="space-y-2">
                <Label htmlFor="toDate">
                  Đến ngày <span className="text-red-500">*</span>
                </Label>
                <Controller
                  name="toDate"
                  control={control}
                  render={({ field }) => (
                    <Input
                      {...field}
                      id="toDate"
                      type="date"
                      className={errors.toDate ? 'border-red-500' : ''}
                    />
                  )}
                />
                {errors.toDate && (
                  <p className="text-xs text-red-500 flex items-center gap-1">
                    <AlertCircle className="w-3 h-3" />
                    {errors.toDate.message}
                  </p>
                )}
              </div>
            </div>

            {/* Chọn Ca Mẫu */}
            <div className="space-y-2">
              <Label>
                Chọn các Ca Mẫu muốn áp dụng <span className="text-red-500">*</span>
              </Label>
              <div
                className={`border rounded-lg p-4 space-y-3 max-h-[200px] overflow-y-auto ${
                  errors.templateIds ? 'border-red-500' : 'border-gray-200'
                }`}
              >
                {isLoadingTemplates ? (
                  <div className="flex items-center justify-center py-8 text-gray-400">
                    <Loader2 className="w-5 h-5 animate-spin mr-2" />
                    Đang tải ca mẫu...
                  </div>
                ) : templates.length === 0 ? (
                  <div className="text-center py-8 text-gray-400 text-sm">
                    Không có ca mẫu nào được kích hoạt
                  </div>
                ) : (
                  templates.map(template => (
                    <div key={template._id} className="flex items-center space-x-3">
                      <Checkbox
                        id={template._id}
                        checked={selectedTemplateIds?.includes(template._id)}
                        onCheckedChange={checked =>
                          handleTemplateToggle(template._id, checked as boolean)
                        }
                      />
                      <Label
                        htmlFor={template._id}
                        className="font-normal cursor-pointer flex-1 flex items-center justify-between"
                      >
                        <span>{template.name}</span>
                        <span className="text-xs text-gray-500">
                          {template.startTime} - {template.endTime}
                        </span>
                      </Label>
                    </div>
                  ))
                )}
              </div>
              {errors.templateIds && (
                <p className="text-xs text-red-500 flex items-center gap-1">
                  <AlertCircle className="w-3 h-3" />
                  {errors.templateIds.message}
                </p>
              )}
            </div>

            {/* Skip Existing Option */}
            <div className="flex items-center space-x-3 p-3 bg-amber-50 rounded-lg border border-amber-200">
              <Controller
                name="skipExisting"
                control={control}
                render={({ field }) => (
                  <Checkbox
                    id="skipExisting"
                    checked={field.value}
                    onCheckedChange={field.onChange}
                  />
                )}
              />
              <Label
                htmlFor="skipExisting"
                className="font-normal cursor-pointer text-sm text-amber-900"
              >
                Bỏ qua các ngày đã có lịch (khuyến nghị)
              </Label>
            </div>
          </div>

          <DialogFooter className="gap-2">
            <Button type="button" variant="outline" onClick={handleCancel} disabled={isSubmitting}>
              Hủy
            </Button>
            <Button
              type="submit"
              disabled={isSubmitting || isLoading}
              className="bg-amber-500 hover:bg-amber-600 text-white min-w-[100px]"
            >
              {isSubmitting ? (
                <>
                  <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                  Đang tạo...
                </>
              ) : (
                'Tạo Lịch'
              )}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  )
}

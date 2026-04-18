import { useEffect } from 'react'
import { useForm } from 'react-hook-form'
import { Loader2 } from 'lucide-react'
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from '@/components/ui/dialog'
import { Button } from '@/components/ui/button'
import { Label } from '@/components/ui/label'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { Booking, BookingStatus } from '@/types/booking'
import { useTicketMutations } from '../hooks/useTicketMutations'

interface TicketStatusDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  ticket: Booking | null
}

export function TicketStatusDialog({ open, onOpenChange, ticket }: TicketStatusDialogProps) {
  const { updateStatusMutation } = useTicketMutations()
  const isLoading = updateStatusMutation.isPending

  const { setValue, handleSubmit, watch } = useForm<{ status: BookingStatus }>()
  const status = watch('status')

  useEffect(() => {
    if (ticket) {
      setValue('status', ticket.status)
    }
  }, [ticket, setValue])

  const onSubmit = (data: { status: BookingStatus }) => {
    if (ticket) {
      updateStatusMutation.mutate(
        { id: ticket._id, status: data.status },
        { onSuccess: () => onOpenChange(false) }
      )
    }
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[400px]">
        <DialogHeader>
          <DialogTitle>Cập nhật trạng thái vé</DialogTitle>
        </DialogHeader>

        <div className="py-4 space-y-4">
          <div className="p-3 bg-gray-50 rounded-lg text-sm">
            <p>
              <span className="font-semibold">Mã vé:</span> {ticket?.bookingCode}
            </p>
            <p>
              <span className="font-semibold">Phim:</span> {ticket?.movieTitle}
            </p>
            <p>
              <span className="font-semibold">Khách:</span> {ticket?.customer?.fullName}
            </p>
          </div>

          <div className="space-y-2">
            <Label>Trạng thái mới</Label>
            <Select value={status} onValueChange={val => setValue('status', val as BookingStatus)}>
              <SelectTrigger>
                <SelectValue placeholder="Chọn trạng thái" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="Chờ thanh toán">Chờ thanh toán</SelectItem>
                <SelectItem value="Hoàn tất">Hoàn tất (Đã thanh toán)</SelectItem>
                <SelectItem value="Đã sử dụng">Đã sử dụng (Check-in)</SelectItem>
                <SelectItem value="Đã hủy">Đã hủy</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)}>
            Hủy
          </Button>
          <Button
            onClick={handleSubmit(onSubmit)}
            disabled={isLoading}
            className="bg-primary text-white"
          >
            {isLoading && <Loader2 className="w-4 h-4 mr-2 animate-spin" />}
            Cập nhật
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}

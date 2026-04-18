import { useState } from 'react'
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from '@/components/ui/dialog'
import { Button } from '@/components/ui/button'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { Loader2 } from 'lucide-react'
import { useReviewMutations } from '../hooks/useReviewMutations'

interface RejectDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  reviewId: string | null
}

export function RejectDialog({ open, onOpenChange, reviewId }: RejectDialogProps) {
  const [reason, setReason] = useState('')
  const { rejectMutation } = useReviewMutations()

  const handleReject = () => {
    if (reviewId && reason.trim()) {
      rejectMutation.mutate(
        { id: reviewId, data: { reason } },
        {
          onSuccess: () => {
            setReason('')
            onOpenChange(false)
          },
        }
      )
    }
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[500px]">
        <DialogHeader>
          <DialogTitle>Từ chối đánh giá</DialogTitle>
        </DialogHeader>

        <div className="py-4 space-y-3">
          <Label>
            Lý do từ chối <span className="text-red-500">*</span>
          </Label>
          <Textarea
            placeholder="Nhập lý do (VD: Nội dung không phù hợp, ngôn từ thô tục...)"
            value={reason}
            onChange={e => setReason(e.target.value)}
            className="h-32"
          />
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)}>
            Hủy
          </Button>
          <Button
            variant="destructive"
            onClick={handleReject}
            disabled={!reason.trim() || rejectMutation.isPending}
          >
            {rejectMutation.isPending ? <Loader2 className="w-4 h-4 animate-spin" /> : 'Từ chối'}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}

// file: src/app/(main)/profile/components/VerifyAgeDialog.tsx
'use client'

import { useState } from 'react'
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from '@/components/ui/dialog' // Đảm bảo bạn có component Dialog (Shadcn/Headless)
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { useMutation, useQueryClient } from '@tanstack/react-query'
import { verifyAgeApi } from '@/lib/api/userMe' // Import hàm vừa tạo
import { toast } from 'sonner' // Hoặc thư viện toast bạn đang dùng (react-toastify, etc.)
import { Loader2 } from 'lucide-react'

interface VerifyAgeDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
}

export function VerifyAgeDialog({ open, onOpenChange }: VerifyAgeDialogProps) {
  const [cccd, setCccd] = useState('')
  const queryClient = useQueryClient()

  const mutation = useMutation({
    mutationFn: verifyAgeApi,
    onSuccess: () => {
      toast.success('Xác minh thành công!')
      // Invalidate query 'me' để UI tự cập nhật trạng thái isAgeVerified
      queryClient.invalidateQueries({ queryKey: ['me'] })
      onOpenChange(false)
      setCccd('')
    },
    onError: (error: any) => {
      toast.error(error?.response?.data?.message || 'Có lỗi xảy ra khi xác minh')
    },
  })

  const handleSubmit = () => {
    if (!cccd || cccd.length < 9) {
      toast.error('Vui lòng nhập số CCCD hợp lệ')
      return
    }
    mutation.mutate({ demo_cccd: cccd })
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[425px]">
        <DialogHeader>
          <DialogTitle>Xác minh danh tính</DialogTitle>
          <DialogDescription>
            Nhập số Căn cước công dân để xác minh độ tuổi của bạn.
          </DialogDescription>
        </DialogHeader>
        
        <div className="grid gap-4 py-4">
          <div className="space-y-2">
            <Label htmlFor="cccd">Số CCCD / CMND</Label>
            <Input
              id="cccd"
              placeholder="Nhập 12 số CCCD..."
              value={cccd}
              onChange={(e) => setCccd(e.target.value)}
              disabled={mutation.isPending}
            />
          </div>
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)} disabled={mutation.isPending}>
            Hủy
          </Button>
          <Button onClick={handleSubmit} disabled={mutation.isPending}>
            {mutation.isPending && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
            Xác minh
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
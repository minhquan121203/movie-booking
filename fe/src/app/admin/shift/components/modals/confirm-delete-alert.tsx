'use client'

import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@/components/ui/alert-dialog'
import { Loader2 } from 'lucide-react'

interface ConfirmDeleteAlertProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  onConfirm: () => void
  title?: string
  description?: string
  isLoading: boolean
}

export default function ConfirmDeleteAlert({
  open,
  onOpenChange,
  onConfirm,
  title = 'Bạn có chắc chắn muốn xóa?',
  description = 'Hành động này không thể hoàn tác. Dữ liệu sẽ bị xóa vĩnh viễn khỏi hệ thống.',
  isLoading,
}: ConfirmDeleteAlertProps) {
  return (
    <AlertDialog open={open} onOpenChange={onOpenChange}>
      <AlertDialogContent className="bg-white border-gray-200">
        <AlertDialogHeader>
          <AlertDialogTitle className="text-red-600">{title}</AlertDialogTitle>
          <AlertDialogDescription className="text-gray-500">{description}</AlertDialogDescription>
        </AlertDialogHeader>
        <AlertDialogFooter>
          <AlertDialogCancel className="rounded-xl border-gray-200 bg-gray-50 hover:bg-gray-100 text-gray-700">
            Hủy bỏ
          </AlertDialogCancel>
          <AlertDialogAction
            onClick={e => {
              e.preventDefault()
              if (!isLoading) {
                onConfirm()
              }
            }}
            disabled={isLoading}
            className="rounded-xl bg-red-600 hover:bg-red-700 text-white border-none shadow-sm"
          >
            {isLoading ? (
              <>
                <Loader2 className="h-4 w-4 animate-spin" />
                <span>Đang xoá...</span>
              </>
            ) : (
              <>Xác nhận xoá</>
            )}
          </AlertDialogAction>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  )
}

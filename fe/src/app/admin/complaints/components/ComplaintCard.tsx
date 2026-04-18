'use client'
import { useState, memo } from 'react'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
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
import { Check, X, Trash2, AlertCircle, User, Phone, Mail, Calendar } from 'lucide-react'
import { Complaint } from '@/types/complaint'
import { format } from 'date-fns'
import { vi } from 'date-fns/locale'

interface ComplaintCardProps {
  complaint: Complaint
  onResolve: (complaintId: string) => void
  onReject: (complaintId: string) => void
  onDelete: (complaintId: string) => void
  isUpdating: boolean
  isDeleting: boolean
}

const STATUS_MAP: Record<string, { label: string; variant: any }> = {
  pending: { label: 'Chờ xử lý', variant: 'default' },
  in_progress: { label: 'Đang xử lý', variant: 'secondary' },
  resolved: { label: 'Đã xử lý', variant: 'success' },
  rejected: { label: 'Từ chối', variant: 'destructive' },
  escalated: { label: 'Chuyển tiếp', variant: 'outline' },
}

const PRIORITY_MAP: Record<string, { label: string; color: string }> = {
  low: { label: 'Thấp', color: 'text-chart-3' },
  medium: { label: 'Trung bình', color: 'text-accent' },
  high: { label: 'Cao', color: 'text-orange-500' },
  urgent: { label: 'Khẩn cấp', color: 'text-destructive' },
}

const CATEGORY_MAP: Record<string, string> = {
  service: 'Dịch vụ',
  facility: 'Cơ sở vật chất',
  product: 'Sản phẩm',
  booking: 'Đặt vé',
  technical: 'Kỹ thuật',
  other: 'Khác',
}

function ComplaintCard({
  complaint,
  onResolve,
  onReject,
  onDelete,
  isUpdating,
  isDeleting,
}: ComplaintCardProps) {
  const [showDeleteDialog, setShowDeleteDialog] = useState(false)
  const [showResolveDialog, setShowResolveDialog] = useState(false)

  const handleResolve = () => {
    onResolve(complaint._id)
    setShowResolveDialog(false)
  }

  const handleReject = () => {
    onReject(complaint._id)
  }

  const handleDelete = () => {
    onDelete(complaint._id)
    setShowDeleteDialog(false)
  }

  const statusInfo = STATUS_MAP[complaint.status] || STATUS_MAP.pending
  const priorityInfo = PRIORITY_MAP[complaint.priority] || PRIORITY_MAP.medium

  return (
    <>
      <div className="p-6 border-b border-border last:border-b-0">
        <div className="flex gap-4">
          {/* Avatar */}
          <div className="w-12 h-12 rounded-full bg-primary/10 flex items-center justify-center shrink-0">
            <span className="text-primary font-semibold text-lg">
              {complaint.customerName?.charAt(0).toUpperCase() || 'N'}
            </span>
          </div>

          {/* Content */}
          <div className="flex-1 space-y-3">
            {/* Header */}
            <div className="flex items-start justify-between gap-4">
              <div className="space-y-1">
                <div className="flex items-center gap-2 flex-wrap">
                  <h3 className="font-semibold text-foreground">
                    {complaint.customerName || 'Nội bộ (Nhân viên báo cáo)'}
                  </h3>
                  <Badge variant={statusInfo.variant}>{statusInfo.label}</Badge>
                  <Badge variant="outline" className={priorityInfo.color}>
                    <AlertCircle className="w-3 h-3 mr-1" />
                    {priorityInfo.label}
                  </Badge>
                </div>
                <p className="text-sm text-muted-foreground">{complaint.title}</p>
              </div>

              {/* Actions */}
              <div className="flex gap-2">
                {complaint.status === 'pending' && (
                  <>
                    <Button
                      size="sm"
                      onClick={() => setShowResolveDialog(true)}
                      disabled={isUpdating}
                      className="bg-chart-3 hover:bg-chart-3/90 text-white"
                    >
                      <Check className="w-4 h-4 mr-1" />
                      Duyệt
                    </Button>
                    <Button
                      size="sm"
                      variant="outline"
                      onClick={handleReject}
                      disabled={isUpdating}
                      className="text-destructive hover:text-destructive"
                    >
                      <X className="w-4 h-4 mr-1" />
                      Từ chối
                    </Button>
                  </>
                )}
              </div>
            </div>

            {/* Info Grid */}
            <div className="grid grid-cols-3 gap-4 text-sm">
              <div className="flex items-center gap-2 text-muted-foreground">
                <User className="w-4 h-4" />
                <span>ID: {complaint.complaintId}</span>
              </div>
              {complaint.customerPhone && (
                <div className="flex items-center gap-2 text-muted-foreground">
                  <Phone className="w-4 h-4" />
                  <span>{complaint.customerPhone}</span>
                </div>
              )}
              {complaint.customerEmail && (
                <div className="flex items-center gap-2 text-muted-foreground">
                  <Mail className="w-4 h-4" />
                  <span className="truncate">{complaint.customerEmail}</span>
                </div>
              )}
            </div>

            {/* Category and Theater */}
            <div className="flex gap-4 text-sm flex-wrap">
              <span className="text-muted-foreground">
                Loại: <span className="text-foreground">{CATEGORY_MAP[complaint.category]}</span>
              </span>
              <span className="text-muted-foreground">•</span>
              <span className="text-muted-foreground">
                Rạp: <span className="text-foreground">{complaint.theaterName}</span>
              </span>
            </div>

            {/* Description */}
            <p className="text-sm text-muted-foreground bg-secondary p-3 rounded-lg italic">
              {complaint.description}
            </p>

            {/* Footer */}
            <div className="flex items-center gap-4 text-xs text-muted-foreground pt-2 flex-wrap">
              <div className="flex items-center gap-1">
                <Calendar className="w-3 h-3" />
                <span>
                  {format(new Date(complaint.createdAt), 'dd/MM/yyyy HH:mm', { locale: vi })}
                </span>
              </div>
              <span>•</span>
              <span>Người xử lý: {complaint.receivedByName}</span>
            </div>
          </div>
        </div>
      </div>

      {/* Delete Dialog */}
      <AlertDialog open={showDeleteDialog} onOpenChange={setShowDeleteDialog}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Xác nhận xóa khiếu nại</AlertDialogTitle>
            <AlertDialogDescription>
              Bạn có chắc chắn muốn xóa khiếu nại này? Hành động này không thể hoàn tác.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Hủy</AlertDialogCancel>
            <AlertDialogAction
              onClick={handleDelete}
              className="bg-destructive hover:bg-destructive/90"
            >
              Xóa
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      {/* Resolve Dialog */}
      <AlertDialog open={showResolveDialog} onOpenChange={setShowResolveDialog}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Xác nhận duyệt khiếu nại</AlertDialogTitle>
            <AlertDialogDescription>
              Bạn có chắc chắn muốn đánh dấu khiếu nại này là Đã xử lý?
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Hủy</AlertDialogCancel>
            <AlertDialogAction onClick={handleResolve} className="bg-chart-3 hover:bg-chart-3/90">
              Duyệt
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  )
}

// Memo để tránh re-render không cần thiết
export default memo(ComplaintCard, (prevProps, nextProps) => {
  return (
    prevProps.complaint._id === nextProps.complaint._id &&
    prevProps.complaint.status === nextProps.complaint.status &&
    prevProps.isUpdating === nextProps.isUpdating &&
    prevProps.isDeleting === nextProps.isDeleting
  )
})

'use client'
import { useEffect, useState } from 'react'
import { useUserStore } from '@/store/userStore'
import ComplaintForm from './components/ComplaintForm'
import ComplaintStats from './components/ComplaintStats'
import ComplaintGuideline from './components/ComplaintGuideline'
import { useComplaints } from '@/lib/api/complaints'

interface ComplaintStatsData {
  resolvedComplaints: number
  pendingComplaints: number
}

export default function CustomersPage() {
  const { user, _hasHydrated } = useUserStore()
  const [stats, setStats] = useState<ComplaintStatsData>({
    resolvedComplaints: 0,
    pendingComplaints: 0,
  })

  // Fetch complaints data để tính thống kê
  const today = new Date()
  today.setHours(0, 0, 0, 0)

  const { data: complaintsData } = useComplaints({
    startDate: today.toISOString(),
    endDate: new Date().toISOString(),
    limit: 100,
  })

  // Tính toán thống kê từ dữ liệu complaints
  useEffect(() => {
    if (complaintsData?.complaints) {
      const complaints = complaintsData.complaints

      const resolved = complaints.filter(c => c.status === 'resolved').length
      const pending = complaints.filter(c => c.status === 'pending').length

      // Mock data cho các trường khác (có thể fetch từ API khác)
      setStats({
        resolvedComplaints: resolved,
        pendingComplaints: pending,
      })
    }
  }, [complaintsData])

  // Đợi hydration hoàn tất
  if (!_hasHydrated) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary" />
      </div>
    )
  }

  // Kiểm tra user đã login chưa
  if (!user) {
    return (
      <div className="text-center py-12">
        <p className="text-muted-foreground">Vui lòng đăng nhập để tiếp tục</p>
      </div>
    )
  }

  return (
    <div className="max-w-5xl mx-auto space-y-6">
      <div>
        <h2 className="text-foreground">Quản lý khách hàng</h2>
        <p className="text-muted-foreground mt-1">Hỗ trợ và ghi nhận khiếu nại từ khách hàng</p>
      </div>

      <div className="grid grid-cols-3 gap-6">
        {/* Form khiếu nại - Col span 2 */}
        <div className="col-span-2">
          <ComplaintForm staffId={user._id} />
        </div>

        {/* Hướng dẫn & Thống kê */}
        <div className="space-y-6">
          <ComplaintGuideline />
          <ComplaintStats stats={stats} />
        </div>
      </div>
    </div>
  )
}

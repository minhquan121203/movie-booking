'use client'

import { useState, useEffect, Suspense } from 'react' // Nhớ thêm Suspense ở đây
import { useRouter, useSearchParams, usePathname } from 'next/navigation'
import Filters, { type BookingStatus } from './components/Filters'
import BookingList from './components/BookingList'
import { useMyBookings } from '@/lib/api/booking'
import { CustomPagination, PaginationInfo } from '@/app/components/shared/custom-pagination'
import Link from 'next/link'

// Đổi tên function cũ thành OrderHistoryContent (bỏ export default đi)
function OrderHistoryContent() {
  const router = useRouter()
  const searchParams = useSearchParams()
  const pathname = usePathname()

  useEffect(() => {
    const currentStatus = searchParams.get('status')
    // Nếu phát hiện URL có đuôi từ PayOS trả về
    if (currentStatus === 'PAID' || currentStatus === 'CANCELLED') {
      // Xóa sạch toàn bộ đuôi lằng nhằng, trả về trang /order-history gốc
      router.replace(pathname) 
    }
  }, [pathname, router, searchParams])

  // Lấy giá trị từ URL params
  const pageFromUrl = parseInt(searchParams.get('page') || '1', 10)
  const statusFromUrl = (searchParams.get('status') || 'all') as BookingStatus | 'all'

  const [status, setStatus] = useState<BookingStatus | 'all'>(statusFromUrl)
  const [currentPage, setCurrentPage] = useState(pageFromUrl)
  const itemsPerPage = 10

  // Sync state với URL
  useEffect(() => {
    const timer = setTimeout(() => {
      setCurrentPage(pageFromUrl)
      setStatus(statusFromUrl)
    }, 0)
    return () => clearTimeout(timer)
  }, [pageFromUrl, statusFromUrl])

  // Fetch Data từ API
  const {
    data: bookingData,
    isError,
    isLoading,
  } = useMyBookings({
    page: currentPage,
    limit: itemsPerPage,
    status: status === 'all' ? undefined : status,
  })

  const bookings = bookingData?.bookings || []
  const totalPages = bookingData?.pagination?.totalPages || 1
  const totalBookings = bookingData?.pagination.totalItems || 0

  // Update URL params khi thay đổi page
  const updateUrlParams = (newPage: number, newStatus: BookingStatus | 'all') => {
    const params = new URLSearchParams()
    params.set('page', newPage.toString())
    if (newStatus !== 'all') {
      params.set('status', newStatus)
    }
    router.push(`?${params.toString()}`, { scroll: false })
  }

  // Handler thay đổi trang
  const handlePageChange = (page: number) => {
    setCurrentPage(page)
    updateUrlParams(page, status)
    window.scrollTo({ top: 0, behavior: 'smooth' })
  }

  // Handler thay đổi status
  const handleStatusChange = (newStatus: BookingStatus | 'all') => {
    setStatus(newStatus)
    setCurrentPage(1)
    updateUrlParams(1, newStatus)
  }

  if (isError) {
    return (
      <div className="min-h-screen bg-bg-primary flex items-center justify-center">
        <div className="text-red-500 bg-red-50 px-4 py-2 rounded-lg border border-red-200">
          Có lỗi khi tải lịch sử đặt vé. Vui lòng thử lại sau.
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-bg-primary">
      <div className="max-w-[1400px] mx-auto px-4 sm:px-6 py-8">
        <div className="mb-8">
          <h2
            className="text-text-primary mb-2 flex items-center gap-3"
            style={{ fontSize: '32px', fontWeight: 600 }}
          >
            🎫 Lịch sử đặt vé
          </h2>
          <p className="text-text-secondary">
            Quản lý và theo dõi trạng thái các vé đã đặt của bạn
          </p>
        </div>

        <Filters
          currentStatus={status}
          onStatusChange={handleStatusChange}
          bookingsCount={totalBookings}
          isLoading={isLoading}
        />

        {isLoading ? (
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {[1, 2, 3, 4].map(i => (
              <div
                key={i}
                className="h-48 bg-surface/50 animate-pulse rounded-xl border border-border"
              />
            ))}
          </div>
        ) : bookings.length > 0 ? (
          <>
            <BookingList bookings={bookings} />

            <PaginationInfo
              currentPage={currentPage}
              totalPages={totalPages}
              totalItems={totalBookings}
              itemsPerPage={itemsPerPage}
            />

            <CustomPagination
              currentPage={currentPage}
              totalPages={totalPages}
              onPageChange={handlePageChange}
              showPageNumbers={5}
            />
          </>
        ) : (
          <div className="flex flex-col items-center justify-center py-16 text-center">
            <div className="text-6xl mb-4">🎬</div>
            <h3 className="text-xl font-semibold text-text-primary mb-2">Chưa có vé nào</h3>
            <p className="text-text-secondary mb-6">
              {status === 'all'
                ? 'Bạn chưa đặt vé nào. Hãy khám phá các bộ phim đang chiếu!'
                : `Không có vé nào ở trạng thái "${status}"`}
            </p>
            <Link
              href="/movies"
              className="px-6 py-3 bg-primary text-white rounded-lg hover:bg-primary/90 transition-colors"
            >
              Khám phá phim
            </Link>
          </div>
        )}
      </div>
    </div>
  )
}

// Bọc cái khiên Suspense ở ngoài cùng này
export default function OrderHistoryPage() {
  return (
    <Suspense fallback={<div className="min-h-screen flex items-center justify-center text-white">Đang tải lịch sử đặt vé...</div>}>
      <OrderHistoryContent />
    </Suspense>
  )
}
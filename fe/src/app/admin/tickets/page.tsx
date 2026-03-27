'use client'

import { useRouter, useSearchParams } from 'next/navigation'
import { useState, useEffect, useMemo, Suspense } from 'react' // Thêm Suspense
import { useAdminBookings } from '@/lib/api/booking'
import { useTicketMutations } from './hooks/useTicketMutations'
import { TicketTable } from './components/TicketTable'
import { TicketToolbar } from './components/TicketToolbar'
import { TicketStatusDialog } from './components/TicketStatusDialog'
import { Booking } from '@/types/booking'
import { useDebounce } from '@/hooks/useDebounce'
import { Loader2 } from 'lucide-react' // Thêm icon loading
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
import { DEFAULT_BOOKING_LIST } from '@/constants'
import { GetAdminBookingsParams } from '@/lib/api/booking'
import { CustomPagination, PaginationInfo } from '@/app/components/shared/custom-pagination'
import { LoadingOverlay, TableSkeleton } from '@/app/components/shared/skeleton'

// 1. Tách nội dung quản lý ra một Component riêng
function TicketManagementContent() {
  const router = useRouter()
  const searchParams = useSearchParams()

  const pageFromUrl = parseInt(searchParams.get('page') || '1', 10)
  const itemsPerPage = 10

  // State
  const [search, setSearch] = useState('')
  const debouncedSearch = useDebounce(search, 500)

  const [params, setParams] = useState<GetAdminBookingsParams>({
    page: pageFromUrl,
    limit: itemsPerPage,
    status: undefined,
    showDate: undefined,
  })

  // Dialog State
  const [editTicket, setEditTicket] = useState<Booking | null>(null)
  const [deleteId, setDeleteId] = useState<string | null>(null)

  // Sync URL to State
  useEffect(() => {
    setParams(prev => ({ ...prev, page: pageFromUrl }))
  }, [pageFromUrl])

  // API
  const {
    data: bookingData = DEFAULT_BOOKING_LIST,
    isLoading,
    isFetching,
  } = useAdminBookings({
    ...params,
    search: debouncedSearch,
  })

  const totalPages = bookingData?.pagination?.totalPages || 1
  const totalItems = bookingData?.pagination?.totalItems || 0

  const { deleteMutation } = useTicketMutations()

  // Update URL Helper
  const updateUrlParams = (newPage: number) => {
    const newSearchParams = new URLSearchParams(searchParams.toString())
    newSearchParams.set('page', newPage.toString())
    router.push(`?${newSearchParams.toString()}`, { scroll: false })
  }

  // Handlers
  const handlePageChange = (page: number) => {
    setParams(prev => ({ ...prev, page }))
    updateUrlParams(page)
    window.scrollTo({ top: 0, behavior: 'smooth' })
  }

  const handleFilterChange = (newParams: Partial<GetAdminBookingsParams & { search?: string }>) => {
    if (newParams.search !== undefined) {
      setSearch(newParams.search)
    }

    const shouldResetPage =
      (newParams.status !== undefined && newParams.status !== params.status) ||
      (newParams.showDate !== undefined && newParams.showDate !== params.showDate) ||
      (newParams.search !== undefined && newParams.search !== search)

    setParams(prev => ({
      ...prev,
      ...newParams,
      search: undefined,
      page: shouldResetPage ? 1 : prev.page,
    }))

    if (shouldResetPage) {
      updateUrlParams(1)
    }
  }

  const handleDelete = () => {
    if (deleteId) {
      deleteMutation.mutate(deleteId, { onSuccess: () => setDeleteId(null) })
    }
  }
  const isTransitioning = useMemo(() => {
    return !isLoading && isFetching
  }, [isLoading, isFetching])

  return (
    <main className="flex-1 p-8 bg-gray-50 min-h-screen">
      <div className="max-w-7xl mx-auto space-y-6">
        <h1 className="text-gray-900 text-3xl font-bold">Quản Lý Vé</h1>

        <TicketToolbar params={{ ...params, search }} setParams={handleFilterChange} />
        <div className="relative">
          {isLoading ? (
            <TableSkeleton />
          ) : (
            <>
              <TicketTable
                bookings={bookingData?.bookings || []}
                isLoading={isLoading}
                onEditStatus={setEditTicket}
                onDelete={setDeleteId}
              />
              {isTransitioning && <LoadingOverlay />}
            </>
          )}
        </div>

        <PaginationInfo
          currentPage={params.page || 1}
          totalPages={totalPages}
          totalItems={totalItems}
          itemsPerPage={itemsPerPage}
        />

        <CustomPagination
          currentPage={params.page || 1}
          totalPages={totalPages}
          onPageChange={handlePageChange}
          showPageNumbers={5}
        />
      </div>

      <TicketStatusDialog
        open={!!editTicket}
        onOpenChange={() => setEditTicket(null)}
        ticket={editTicket}
      />

      <AlertDialog open={!!deleteId} onOpenChange={() => setDeleteId(null)}>
        <AlertDialogContent className="bg-gray-50 text-gray-900">
          <AlertDialogHeader>
            <AlertDialogTitle>Xác nhận xóa vé?</AlertDialogTitle>
            <AlertDialogDescription>Hành động này không thể hoàn tác.</AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel className="hover:bg-gray-300! hover:text-gray-800!">
              Hủy
            </AlertDialogCancel>
            <AlertDialogAction onClick={handleDelete} className="bg-red-600 hover:bg-red-700">
              Xóa
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </main>
  )
}

// 2. Export default bọc trong Suspense
export default function TicketManagementPage() {
  return (
    <Suspense fallback={
      <div className="flex-1 p-8 bg-gray-50 min-h-screen flex items-center justify-center">
        <Loader2 className="w-10 h-10 animate-spin text-blue-600" />
      </div>
    }>
      <TicketManagementContent />
    </Suspense>
  )
}
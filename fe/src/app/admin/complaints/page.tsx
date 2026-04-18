'use client'
import { useState, useCallback, useEffect } from 'react'
import { Input } from '@/components/ui/input'
import { Search } from 'lucide-react'
import { useComplaints } from '@/lib/api/complaints'
import { useComplaintMutations } from './hooks/useComplaintMutations'
import ComplaintCard from './components/ComplaintCard'
import { CustomPagination, PaginationInfo } from '@/app/components/shared/custom-pagination'
import { TheaterCombobox } from '@/components/ui/combobox'
import { useTheaters } from '@/lib/api/theaters'

export default function ComplaintsPage() {
  const [searchQuery, setSearchQuery] = useState('')
  const [theaterFilter, setTheaterFilter] = useState('all')
  const [currentPage, setCurrentPage] = useState(1)

  // Fetch theaters cho combobox
  const { data: theatersData } = useTheaters({ limit: 100 })
  const theaters = theatersData?.theaters || []

  // Build query params
  const queryParams = {
    page: currentPage,
    limit: 10,
    search: searchQuery || undefined,
    theater: theaterFilter !== 'all' ? theaterFilter : undefined,
    sortBy: 'createdAt',
    order: 'desc' as const,
  }

  const { data, isLoading } = useComplaints(queryParams)

  // Get mutations để truyền xuống
  const { updateStatusMutation, deleteMutation } = useComplaintMutations()

  // Reset về trang 1 khi filter thay đổi
  useEffect(() => {
    setCurrentPage(1)
  }, [searchQuery, theaterFilter])

  // Callbacks với useCallback để tránh re-render
  const handlePageChange = useCallback((page: number) => {
    setCurrentPage(page)
    window.scrollTo({ top: 0, behavior: 'smooth' })
  }, [])

  const handleResolve = useCallback(
    (complaintId: string) => {
      updateStatusMutation.mutate({
        id: complaintId,
        data: { status: 'resolved' },
      })
    },
    [updateStatusMutation]
  )

  const handleReject = useCallback(
    (complaintId: string) => {
      updateStatusMutation.mutate({
        id: complaintId,
        data: { status: 'rejected' },
      })
    },
    [updateStatusMutation]
  )

  const handleDelete = useCallback(
    (complaintId: string) => {
      deleteMutation.mutate(complaintId)
    },
    [deleteMutation]
  )

  return (
    <div className="container mx-auto space-y-6 py-6">
      {/* Header */}
      <div>
        <h2 className="text-foreground text-2xl font-semibold">Quản Lý Khiếu Nại</h2>
      </div>

      {/* Filters */}
      {/* <div className="flex gap-4">
        <TheaterCombobox
          theaters={theaters}
          value={theaterFilter}
          onValueChange={setTheaterFilter}
          placeholder="Lọc theo rạp"
          searchPlaceholder="Tìm kiếm rạp..."
          className="w-[250px]"
        />
      </div> */}

      {/* Complaints List */}
      <div className="bg-white rounded-lg border border-border p-6 space-y-6">
        {isLoading ? (
          <div className="flex items-center justify-center py-12">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary" />
          </div>
        ) : data?.complaints && data.complaints.length > 0 ? (
          <>
            {data.complaints.map(complaint => (
              <ComplaintCard
                key={complaint._id}
                complaint={complaint}
                onResolve={handleResolve}
                onReject={handleReject}
                onDelete={handleDelete}
                isUpdating={updateStatusMutation.isPending}
                isDeleting={deleteMutation.isPending}
              />
            ))}

            {/* Pagination Info */}
            <PaginationInfo
              currentPage={currentPage}
              totalPages={data.complaints.length / 10}
              totalItems={data.complaints.length}
              itemsPerPage={10}
            />

            {/* Pagination */}
            <CustomPagination
              currentPage={currentPage}
              totalPages={data.complaints.length / 10}
              onPageChange={handlePageChange}
            />
          </>
        ) : (
          <div className="text-center py-12">
            <p className="text-muted-foreground">Không có khiếu nại nào</p>
          </div>
        )}
      </div>
    </div>
  )
}

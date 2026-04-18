'use client'

import { useRouter, useSearchParams } from 'next/navigation'
import { useState, useEffect, useMemo, Suspense } from 'react' 
import { useReviews } from '@/lib/api/reviews'
import { useReviewMutations } from './hooks/useReviewMutations'
import { ReviewToolbar } from './components/ReviewToolbar'
import { ReviewTable } from './components/ReviewTable'
import { RejectDialog } from './components/RejectDialog'
import { useDebounce } from '@/hooks/useDebounce'
import { Loader2 } from 'lucide-react'
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
import { GetReviewsParams } from '@/lib/api/reviews'
import { DEFAULT_REVIEWS_LIST } from '@/constants'
import { CustomPagination, PaginationInfo } from '@/app/components/shared/custom-pagination'
import { LoadingOverlay, TableSkeleton } from '@/app/components/shared/skeleton'

function ReviewManagementContent() {
  const router = useRouter()
  const searchParams = useSearchParams()

  const pageFromUrl = parseInt(searchParams.get('page') || '1', 10)
  const itemsPerPage = 9

  const [search, setSearch] = useState('')
  const debouncedSearch = useDebounce(search, 500)

  const [params, setParams] = useState<GetReviewsParams>({
    page: pageFromUrl,
    limit: itemsPerPage,
    status: undefined,
    rating: undefined,
  })

  const [rejectId, setRejectId] = useState<string | null>(null)
  const [deleteId, setDeleteId] = useState<string | null>(null)

  useEffect(() => {
    setParams(prev => ({ ...prev, page: pageFromUrl }))
  }, [pageFromUrl])

  const {
    data: reviewData = DEFAULT_REVIEWS_LIST,
    isLoading,
    isFetching,
  } = useReviews({
    ...params,
    search: debouncedSearch,
  })

  const totalPages = reviewData?.pagination?.totalPages || 1
  const totalReviews = reviewData?.pagination?.totalItems || 0

  const safeReviews = (reviewData?.reviews || []).map((review: any) => ({
    ...review,
    movie: review.movie || { title: 'Phim đã bị xóa', posterUrl: '' },
    customer: review.customer || { fullName: 'Tài khoản đã xóa', email: 'Không xác định', profilePicture: '' },
    comment: review.comment || 'Không có nội dung',
  }))

  const { approveMutation, deleteMutation } = useReviewMutations()

  const updateUrlParams = (newPage: number) => {
    const newSearchParams = new URLSearchParams(searchParams.toString())
    newSearchParams.set('page', newPage.toString())
    router.push(`?${newSearchParams.toString()}`, { scroll: false })
  }

  const handlePageChange = (page: number) => {
    setParams(prev => ({ ...prev, page }))
    updateUrlParams(page)
    window.scrollTo({ top: 0, behavior: 'smooth' })
  }

  const handleFilterChange = (newParams: Partial<GetReviewsParams>) => {
    if (newParams.search !== undefined) {
      setSearch(newParams.search)
    }

    setParams(prev => {
      const updated = { ...prev, ...newParams, search: undefined }
      if (newParams.status !== prev.status || newParams.rating !== prev.rating) {
        updated.page = 1
        updateUrlParams(1)
      }
      return updated
    })
  }

  const handleApprove = (id: string) => {
    approveMutation.mutate(id)
  }

  const handleDeleteConfirm = () => {
    if (deleteId) {
      deleteMutation.mutate(deleteId, {
        onSuccess: () => setDeleteId(null),
      })
    }
  }

  const isTransitioning = useMemo(() => {
    return !isLoading && isFetching
  }, [isLoading, isFetching])

  return (
    <main className="flex-1 p-8 bg-gray-50 min-h-screen">
      <div className="max-w-7xl mx-auto space-y-6">
        <h1 className="text-gray-900 text-3xl font-bold">Quản Lý Đánh Giá</h1>

        <ReviewToolbar params={{ ...params, search }} setParams={handleFilterChange} />
        {isLoading ? (
          <TableSkeleton />
        ) : (
          <>
            <ReviewTable
              reviews={safeReviews}
              isLoading={isLoading}
              onApprove={handleApprove}
              onRejectClick={setRejectId}
              onDeleteClick={setDeleteId}
            />
            {isTransitioning && <LoadingOverlay />}
          </>
        )}

        <PaginationInfo
          currentPage={params.page || 1}
          totalPages={totalPages}
          totalItems={totalReviews}
          itemsPerPage={itemsPerPage}
        />

        <CustomPagination
          currentPage={params.page || 1}
          totalPages={totalPages}
          onPageChange={handlePageChange}
          showPageNumbers={5}
        />
      </div>

      <RejectDialog open={!!rejectId} onOpenChange={() => setRejectId(null)} reviewId={rejectId} />

      <AlertDialog open={!!deleteId} onOpenChange={() => setDeleteId(null)}>
        <AlertDialogContent className="bg-gray-50 text-gray-900">
          <AlertDialogHeader>
            <AlertDialogTitle>Xóa đánh giá?</AlertDialogTitle>
            <AlertDialogDescription>Hành động này không thể hoàn tác.</AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel className="hover:bg-gray-300! hover:text-gray-800!">
              Hủy
            </AlertDialogCancel>
            <AlertDialogAction
              onClick={handleDeleteConfirm}
              className="bg-red-600 hover:bg-red-700"
            >
              Xóa
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </main>
  )
}

export default function ReviewManagementPage() {
  return (
    <Suspense fallback={
      <div className="flex-1 p-8 bg-gray-50 min-h-screen flex items-center justify-center">
        <Loader2 className="w-10 h-10 animate-spin text-blue-600" />
      </div>
    }>
      <ReviewManagementContent />
    </Suspense>
  )
}
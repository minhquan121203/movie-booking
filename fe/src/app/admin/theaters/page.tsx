'use client'

import { useRouter, useSearchParams } from 'next/navigation'
import { useState, useEffect, useMemo, Suspense } from 'react' // Thêm Suspense
import { useTheaters } from '@/lib/api/theaters'
import { useTheaterMutations } from './hooks/useTheaterMutations'
import { TheaterTable } from './components/TheaterTable'
import { TheaterFormDialog } from './components/TheaterFormDialog'
import { Theater } from '@/types/theater'
import { Input } from '@/components/ui/input'
import { Button } from '@/components/ui/button'
import { Card } from '@/components/ui/card'
import { Search, Plus, Loader2 } from 'lucide-react' // Thêm Loader2
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
import { useDebounce } from '@/hooks/useDebounce'
import { CustomPagination, PaginationInfo } from '@/app/components/shared/custom-pagination'
import { LoadingOverlay, TableSkeleton } from '@/app/components/shared/skeleton'

// 1. Tách nội dung quản lý ra một Component riêng
function TheaterManagementContent() {
  const router = useRouter()
  const searchParams = useSearchParams()

  const pageFromUrl = parseInt(searchParams.get('page') || '1', 10)
  const itemsPerPage = 10 

  const [currentPage, setCurrentPage] = useState(pageFromUrl)
  const [search, setSearch] = useState('')
  const debouncedSearch = useDebounce(search, 500)

  const [isDialogOpen, setIsDialogOpen] = useState(false)
  const [theaterToEdit, setTheaterToEdit] = useState<Theater | null>(null)
  const [deleteId, setDeleteId] = useState<string | null>(null)

  useEffect(() => {
    setCurrentPage(pageFromUrl)
  }, [pageFromUrl])

  useEffect(() => {
    if (currentPage !== 1 && search !== '') {
      handlePageChange(1)
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [debouncedSearch])

  const {
    data: theaterList,
    isLoading,
    isFetching,
  } = useTheaters({
    search: debouncedSearch,
    page: currentPage,
    limit: itemsPerPage,
  })

  const theaters = theaterList?.theaters || []
  const totalPages = theaterList?.pagination?.totalPages || 1
  const totalItems = theaterList?.pagination?.totalItems || 0

  const { deleteMutation } = useTheaterMutations()

  const updateUrlParams = (newPage: number) => {
    const params = new URLSearchParams(searchParams.toString())
    params.set('page', newPage.toString())
    router.push(`?${params.toString()}`, { scroll: false })
  }

  const handlePageChange = (page: number) => {
    setCurrentPage(page)
    updateUrlParams(page)
    window.scrollTo({ top: 0, behavior: 'smooth' })
  }

  const handleAdd = () => {
    setTheaterToEdit(null)
    setIsDialogOpen(true)
  }

  const handleEdit = (theater: Theater) => {
    setTheaterToEdit(theater)
    setIsDialogOpen(true)
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
        <h1 className="text-gray-900 text-3xl font-bold">Quản Lý Rạp</h1>

        <Card className="bg-white border-gray-200 p-4 shadow-sm">
          <div className="flex flex-col md:flex-row gap-4 justify-between">
            <div className="relative flex-1 max-w-md">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
              <Input
                placeholder="Tìm kiếm rạp..."
                className="pl-9 bg-gray-50 border-gray-200"
                value={search}
                onChange={e => setSearch(e.target.value)}
              />
            </div>
            <Button onClick={handleAdd} className="bg-blue-600 hover:bg-blue-700 text-white gap-2">
              <Plus className="w-4 h-4" /> Thêm Rạp Mới
            </Button>
          </div>
        </Card>

        {isLoading ? (
          <TableSkeleton />
        ) : (
          <>
            <TheaterTable
              theaters={theaters}
              isLoading={isLoading}
              onEdit={handleEdit}
              onDelete={id => setDeleteId(id)}
            />
            {isTransitioning && <LoadingOverlay />}
          </>
        )}

        <div className="flex flex-col gap-4 mt-4">
          <PaginationInfo
            currentPage={currentPage}
            totalPages={totalPages}
            totalItems={totalItems}
            itemsPerPage={itemsPerPage}
          />

          <CustomPagination
            currentPage={currentPage}
            totalPages={totalPages}
            onPageChange={handlePageChange}
            showPageNumbers={5}
          />
        </div>
      </div>

      <TheaterFormDialog
        open={isDialogOpen}
        onOpenChange={setIsDialogOpen}
        theaterToEdit={theaterToEdit}
      />

      <AlertDialog open={!!deleteId} onOpenChange={() => setDeleteId(null)}>
        <AlertDialogContent className="bg-gray-50 text-gray-900">
          <AlertDialogHeader>
            <AlertDialogTitle>Xác nhận xóa?</AlertDialogTitle>
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
export default function TheaterManagementPage() {
  return (
    <Suspense fallback={
      <div className="flex-1 p-8 bg-gray-50 min-h-screen flex items-center justify-center">
        <Loader2 className="w-10 h-10 animate-spin text-blue-600" />
      </div>
    }>
      <TheaterManagementContent />
    </Suspense>
  )
}
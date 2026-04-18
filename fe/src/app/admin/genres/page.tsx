'use client'

import { useRouter, useSearchParams } from 'next/navigation'
import { useState, useEffect, useMemo, Suspense } from 'react' // Thêm Suspense
import { useGenres } from '@/lib/api/genres'
import { useGenreMutations } from './hooks/useGenreMutations'
import { GenreTable } from './components/GenreTable'
import { GenreFormDialog } from './components/GenreFormDialog'
import { Genre } from '@/types/genre'
import { Input } from '@/components/ui/input'
import { Button } from '@/components/ui/button'
import { Card } from '@/components/ui/card'
import { Search, Plus, Loader2 } from 'lucide-react' // Thêm Loader2 cho đẹp
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
import { LoadingOverlay, TableSkeleton } from '@/app/components/shared/skeleton'
import { CustomPagination, PaginationInfo } from '@/app/components/shared/custom-pagination'

// 1. Tách nội dung quản lý ra một Component riêng
function GenreManagementContent() {
  const router = useRouter()
  const searchParams = useSearchParams()

  const pageFromUrl = parseInt(searchParams.get('page') || '1', 10)
  const itemsPerPage = 10 

  const [currentPage, setCurrentPage] = useState(pageFromUrl)
  const [search, setSearch] = useState('')
  const debouncedSearch = useDebounce(search, 500)

  const [isDialogOpen, setIsDialogOpen] = useState(false)
  const [genreToEdit, setGenreToEdit] = useState<Genre | null>(null)
  const [deleteId, setDeleteId] = useState<string | null>(null)

  useEffect(() => {
    setCurrentPage(pageFromUrl)
  }, [pageFromUrl])

  useEffect(() => {
    if (currentPage !== 1) {
      handlePageChange(1)
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [debouncedSearch])

  const {
    data: genreData,
    isLoading,
    isFetching,
  } = useGenres({
    page: currentPage,
    limit: itemsPerPage,
    search: debouncedSearch,
  })

  const genres = genreData?.items ?? []
  const totalPages = genreData ? genreData.pagination.totalPages : 1
  const totalItems = genreData ? genreData.pagination.totalItems : 0

  const { deleteMutation } = useGenreMutations()

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
    setGenreToEdit(null)
    setIsDialogOpen(true)
  }

  const handleEdit = (genre: Genre) => {
    setGenreToEdit(genre)
    setIsDialogOpen(true)
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
        <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
          <h1 className="text-gray-900 text-3xl font-bold">Quản Lý Thể Loại</h1>
        </div>

        <Card className="bg-white border-gray-200 p-4 shadow-sm">
          <div className="flex flex-col md:flex-row gap-4 justify-between">
            <div className="relative flex-1 max-w-md">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
              <Input
                placeholder="Tìm kiếm theo tên thể loại..."
                className="pl-9 bg-gray-50 border-gray-200"
                value={search}
                onChange={e => setSearch(e.target.value)}
              />
            </div>
            <Button onClick={handleAdd} className="bg-blue-600 hover:bg-blue-700 text-white gap-2">
              <Plus className="w-4 h-4" /> Thêm Mới
            </Button>
          </div>
        </Card>

        {isLoading ? (
          <TableSkeleton />
        ) : (
          <>
            <GenreTable
              genres={genres}
              isLoading={isLoading}
              onEdit={handleEdit}
              onDelete={id => setDeleteId(id)}
            />
            {isTransitioning && <LoadingOverlay />}
          </>
        )}

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

      <GenreFormDialog
        open={isDialogOpen}
        onOpenChange={setIsDialogOpen}
        genreToEdit={genreToEdit}
      />

      <AlertDialog open={!!deleteId} onOpenChange={() => setDeleteId(null)}>
        <AlertDialogContent className="bg-gray-50 text-gray-900">
          <AlertDialogHeader>
            <AlertDialogTitle>Xác nhận xóa?</AlertDialogTitle>
            <AlertDialogDescription>
              Hành động này sẽ xóa thể loại vĩnh viễn. Các phim thuộc thể loại này có thể bị ảnh
              hưởng.
            </AlertDialogDescription>
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

// 2. Export default bọc trong Suspense
export default function GenreManagementPage() {
  return (
    <Suspense fallback={
      <div className="flex-1 p-8 bg-gray-50 min-h-screen flex items-center justify-center">
        <Loader2 className="w-10 h-10 animate-spin text-blue-600" />
      </div>
    }>
      <GenreManagementContent />
    </Suspense>
  )
}
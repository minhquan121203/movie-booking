'use client'

import { useRouter, useSearchParams } from 'next/navigation'
import { useState, useEffect, useMemo, Suspense } from 'react' // Thêm Suspense
import { Card } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Plus, Loader2 } from 'lucide-react'
import { Calendar } from '@/components/ui/calendar'
// API Hooks
import { useSchedules } from '@/lib/api/schedules'
import { useMovies } from '@/lib/api/movies'
import { useTheaters } from '@/lib/api/theaters'
import { useScheduleMutations } from './hooks/useScheduleMutations'

import { ScheduleTable } from './components/ScheduleTable'
import { ScheduleFormDialog } from './components/ScheduleFormDialog'
import { Schedule } from '@/types/schedule'
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
import { LoadingOverlay, TableSkeleton } from '@/app/components/shared/skeleton'
import { CustomPagination, PaginationInfo } from '@/app/components/shared/custom-pagination'

// 1. Tách nội dung quản lý ra một Component riêng
function ScheduleManagementContent() {
  const router = useRouter()
  const searchParams = useSearchParams()

  const pageFromUrl = parseInt(searchParams.get('page') || '1', 10)
  const itemsPerPage = 10

  // State
  const [date, setDate] = useState<Date | undefined>(new Date())
  const [currentPage, setCurrentPage] = useState(pageFromUrl)
  const [isDialogOpen, setIsDialogOpen] = useState(false)
  const [scheduleToEdit, setScheduleToEdit] = useState<Schedule | null>(null)
  const [deleteId, setDeleteId] = useState<string | null>(null)

  useEffect(() => {
    setCurrentPage(pageFromUrl)
  }, [pageFromUrl])

  const formattedDate = date ? date.toLocaleDateString('en-CA') : undefined

  // 1. Fetch Schedules
  const {
    data: scheduleData,
    isLoading,
    isFetching,
  } = useSchedules({
    date: formattedDate,
    page: currentPage,
    limit: itemsPerPage,
    includePast: true,
  })

  // 2. Fetch Resource Data (Phim & Rạp)
  const {
    data: moviesData,
    isLoading: isLoadingMovies,
    isError: isErrorMovies,
  } = useMovies({ limit: 1000, status: 'Đang chiếu, Sắp chiếu' })
  const {
    data: theatersData,
    isLoading: isLoadingTheaters,
    isError: isErrorTheaters,
  } = useTheaters({ limit: 100 })

  const isReferenceLoading = isLoadingMovies || isLoadingTheaters
  const isReferenceError = isErrorMovies || isErrorTheaters
  const totalPages = scheduleData?.pagination?.totalPages || 1
  const totalItems = scheduleData?.pagination?.totalItems || 0

  const { deleteMutation } = useScheduleMutations()

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

  const handleDateChange = (newDate: Date | undefined) => {
    setDate(newDate)
    if (currentPage !== 1) {
      setCurrentPage(1)
      updateUrlParams(1)
    }
  }

  const handleAdd = () => {
    setScheduleToEdit(null)
    setIsDialogOpen(true)
  }

  const handleEdit = (schedule: Schedule) => {
    setScheduleToEdit(schedule)
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
      <div className="max-w-[1600px] mx-auto space-y-6">
        <div className="flex justify-between items-center">
          <h1 className="text-gray-900 text-3xl font-bold">Quản Lý Lịch Chiếu</h1>
          <Button onClick={handleAdd} className="bg-blue-600 hover:bg-blue-700 text-white gap-2">
            <Plus className="w-4 h-4" /> Thêm Lịch Chiếu
          </Button>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
          <Card className="bg-white border-gray-200 p-4 h-fit shadow-sm">
            <div className="flex mb-2">
              <h3 className="text-gray-900 font-semibold mb-4 px-2 flex-1">Chọn Ngày Chiếu</h3>
              <Button
                className=" bg-gray-50 text-gray-900 hover:bg-gray-200 "
                onClick={() => handleDateChange(undefined)}
              >
                Tất cả
              </Button>
            </div>
            <Calendar
              mode="single"
              selected={date}
              onSelect={handleDateChange}
              disabled={(d) => d < new Date(new Date().setHours(0, 0, 0, 0))}
              className="rounded-md border border-gray-100 w-full bg-gray-50 text-gray-950"
            />
          </Card>

          <div className="lg:col-span-3 space-y-4">
            {isLoading ? (
              <TableSkeleton />
            ) : (
              <>
                <Card className="bg-white border-gray-200 shadow-sm">
                  <div className="p-6 border-b border-gray-200">
                    <h3 className="text-gray-900 font-bold">
                      Danh sách lịch chiếu {date ? `- ${date.toLocaleDateString('vi-VN')}` : ''}
                    </h3>
                  </div>
                  <ScheduleTable
                    schedules={scheduleData?.schedules || []}
                    isLoading={isLoading}
                    onEdit={handleEdit}
                    onDelete={id => setDeleteId(id)}
                  />
                </Card>
                {isTransitioning && <LoadingOverlay />}
              </>
            )}

            <div className="pt-4">
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
        </div>
      </div>

      <ScheduleFormDialog
        open={isDialogOpen}
        onOpenChange={setIsDialogOpen}
        scheduleToEdit={scheduleToEdit}
        movies={moviesData?.movies || []}
        theaters={theatersData?.theaters || []}
        isReferenceLoading={isReferenceLoading}
        isReferenceError={isReferenceError}
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
export default function ScheduleManagementPage() {
  return (
    <Suspense fallback={
      <div className="flex-1 p-8 bg-gray-50 min-h-screen flex items-center justify-center">
        <Loader2 className="w-10 h-10 animate-spin text-blue-600" />
      </div>
    }>
      <ScheduleManagementContent />
    </Suspense>
  )
}
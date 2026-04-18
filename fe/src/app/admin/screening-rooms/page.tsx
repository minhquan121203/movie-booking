'use client'

import { useRouter, useSearchParams } from 'next/navigation'
import { useState, useMemo, useRef, useEffect, Suspense } from 'react' // Thêm Suspense
import { useTheaters } from '@/lib/api/theaters'
import { useRoomMutations } from './hooks/useRoomMutations'
import { RoomTable } from './components/RoomTable'
import { RoomToolbar } from './components/RoomToolbar'
import { RoomFormDialog, FlatRoom } from './components/RoomFormDialog'
import { AdminSeatMap } from './components/AdminSeatMap'
import { Seat } from '@/types/theater'
import { toast } from 'sonner'
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
import { LoadingOverlay, TableSkeleton } from '@/app/components/shared/skeleton'
import { CustomPagination, PaginationInfo } from '@/app/components/shared/custom-pagination'

// 1. Tách nội dung chính ra một Component riêng
function ScreeningRoomContent() {
  const router = useRouter()
  const searchParams = useSearchParams()

  const pageFromUrl = parseInt(searchParams.get('page') || '1', 10)
  const itemsPerPage = 10

  const [currentPage, setCurrentPage] = useState(pageFromUrl)
  const [search, setSearch] = useState('')
  const [selectedTheater, setSelectedTheater] = useState('all')
  const [isDialogOpen, setIsDialogOpen] = useState(false)
  const [roomToEdit, setRoomToEdit] = useState<FlatRoom | null>(null)
  const [deleteInfo, setDeleteInfo] = useState<{ tid: string; rid: string } | null>(null)

  const [viewingRoom, setViewingRoom] = useState<FlatRoom | null>(null)
  const seatMapRef = useRef<HTMLDivElement>(null)

  const { data: theaterList, isLoading, isFetching } = useTheaters({ limit: 100 })
  const theaters = useMemo(() => {
    return theaterList?.theaters || []
  }, [theaterList])

  const allRooms: FlatRoom[] = useMemo(() => {
    if (!theaters) return []
    const rooms: FlatRoom[] = []
    theaters.forEach(theater => {
      if (theater.rooms) {
        theater.rooms.forEach((room: any) => {
          rooms.push({
            ...room,
            _id: room._id || Math.random().toString(),
            theater: theater,
            theaterName: theater.name,
          })
        })
      }
    })
    return rooms
  }, [theaters])

  const filteredRooms = useMemo(() => {
    return allRooms.filter(room => {
      const matchSearch = room.roomName.toLowerCase().includes(search.toLowerCase())
      const matchTheater = selectedTheater === 'all' || room.theater._id === selectedTheater
      return matchSearch && matchTheater
    })
  }, [allRooms, search, selectedTheater])

  const totalItems = filteredRooms.length
  const totalPages = Math.ceil(totalItems / itemsPerPage)

  const paginatedRooms = useMemo(() => {
    const startIndex = (currentPage - 1) * itemsPerPage
    return filteredRooms.slice(startIndex, startIndex + itemsPerPage)
  }, [filteredRooms, currentPage, itemsPerPage])

  const { deleteMutation, updateMutation, updateSeatMutation } = useRoomMutations()

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

  useEffect(() => {
    setCurrentPage(pageFromUrl)
  }, [pageFromUrl])

  useEffect(() => {
    if (currentPage !== 1) {
      updateUrlParams(1)
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [search, selectedTheater])

  const handleAdd = () => {
    setRoomToEdit(null)
    setIsDialogOpen(true)
  }

  const handleEdit = (room: FlatRoom) => {
    setRoomToEdit(room)
    setIsDialogOpen(true)
  }

  const handleViewSeatMap = (room: FlatRoom) => {
    setViewingRoom(room)
    setTimeout(() => {
      seatMapRef.current?.scrollIntoView({ behavior: 'smooth', block: 'start' })
    }, 100)
  }

  const handleSaveSeatMap = (updatedSeats: Seat[]) => {
    if (!viewingRoom) return
    updateSeatMutation.mutate(
      {
        theaterId: viewingRoom.theater._id,
        roomId: viewingRoom._id,
        data: { seats: updatedSeats },
      },
      {
        onSuccess: () => {
          toast.success('Cập nhật sơ đồ ghế thành công!')
          setViewingRoom({ ...viewingRoom, seatMap: updatedSeats })
        },
        onError: () => {
          toast.error('Có lỗi xảy ra khi lưu sơ đồ.')
        },
      }
    )
  }

  const handleDelete = () => {
    if (deleteInfo) {
      deleteMutation.mutate(
        { theaterId: deleteInfo.tid, roomId: deleteInfo.rid },
        { onSuccess: () => setDeleteInfo(null) }
      )
    }
  }
  const isTransitioning = useMemo(() => {
    return !isLoading && isFetching
  }, [isLoading, isFetching])

  return (
    <main className="flex-1 p-8 bg-gray-50 min-h-screen">
      <div className="max-w-[1400px] mx-auto space-y-6">
        <h1 className="text-gray-900 text-3xl font-bold">Quản Lý Phòng Chiếu</h1>

        <RoomToolbar
          search={search}
          onSearchChange={setSearch}
          selectedTheater={selectedTheater}
          onTheaterChange={setSelectedTheater}
          theaters={theaters}
          onOpenAdd={handleAdd}
        />
        {isLoading ? (
          <TableSkeleton />
        ) : (
          <>
            <RoomTable
              rooms={paginatedRooms}
              isLoading={isLoading}
              onEdit={handleEdit}
              onDelete={(tid, rid) => setDeleteInfo({ tid, rid })}
              onView={handleViewSeatMap}
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

        {viewingRoom && (
          <div ref={seatMapRef} className="pt-4 border-t border-gray-200 mt-6">
            <AdminSeatMap
              room={viewingRoom as any}
              onClose={() => setViewingRoom(null)}
              onSave={handleSaveSeatMap}
              isSaving={updateMutation.isPending}
            />
          </div>
        )}
      </div>

      <RoomFormDialog
        open={isDialogOpen}
        onOpenChange={setIsDialogOpen}
        roomToEdit={roomToEdit}
        theaters={theaters}
      />

      <AlertDialog open={!!deleteInfo} onOpenChange={() => setDeleteInfo(null)}>
        <AlertDialogContent className="bg-gray-50 text-gray-900">
          <AlertDialogHeader>
            <AlertDialogTitle>Xác nhận xóa phòng?</AlertDialogTitle>
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
export default function ScreeningRoomPage() {
  return (
    <Suspense fallback={
      <div className="flex-1 p-8 bg-gray-50 min-h-screen flex items-center justify-center">
        <Loader2 className="w-10 h-10 animate-spin text-blue-600" />
      </div>
    }>
      <ScreeningRoomContent />
    </Suspense>
  )
}
'use client'
import { useRouter, useSearchParams } from 'next/navigation'
import { useState, useEffect, useMemo, Suspense } from 'react'
import { useUsers } from '@/lib/api/user'
import { useUserMutations } from './hooks/useUserMutations'
import { UserTable } from './components/UserTable'
import { UserToolbar } from './components/UserToolbar'
import { UserDetailSheet } from './components/UserDetailSheet'
import { CreateStaffModal } from './components/CreateStaffModal'
import { AssignTheaterModal } from './components/AssignTheaterModal'
// 🆕 1. Import EditStaffModal
import { EditStaffModal } from './components/EditStaffModal' 
import { useDebounce } from '@/hooks/useDebounce'
import { LoadingOverlay, TableSkeleton } from '@/app/components/shared/skeleton'
import { User } from '@/types/user'
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
import { CustomPagination, PaginationInfo } from '@/app/components/shared/custom-pagination'

function UserManagementContent() {
  const router = useRouter()
  const searchParams = useSearchParams()

  const pageFromUrl = parseInt(searchParams.get('page') || '1', 10)
  const typeUserFromUrl = searchParams.get('type-user') || 'customer'

  const [currentPage, setCurrentPage] = useState(pageFromUrl)
  const itemsPerPage = 10

  const [search, setSearch] = useState('')
  const debouncedSearch = useDebounce(search, 500)
  const [typeUser, setTypeUser] = useState(typeUserFromUrl)

  const [viewUserId, setViewUserId] = useState<string | null>(null)
  const [deleteId, setDeleteId] = useState<string | null>(null)
  const [showCreateStaffModal, setShowCreateStaffModal] = useState(false)
  const [assignTheaterStaff, setAssignTheaterStaff] = useState<User | null>(null)
  
  // 🆕 2. Thêm state quản lý người đang được Edit
  const [editingUser, setEditingUser] = useState<User | null>(null)

  useEffect(() => {
    const timer = setTimeout(() => {
      setCurrentPage(pageFromUrl)
      setTypeUser(typeUserFromUrl)
    }, 0)
    return () => clearTimeout(timer)
  }, [pageFromUrl, typeUserFromUrl])

  const {
    data: userData,
    isLoading,
    isFetching,
  } = useUsers({
    page: currentPage,
    limit: itemsPerPage,
    search: debouncedSearch,
    role: typeUser,
  })
  
  const users = userData?.users
  const totalPages = userData?.pagination?.totalPages || 1
  const totalBookings = userData?.pagination.totalItems || 0
  const { deleteMutation } = useUserMutations()
  
  const isTransitioning = useMemo(() => {
    return !isLoading && isFetching
  }, [isLoading, isFetching])

  const updateUrlParams = (newPage: number, newTypeUser: string) => {
    const params = new URLSearchParams()
    params.set('page', newPage.toString())
    if (newTypeUser !== 'customer') {
      params.set('type-user', newTypeUser)
    }
    router.push(`?${params.toString()}`, { scroll: false })
  }

  const handlePageChange = (page: number) => {
    setCurrentPage(page)
    updateUrlParams(page, typeUser)
    window.scrollTo({ top: 0, behavior: 'smooth' })
  }

  const handleDelete = () => {
    if (deleteId) {
      deleteMutation.mutate(deleteId, { onSuccess: () => setDeleteId(null) })
    }
  }

  const handleTypeUserChange = (newTypeUser: string) => {
    setTypeUser(newTypeUser)
    setCurrentPage(1)
    updateUrlParams(1, newTypeUser)
  }

  return (
    <main className="flex-1 p-8 bg-gray-50 min-h-screen">
      <div className="max-w-[1440px] mx-auto space-y-6">
        <h1 className="text-gray-900 text-3xl font-bold">Quản Lý Người Dùng</h1>

        <UserToolbar
          search={search}
          onSearchChange={setSearch}
          typeUser={typeUser}
          onTabChange={handleTypeUserChange}
          onAddStaff={() => setShowCreateStaffModal(true)}
        />

        <div className="relative">
          {isLoading ? (
            <TableSkeleton />
          ) : (
            <>
              <UserTable
                users={users || []}
                onViewDetail={user => setViewUserId(user._id)}
                onDelete={id => setDeleteId(id)}
                onAssignTheater={setAssignTheaterStaff}
                showAssignTheater={typeUser === 'staff'}
                // 🆕 3. Truyền state vào bảng để hiện "Cây Bút"
                onEdit={setEditingUser} 
              />
              {isTransitioning && <LoadingOverlay />}
            </>
          )}
        </div>

        {!isLoading && (
          <>
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
        )}
      </div>

      <UserDetailSheet
        open={!!viewUserId}
        onOpenChange={() => setViewUserId(null)}
        userId={viewUserId}
      />

      <CreateStaffModal open={showCreateStaffModal} onOpenChange={setShowCreateStaffModal} />

      {/* 🆕 4. Nhúng cái Form Edit vào giao diện */}
      <EditStaffModal 
        open={!!editingUser} 
        onOpenChange={(open) => !open && setEditingUser(null)} 
        user={editingUser} 
      />

      <AssignTheaterModal
        open={!!assignTheaterStaff}
        onOpenChange={() => setAssignTheaterStaff(null)}
        staff={assignTheaterStaff}
      />

      <AlertDialog open={!!deleteId} onOpenChange={() => setDeleteId(null)}>
        <AlertDialogContent className="bg-gray-50 text-gray-900">
          <AlertDialogHeader>
            <AlertDialogTitle>Xác nhận xóa người dùng?</AlertDialogTitle>
            <AlertDialogDescription>Hành động này không thể hoàn tác.</AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel className="hover:bg-gray-300! hover:text-gray-800!">
              Hủy
            </AlertDialogCancel>
            <AlertDialogAction onClick={handleDelete} className="bg-red-600 hover:bg-red-700!">
              Xóa
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </main>
  )
}

export default function UserManagementPage() {
  return (
    <Suspense fallback={
      <div className="flex-1 p-8 bg-gray-50 min-h-screen flex items-center justify-center">
        <Loader2 className="w-10 h-10 animate-spin text-blue-600" />
      </div>
    }>
      <UserManagementContent />
    </Suspense>
  )
}
'use client'
import { Input } from '@/components/ui/input'
import { Search, Users, UserPlus, ShieldCheck, UserCog } from 'lucide-react'
import { Tabs, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { Button } from '@/components/ui/button'

interface UserToolbarProps {
  search: string
  onSearchChange: (val: string) => void
  typeUser: string
  onTabChange: (val: string) => void
  onAddStaff: () => void
  showAddAdmin?: boolean
  onAddAdmin?: () => void
}

export function UserToolbar({
  search,
  onSearchChange,
  typeUser,
  onTabChange,
  onAddStaff,
  showAddAdmin,
  onAddAdmin,
}: UserToolbarProps) {
  return (
    <div className="space-y-4">
      {/* Tabs Switcher */}
      <Tabs value={typeUser} onValueChange={onTabChange} className="w-full">
        <TabsList className="bg-white border border-gray-200 p-1 rounded-xl h-auto w-full sm:w-auto justify-start flex-wrap">
          <TabsTrigger
            value="customer"
            className="rounded-lg px-4 py-2 data-[state=active]:bg-primary data-[state=active]:text-white"
          >
            <Users className="w-4 h-4 mr-2" />
            Khách hàng
          </TabsTrigger>
          
          <TabsTrigger
            value="staff"
            className="rounded-lg px-4 py-2 data-[state=active]:bg-primary data-[state=active]:text-white"
          >
            <UserPlus className="w-4 h-4 mr-2" />
            Nhân viên
          </TabsTrigger>

          {/* Tab Quản trị viên - Chỉ hiện nếu là Super Admin */}
          {showAddAdmin && (
            <TabsTrigger
              value="admin"
              className="rounded-lg px-4 py-2 data-[state=active]:bg-red-600 data-[state=active]:text-white text-red-600"
            >
              <ShieldCheck className="w-4 h-4 mr-2" />
              Quản trị viên
            </TabsTrigger>
          )}
        </TabsList>
      </Tabs>

      {/* Search Bar & Action Buttons */}
      <div className="flex flex-col lg:flex-row gap-4 bg-white p-4 rounded-xl border border-gray-200 shadow-sm">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5" />
          <Input
            placeholder="Tìm kiếm theo tên, email, số điện thoại..."
            className="pl-10 bg-gray-50 border-gray-200 rounded-xl"
            value={search}
            onChange={e => onSearchChange(e.target.value)}
          />
        </div>

        <div className="flex flex-wrap gap-2">
          {/* Nút Thêm Staff (Hiện khi ở tab Staff hoặc Customer) */}
          {(typeUser === 'staff' || typeUser === 'customer') && (
            <Button
              onClick={onAddStaff}
              className="bg-primary hover:bg-primary/90 text-white rounded-xl px-6 flex-1 sm:flex-none"
            >
              <UserPlus className="w-4 h-4 mr-2" /> Thêm Nhân viên
            </Button>
          )}

          {/* Nút Thêm Admin - Chỉ hiện khi showAddAdmin là true */}
          {showAddAdmin && (
            <Button
              onClick={onAddAdmin}
              className="bg-red-600 hover:bg-red-700 text-white rounded-xl px-6 flex-1 sm:flex-none shadow-md shadow-red-100"
            >
              <UserCog className="w-4 h-4 mr-2" /> Thêm Quản lý
            </Button>
          )}
        </div>
      </div>
    </div>
  )
}
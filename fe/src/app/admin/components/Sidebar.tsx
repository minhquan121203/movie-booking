'use client'

import {
  LayoutDashboard,
  Film,
  Users,
  MapPin,
  Tag,
  Star,
  BarChart3,
  Armchair,
  Calendar,
  Ticket,
  Settings,
  Clock,
  Hamburger,
  MessageSquareWarning,
} from 'lucide-react'
import { LogoutButton } from '@/app/components/shared/LogoutButton'
import Link from 'next/link'
import { usePathname } from 'next/navigation'

export function Sidebar() {
  const pathname = usePathname()

  const menuItems = [
    { icon: LayoutDashboard, label: 'Tổng Quan', path: '/admin' },
    { icon: BarChart3, label: 'Báo Cáo Thống Kê', path: '/admin/reports' },
    { icon: Film, label: 'Quản Lý Phim', path: '/admin/movies' },
    { icon: Hamburger, label: 'Quản Lý Đồ Ăn', path: '/admin/products' },
    { icon: Users, label: 'Quản Lý Người Dùng', path: '/admin/users' },
    { icon: MapPin, label: 'Quản Lý Rạp', path: '/admin/theaters' },
    { icon: Armchair, label: 'Quản Lý Phòng Chiếu', path: '/admin/screening-rooms' },
    { icon: Calendar, label: 'Quản Lý Lịch Chiếu', path: '/admin/schedules' },
    { icon: Clock, label: 'Quản Lý Ca Làm Việc', path: '/admin/shift' },
    { icon: Ticket, label: 'Quản Lý Vé', path: '/admin/tickets' },
    { icon: Tag, label: 'Quản Lý Thể Loại', path: '/admin/genres' },
    { icon: Star, label: 'Danh Sách Đánh Giá', path: '/admin/reviews' },
    { icon: MessageSquareWarning, label: 'Báo Cáo Phản Hồi', path: '/admin/complaints' },
    { icon: Settings, label: 'Cấu Hình Hệ Thống', path: '/admin/settings' },
  ]

  return (
    <aside className="fixed left-0 top-0 h-screen w-64 bg-white border-r border-gray-200 flex flex-col shadow-sm z-50">
      {/* Logo */}
      <div className="h-20 flex items-center px-6 border-b border-gray-200">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-linear-to-br from-[#6C63FF] to-[#8C82FF] flex items-center justify-center shadow-lg">
            <Film className="w-6 h-6 text-white" />
          </div>
          <div>
            <h2 className="text-gray-900 font-bold text-lg">Cinema Admin</h2>
          </div>
        </div>
      </div>

      {/* Navigation */}
      <nav className="flex-1 px-3 py-6 overflow-y-auto">
        <ul className="space-y-1">
          {menuItems.map(item => {
            const Icon = item.icon
            const isActive =
              item.path === '/admin' ? pathname === '/admin' : pathname?.startsWith(item.path)

            return (
              <li key={item.path}>
                <Link
                  href={item.path}
                  suppressHydrationWarning
                  className={`flex items-center gap-3 px-4 py-3 rounded-xl transition-all duration-200 font-medium ${
                    isActive
                      ? 'bg-[#6C63FF] text-white shadow-md shadow-[#6c63ff]/20'
                      : 'text-gray-600 hover:bg-gray-50 hover:text-[#6C63FF]'
                  }`}
                >
                  <Icon className={`w-5 h-5 ${isActive ? 'text-white' : 'text-gray-500'}`} />
                  <span suppressHydrationWarning className="text-sm">
                    {item.label}
                  </span>
                </Link>
              </li>
            )
          })}
        </ul>
      </nav>

      {/* Footer */}
      <div className="p-4 border-t border-gray-200">
        {/* Sử dụng LogoutButton ở đây */}
        <LogoutButton className="w-full bg-white text-gray-700 border-gray-200 hover:bg-gray-50 hover:text-red-600 border shadow-none justify-start" />
      </div>
    </aside>
  )
}

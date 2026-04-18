'use client'
import { Ticket, ShieldCheck, Users, Hamburger, Film, Clock } from 'lucide-react'
import Link from 'next/link'
import { usePathname } from 'next/navigation'

export function StaffSidebar() {
  const menuItems = [
    { id: 'ban-ve', label: 'Bán vé', icon: Ticket, path: '/staff/sell' },
    { id: 'xac-nhan-ve', label: 'Xác nhận vé', icon: ShieldCheck, path: '/staff/confirm-tickets' },
    { id: 'ban-do-an', label: 'Bán đồ ăn', icon: Hamburger, path: '/staff/concession' },
    { id: 'check-in', label: 'Check-in Ca làm', icon: Clock, path: '/staff/checkin' },
    { id: 'khach-hang', label: 'Khách hàng', icon: Users, path: '/staff/customers' },
  ]
  const pathname = usePathname()
  return (
    <aside className="w-64 bg-sidebar border-r border-sidebar-border flex flex-col">
      {/* Logo */}
      <div className="p-6">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 bg-primary rounded-[10px] flex items-center justify-center shadow-sm">
            <Film className="w-6 h-6 text-primary-foreground" />
          </div>
          <div>
            <h2 className="text-foreground font-semibold">CineBooking</h2>
            <p className="text-xs text-muted-foreground">Staff Portal</p>
          </div>
        </div>
      </div>

      {/* Menu */}
      <nav className="flex-1 px-3">
        <ul className="space-y-1">
          {menuItems.map(item => {
            const Icon = item.icon
            const isActive =
              item.path === '/staff/sell'
                ? pathname === '/staff/sell'
                : pathname?.startsWith(item.path)

            return (
              <li key={item.id}>
                <Link
                  href={item.path}
                  suppressHydrationWarning
                  className={`flex items-center gap-3 px-4 py-3 rounded-xl transition-all duration-200 font-medium ${
                    isActive
                      ? 'bg-[#6C63FF] text-white shadow-md shadow-[#6c63ff]/20'
                      : 'text-gray-600 hover:bg-gray-50 hover:text-[#6C63FF]'
                  }`}
                >
                  <Icon className="w-5 h-5" />
                  <span className="font-medium">{item.label}</span>
                </Link>
              </li>
            )
          })}
        </ul>
      </nav>

      {/* Footer */}
      <div className="p-4 border-t border-sidebar-border">
        <p className="text-xs text-muted-foreground text-center">© 2025 CineBooking</p>
      </div>
    </aside>
  )
}

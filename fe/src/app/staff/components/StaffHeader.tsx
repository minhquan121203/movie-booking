'use client'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar'
import { Button } from '@/components/ui/button'
import { useUserStore } from '@/store/userStore'
import { LogoutButton } from '@/app/components/shared/LogoutButton'

export function StaffHeader() {
  const { user } = useUserStore()

  return (
    <header className="bg-card border-b border-border px-4 md:px-8 py-3 md:py-4 flex items-center justify-end">
      <div className="flex items-center gap-3">
        {/* Staff info */}
        <div className="hidden sm:block text-right mr-2">
          <p className="text-sm font-medium leading-none">{user?.fullName || 'Nhân viên'}</p>
          <p className="text-xs text-muted-foreground">{user?.role === 'staff' ? 'Nhân viên' : user?.role}</p>
        </div>

        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button variant="ghost" className="relative h-10 w-10 rounded-full">
              <Avatar className="h-10 w-10 border border-border">
                <AvatarImage src={user?.profilePicture || ''} alt={user?.fullName || 'Nhân viên'} />
                <AvatarFallback>{user?.fullName?.charAt(0).toUpperCase() || 'S'}</AvatarFallback>
              </Avatar>
            </Button>
          </DropdownMenuTrigger>
          
          <DropdownMenuContent className="w-56" align="end" forceMount>
            <DropdownMenuLabel className="font-normal">
              <div className="flex flex-col space-y-1">
                <p className="text-sm font-medium leading-none">{user?.fullName || 'Nhân viên'}</p>
                <p className="text-xs leading-none text-muted-foreground">{user?.email || 'Đang tải...'}</p>
              </div>
            </DropdownMenuLabel>
            <DropdownMenuSeparator />

            <DropdownMenuSeparator />
            <DropdownMenuItem
              className="p-0! focus:bg-transparent!"
              onSelect={e => {
                e.preventDefault() // QUAN TRỌNG: Ngăn Dropdown đóng ngay lập tức
              }}
            >
              <LogoutButton className="w-full bg-white text-gray-700 hover:bg-gray-100 hover:text-red-600  shadow-none justify-start" />
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      </div>
    </header>
  )
}
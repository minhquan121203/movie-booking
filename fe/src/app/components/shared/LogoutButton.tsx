'use client'

import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from '@/components/ui/alert-dialog'
import { Button } from '@/components/ui/button'
import { useUserStore } from '@/store/userStore'
import { LogOut } from 'lucide-react'
import { useRouter } from 'next/navigation'
import { useState } from 'react'

// Kế thừa trực tiếp từ ButtonProps của shadcn/ui để có đầy đủ variant, size, asChild...
interface LogoutButtonProps {
  showIcon?: boolean
  text?: string
  variant?:
    | 'default'
    | 'link'
    | 'destructive'
    | 'outline'
    | 'secondary'
    | 'ghost'
    | null
    | undefined
  className?: string
}

export function LogoutButton({
  className,
  variant = 'default',
  showIcon = true,
  text = 'Đăng xuất',
  ...props
}: LogoutButtonProps) {
  const { logout } = useUserStore()
  const router = useRouter()
  const [open, setOpen] = useState(false)

  const handleLogout = () => {
    logout()
    setOpen(false)
    router.push('/login')
    router.refresh()
  }

  return (
    <AlertDialog open={open} onOpenChange={setOpen}>
      <AlertDialogTrigger asChild>
        {/* Truyền toàn bộ props còn lại vào Button (vd: size, className, disabled...) */}
        <Button variant={variant} className={className} {...props}>
          {showIcon && <LogOut className="mr-2 h-4 w-4" />}
          <span>{text}</span>
        </Button>
      </AlertDialogTrigger>

      <AlertDialogContent>
        <AlertDialogHeader>
          <AlertDialogTitle>Xác nhận đăng xuất</AlertDialogTitle>
          <AlertDialogDescription>
            Bạn có chắc chắn muốn đăng xuất khỏi hệ thống không?
          </AlertDialogDescription>
        </AlertDialogHeader>
        <AlertDialogFooter>
          <AlertDialogCancel>Hủy bỏ</AlertDialogCancel>
          <AlertDialogAction
            onClick={handleLogout}
            className="bg-red-600 hover:bg-red-700 text-white"
          >
            Đăng xuất
          </AlertDialogAction>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  )
}

'use client'
import Link from 'next/link'
import { Button } from '@/components/ui/button' // Nếu bạn dùng Shadcn UI
import { Home, MoveLeft } from 'lucide-react'

export default function NotFound() {
  return (
    <div className="h-screen w-full flex flex-col items-center justify-center bg-gray-50 px-4">
      <div className="text-center space-y-6 max-w-md mx-auto">
        {/* Số 404 lớn */}
        <h1 className="text-9xl font-extrabold text-gray-200 tracking-widest">404</h1>

        <div className="absolute rotate-12 bg-[#FF6A3D] px-2 text-sm rounded">Page Not Found</div>

        <div className="space-y-2">
          <h2 className="text-3xl font-bold text-gray-900">Úi! Bạn đi lạc rồi.</h2>
          <p className="text-gray-600">
            Trang bạn đang tìm kiếm không tồn tại hoặc bạn không có quyền truy cập vào khu vực này.
          </p>
        </div>

        <div className="flex flex-col sm:flex-row gap-4 justify-center mt-8">
          <Button asChild variant="default" className="gap-2">
            <Link href="/">
              <Home className="w-4 h-4" />
              Về Trang Chủ
            </Link>
          </Button>

          <Button asChild variant="outline" className="gap-2">
            <Link href="#" onClick={() => history.back()}>
              {' '}
              {/* Nút quay lại */}
              <MoveLeft className="w-4 h-4" />
              Quay Lại
            </Link>
          </Button>
        </div>
      </div>

      {/* Footer trang trí nhỏ */}
      <div className="mt-12 text-sm text-gray-400">
        Movie Booking System © {new Date().getFullYear()}
      </div>
    </div>
  )
}

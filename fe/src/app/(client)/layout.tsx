import type { Metadata } from 'next'
import { Providers } from '../providers'
import { Header } from '@/app/(client)/components/layout/header'
import { Footer } from '@/app/(client)/components/layout/footer'

export const metadata: Metadata = {
  title: 'CineBooking - Đặt vé xem phim online',
  description: 'Nền tảng đặt vé xem phim hàng đầu Việt Nam',
}

export default function ClientLayout({ children }: { children: React.ReactNode }) {
  return (
    <Providers>
      <div className="flex min-h-screen flex-col">
        <Header />
        <main className="flex-1">{children}</main>
        <Footer />
      </div>
    </Providers>
  )
}

import GoogleAuthProvider from './components/GoogleAuthProvider'
import { NotificationProvider } from '@/providers/NotificationProvider'
import type { Metadata } from 'next'
import { Poppins } from 'next/font/google'
import NextTopLoader from 'nextjs-toploader'
import './globals.css'
import ClientProvider from './ClientProvider'
import Chatbot from './components/Chatbot' 

// Thêm fallback để giảm CLS nếu font load chậm
const poppins = Poppins({
  subsets: ['latin'],
  display: 'swap', // Nếu vẫn bị CLS nặng, hãy đổi thành 'optional'
  weight: ['400', '500', '600', '700'],
  variable: '--font-poppins',
})

export const metadata: Metadata = {
  title: 'CineBooking - Đặt vé xem phim online',
  description: 'Nền tảng đặt vé xem phim hàng đầu Việt Nam',
}

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="vi" suppressHydrationWarning>
      {/* 1. Đưa class font vào body để áp dụng toàn cục ngay lập tức */}
      <body suppressHydrationWarning className={`${poppins.variable} font-sans antialiased`}>
        <NextTopLoader
          color="#6c63ff"
          initialPosition={0.08}
          crawlSpeed={200}
          height={3}
          crawl={true}
          showSpinner={false}
          easing="ease"
          speed={200}
          shadow="0 0 10px #6c63ff,0 0 5px #6c63ff"
          zIndex={9999}
        />

        {/* 2. Provider nên nằm TRONG body để tránh lỗi DOM structure */}
        <GoogleAuthProvider>
          <NotificationProvider>
            <ClientProvider>
              {children}
              <Chatbot />
            </ClientProvider>
          </NotificationProvider>
        </GoogleAuthProvider>
      </body>
    </html>
  )
}

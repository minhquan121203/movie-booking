// app/admin/layout.tsx
'use client'
import { Sidebar } from './components/Sidebar'
import { ThemeProvider } from '@/components/theme-provider'
import { Toaster } from '@/components/ui/sonner'

export default function AdminLayout({ children }: { children: React.ReactNode }) {
  return (
    <ThemeProvider attribute="class" defaultTheme="light" forcedTheme="light" enableSystem={false}>
      <div className="flex min-h-screen bg-bg-primary text-text-primary light  ">
        <Sidebar />
        <main className="flex-1 pl-64">{children}</main>
      </div>
      <Toaster position="top-right" />
    </ThemeProvider>
  )
}

import { StaffHeader } from './components/StaffHeader'
import { StaffSidebar } from './components/StaffSidebar'
import { ThemeProvider } from '@/components/theme-provider'

export default function StaffLayout({ children }: { children: React.ReactNode }) {
  return (
    <ThemeProvider attribute="class" defaultTheme="light" forcedTheme="light" enableSystem={false}>
      <div className="flex h-screen bg-secondary">
        <StaffSidebar />
        <div className="flex-1 flex flex-col overflow-hidden w-full">
          <StaffHeader />
          <main className="flex-1 overflow-y-auto p-4 md:p-6 lg:p-8">{children}</main>
        </div>
      </div>
    </ThemeProvider>
  )
}

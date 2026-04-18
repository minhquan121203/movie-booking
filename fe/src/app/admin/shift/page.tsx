// app/(admin)/shift-manager/page.tsx
'use client'

import { useState } from 'react'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { Settings, CalendarRange, Users } from 'lucide-react' // Thêm icon Sparkles cho đẹp
import ShiftTemplatesTab from './shift-templates-tab'
import WorkPlanningTab from './work-planning-tab'
import ShiftAssignmentsTab from './shift-assignments-tab'

export default function WorkShiftManagementPage() {
  const [activeTab, setActiveTab] = useState('planning')

  return (
    <main className="flex-1 overflow-y-auto bg-[#F8F8F9] h-screen">
      <div className="max-w-[1440px] mx-auto p-8 space-y-8">
        {/* Header Section */}
        <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
          <div>
            <h1 className="text-3xl font-bold text-gray-900 tracking-tight">Quản Lý Ca Làm Việc</h1>
            <p className="text-gray-500 mt-1 flex items-center gap-2">
              Hệ thống quản lý lịch làm việc tập trung
            </p>
          </div>
        </div>

        {/* Modern Tabs Section */}
        <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-8">
          {/* Tab List Container */}
          <div className="flex justify-center md:justify-start">
            <TabsList className="h-auto p-1.5 bg-white border border-gray-200 rounded-full shadow-sm gap-1 inline-flex">
              <TabsTrigger
                value="templates"
                className="rounded-full px-6 py-2.5 text-sm font-medium transition-all duration-300
                data-[state=active]:bg-[#6C63FF] data-[state=active]:text-white data-[state=active]:shadow-md data-[state=active]:shadow-indigo-200
                text-gray-500 hover:text-gray-900 hover:bg-gray-100"
              >
                <Settings className="w-4 h-4 mr-2" />
                1. Cấu Hình
              </TabsTrigger>

              <TabsTrigger
                value="planning"
                className="rounded-full px-6 py-2.5 text-sm font-medium transition-all duration-300
                data-[state=active]:bg-[#6C63FF] data-[state=active]:text-white data-[state=active]:shadow-md data-[state=active]:shadow-indigo-200
                text-gray-500 hover:text-gray-900 hover:bg-gray-100"
              >
                <CalendarRange className="w-4 h-4 mr-2" />
                2. Lập Kế Hoạch
              </TabsTrigger>

              <TabsTrigger
                value="assignments"
                className="rounded-full px-6 py-2.5 text-sm font-medium transition-all duration-300
                data-[state=active]:bg-[#6C63FF] data-[state=active]:text-white data-[state=active]:shadow-md data-[state=active]:shadow-indigo-200
                text-gray-500 hover:text-gray-900 hover:bg-gray-100"
              >
                <Users className="w-4 h-4 mr-2" />
                3. Vận Hành
              </TabsTrigger>
            </TabsList>
          </div>

          {/* Tab Contents with Animation Fade-in */}
          <div className="animate-in fade-in-50 slide-in-from-bottom-2 duration-500">
            <TabsContent value="templates" className="focus-visible:ring-0 mt-0">
              <ShiftTemplatesTab />
            </TabsContent>

            <TabsContent value="planning" className="focus-visible:ring-0 mt-0">
              <WorkPlanningTab />
            </TabsContent>

            <TabsContent value="assignments" className="focus-visible:ring-0 mt-0">
              <ShiftAssignmentsTab />
            </TabsContent>
          </div>
        </Tabs>
      </div>
    </main>
  )
}

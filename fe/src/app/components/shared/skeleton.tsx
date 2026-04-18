import { Skeleton } from '@/components/ui/skeleton'
import { Loader2 } from 'lucide-react'
export const TableSkeleton = () => (
  <div className="bg-white rounded-xl border border-gray-200 shadow-sm overflow-hidden">
    {/* Table Header Skeleton */}
    <div className="bg-gray-50 border-b border-gray-200 p-4">
      <div className="grid grid-cols-6 gap-4">
        {[...Array(6)].map((_, i) => (
          <Skeleton key={i} className="h-5 w-full" />
        ))}
      </div>
    </div>

    {/* Table Rows Skeleton */}
    <div className="divide-y divide-gray-200">
      {[...Array(5)].map((_, i) => (
        <div key={i} className="p-4">
          <div className="grid grid-cols-6 gap-4 items-center">
            <div className="flex items-center gap-3">
              <Skeleton className="h-10 w-10 rounded-full" />
              <div className="space-y-2">
                <Skeleton className="h-4 w-24" />
                <Skeleton className="h-3 w-32" />
              </div>
            </div>
            <Skeleton className="h-4 w-full" />
            <Skeleton className="h-4 w-full" />
            <Skeleton className="h-6 w-16 rounded-full" />
            <Skeleton className="h-4 w-20" />
            <div className="flex gap-2">
              <Skeleton className="h-8 w-8 rounded-lg" />
              <Skeleton className="h-8 w-8 rounded-lg" />
            </div>
          </div>
        </div>
      ))}
    </div>
  </div>
)

// Loading overlay for transitions
export const LoadingOverlay = () => (
  <div className="absolute inset-0 bg-white/50 backdrop-blur-sm z-10 flex items-center justify-center rounded-xl">
    <div className="bg-white px-6 py-4 rounded-lg shadow-lg flex items-center gap-3">
      <Loader2 className="w-5 h-5 animate-spin text-primary" />
      <span className="text-gray-700 font-medium">Đang tải dữ liệu...</span>
    </div>
  </div>
)

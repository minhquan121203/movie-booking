'use client'

import {
  Pagination,
  PaginationContent,
  PaginationEllipsis,
  PaginationItem,
  PaginationLink,
  PaginationNext,
  PaginationPrevious,
} from '@/components/ui/pagination'
import { ChevronLeft, ChevronRight } from 'lucide-react'

interface PaginationProps {
  currentPage: number
  totalPages: number
  onPageChange: (page: number) => void
  showPageNumbers?: number // Số trang hiển thị (mặc định 5)
}

export function CustomPagination({
  currentPage,
  totalPages,
  onPageChange,
  showPageNumbers = 5,
}: PaginationProps) {
  // Không hiển thị nếu chỉ có 1 trang
  if (totalPages <= 1) return null

  // Tính toán range của page numbers cần hiển thị
  const getPageNumbers = () => {
    const pages: (number | 'ellipsis')[] = []
    const halfShow = Math.floor(showPageNumbers / 2)

    let startPage = Math.max(1, currentPage - halfShow)
    let endPage = Math.min(totalPages, currentPage + halfShow)

    // Điều chỉnh nếu ở đầu hoặc cuối
    if (currentPage <= halfShow) {
      endPage = Math.min(showPageNumbers, totalPages)
    }
    if (currentPage >= totalPages - halfShow) {
      startPage = Math.max(1, totalPages - showPageNumbers + 1)
    }

    // Thêm trang đầu và ellipsis
    if (startPage > 1) {
      pages.push(1)
      if (startPage > 2) pages.push('ellipsis')
    }

    // Thêm các trang ở giữa
    for (let i = startPage; i <= endPage; i++) {
      pages.push(i)
    }

    // Thêm ellipsis và trang cuối
    if (endPage < totalPages) {
      if (endPage < totalPages - 1) pages.push('ellipsis')
      pages.push(totalPages)
    }

    return pages
  }

  const pages = getPageNumbers()

  return (
    <Pagination className="mt-8">
      <PaginationContent>
        {/* Previous Button */}
        <PaginationItem>
          <PaginationPrevious
            size="sm"
            onClick={() => currentPage > 1 && onPageChange(currentPage - 1)}
            className={
              currentPage === 1
                ? 'pointer-events-none opacity-50'
                : 'cursor-pointer hover:bg-accent hover:text-accent-foreground'
            }
            aria-disabled={currentPage === 1}
          >
            <ChevronLeft className="h-4 w-4" />
            <span className="hidden sm:inline">Trước</span>
          </PaginationPrevious>
        </PaginationItem>

        {/* Page Numbers */}
        {pages.map((page, index) => (
          <PaginationItem key={`${page}-${index}`}>
            {page === 'ellipsis' ? (
              <PaginationEllipsis />
            ) : (
              <PaginationLink
                size="sm"
                onClick={() => onPageChange(page)}
                isActive={currentPage === page}
                className={
                  currentPage === page
                    ? 'bg-primary! text-primary-foreground! hover:bg-primary/90!'
                    : 'cursor-pointer! hover:bg-accent! hover:text-accent-foreground!'
                }
              >
                {page}
              </PaginationLink>
            )}
          </PaginationItem>
        ))}

        {/* Next Button */}
        <PaginationItem>
          <PaginationNext
            size="sm"
            onClick={() => currentPage < totalPages && onPageChange(currentPage + 1)}
            className={
              currentPage === totalPages
                ? 'pointer-events-none opacity-50'
                : 'cursor-pointer hover:bg-accent! hover:text-accent-foreground!'
            }
            aria-disabled={currentPage === totalPages}
          >
            <span className="hidden sm:inline">Sau</span>
            <ChevronRight className="h-4 w-4" />
          </PaginationNext>
        </PaginationItem>
      </PaginationContent>
    </Pagination>
  )
}

// Pagination Info Component (optional)
interface PaginationInfoProps {
  currentPage: number
  totalPages: number
  totalItems: number
  itemsPerPage: number
}

export function PaginationInfo({
  currentPage,
  totalPages,
  totalItems,
  itemsPerPage,
}: PaginationInfoProps) {
  const startItem = (currentPage - 1) * itemsPerPage + 1
  const endItem = Math.min(currentPage * itemsPerPage, totalItems)

  return (
    <div className="flex items-center justify-between text-sm text-muted-foreground">
      <p>
        Hiển thị <span className="font-medium text-foreground">{startItem}</span> đến{' '}
        <span className="font-medium text-foreground">{endItem}</span> trong tổng số{' '}
        <span className="font-medium text-foreground">{totalItems}</span> kết quả
      </p>
      <p>
        Trang <span className="font-medium text-foreground">{currentPage}</span> /{' '}
        <span className="font-medium text-foreground">{totalPages}</span>
      </p>
    </div>
  )
}

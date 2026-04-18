import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Edit, Trash2 } from 'lucide-react'
import { Product } from '@/types/product'
import Image from 'next/image'

interface ProductTableProps {
  products: Product[]
  isLoading: boolean
  onEdit: (product: Product) => void
  onDelete: (id: string) => void
}

export function ProductTable({ products, isLoading, onEdit, onDelete }: ProductTableProps) {
  if (isLoading) {
    return <div className="text-center py-10">Đang tải dữ liệu...</div>
  }

  if (products.length === 0) {
    return <div className="text-center py-10 text-gray-500">Không tìm thấy sản phẩm nào.</div>
  }

  const getCategoryBadge = (category: string) => {
    const badges: Record<string, { bg: string; text: string; label: string }> = {
      Popcorn: { bg: 'bg-yellow-100', text: 'text-yellow-700', label: 'Bắp rang' },
      Drink: { bg: 'bg-blue-100', text: 'text-blue-700', label: 'Nước uống' },
      Combo: { bg: 'bg-purple-100', text: 'text-purple-700', label: 'Combo' },
      Snack: { bg: 'bg-orange-100', text: 'text-orange-700', label: 'Snack' },
    }
    return badges[category] || { bg: 'bg-gray-100', text: 'text-gray-700', label: category }
  }

  return (
    <div className="bg-white border border-gray-200 rounded-xl overflow-hidden shadow-sm">
      <Table>
        <TableHeader className="bg-gray-50/50">
          <TableRow className="hover:bg-gray-100/50!">
            <TableHead>Hình ảnh</TableHead>
            <TableHead>Thông tin sản phẩm</TableHead>
            <TableHead>Danh mục</TableHead>
            <TableHead className="text-center">Size</TableHead>
            <TableHead className="text-center">Giá</TableHead>
            <TableHead className="text-center">Kho</TableHead>
            <TableHead className="text-right">Thao tác</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {products.map(product => {
            const categoryBadge = getCategoryBadge(product.category)
            return (
              <TableRow key={product._id} className="hover:bg-gray-50/50 transition-colors">
                <TableCell>
                  <div className="relative w-12 h-12 rounded-md overflow-hidden bg-gray-100 border border-gray-200">
                    <Image
                      src={product.imageUrl || '/placeholder-product.png'}
                      alt={product.name}
                      fill
                      className="object-cover"
                    />
                  </div>
                </TableCell>
                <TableCell>
                  <div className="font-medium text-gray-900">{product.name}</div>
                  <div className="flex items-center gap-2 text-xs text-gray-500 mt-1">
                    {product.featured && (
                      <span className="bg-yellow-100 text-yellow-700 px-1.5 py-0.5 rounded text-[10px] font-medium">
                        ⭐ Nổi bật
                      </span>
                    )}
                    {product.discount > 0 && (
                      <span className="bg-red-100 text-red-700 px-1.5 py-0.5 rounded text-[10px] font-medium">
                        -{product.discount}%
                      </span>
                    )}
                  </div>
                </TableCell>
                <TableCell>
                  <Badge
                    className={`${categoryBadge.bg} ${categoryBadge.text} hover:${categoryBadge.bg}`}
                  >
                    {categoryBadge.label}
                  </Badge>
                </TableCell>
                <TableCell className="text-center">
                  <span className="text-sm font-medium text-gray-700">{product.size}</span>
                </TableCell>
                <TableCell className="text-center">
                  <div className="flex flex-col items-center">
                    {product.discount > 0 && product.originalPrice ? (
                      <>
                        <div className="font-semibold text-green-600">
                          {(product.originalPrice * (1 - product.discount / 100)).toLocaleString(
                            'vi-VN'
                          )}
                          đ
                        </div>
                        <div className="text-xs text-gray-400 line-through">
                          {product.originalPrice.toLocaleString('vi-VN')}đ
                        </div>
                      </>
                    ) : (
                      <div className="font-semibold text-green-600">
                        {product.price.toLocaleString('vi-VN')}đ
                      </div>
                    )}
                  </div>
                </TableCell>
                <TableCell className="text-center">
                  <div className="flex flex-col items-center gap-1">
                    <Badge
                      className={`whitespace-nowrap ${
                        product.inStock
                          ? 'bg-green-100 text-green-700 hover:bg-green-100'
                          : 'bg-red-100 text-red-700 hover:bg-red-100'
                      }`}
                    >
                      {product.inStock ? 'Còn hàng' : 'Hết hàng'}
                    </Badge>
                    <span className="text-xs text-gray-500">SL: {product.stockQuantity}</span>
                  </div>
                </TableCell>
                <TableCell className="text-right">
                  <div className="flex justify-end gap-2">
                    <Button
                      size="icon"
                      variant="ghost"
                      className="h-8 w-8 text-blue-600 hover:text-blue-700 hover:bg-blue-50"
                      onClick={() => onEdit(product)}
                    >
                      <Edit className="w-4 h-4" />
                    </Button>
                    <Button
                      size="icon"
                      variant="ghost"
                      className="h-8 w-8 text-red-600 hover:text-red-700 hover:bg-red-50"
                      onClick={() => onDelete(product._id)}
                    >
                      <Trash2 className="w-4 h-4" />
                    </Button>
                  </div>
                </TableCell>
              </TableRow>
            )
          })}
        </TableBody>
      </Table>
    </div>
  )
}

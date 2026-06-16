'use client'

import { Card } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { ShoppingCart, Plus, Minus, X, ShoppingBag } from 'lucide-react'
import type { Product } from '@/types/product'

export interface CartProduct {
  productId: string
  name: string
  price: number
  quantity: number
  size?: string
}

interface ProductSelectorProps {
  products: Product[]
  cart: CartProduct[]
  onAdd: (product: Product) => void
  onRemove: (productId: string) => void
  onClear: () => void
}

const CATEGORY_LABELS: Record<string, string> = {
  Popcorn: '🍿 Bắp rang',
  Drink: '🥤 Nước uống',
  Combo: '🎁 Combo',
  Snack: '🍫 Snack',
}

export function ProductSelector({ products, cart, onAdd, onRemove, onClear }: ProductSelectorProps) {
  const grouped = products.reduce((acc, p) => {
    if (!acc[p.category]) acc[p.category] = []
    acc[p.category].push(p)
    return acc
  }, {} as Record<string, Product[]>)

  const totalItems = cart.reduce((s, i) => s + i.quantity, 0)
  const totalAmount = cart.reduce((s, i) => s + i.price * i.quantity, 0)

  return (
    <Card className="p-4 border border-gray-200 shadow-sm">
      {/* Header */}
      <div className="flex items-center justify-between mb-3">
        <div className="flex items-center gap-2">
          <div className="w-8 h-8 bg-amber-100 rounded-lg flex items-center justify-center">
            <ShoppingBag className="w-4 h-4 text-amber-600" />
          </div>
          <div>
            <h3 className="font-semibold text-gray-900 text-sm">Thêm bắp nước (tùy chọn)</h3>
            {totalItems > 0 && (
              <p className="text-xs text-amber-600 font-medium">
                {totalItems} sản phẩm · {totalAmount.toLocaleString('vi-VN')}đ
              </p>
            )}
          </div>
        </div>
        {totalItems > 0 && (
          <button
            onClick={onClear}
            className="text-xs text-red-400 hover:text-red-600 flex items-center gap-1"
          >
            <X className="w-3 h-3" /> Xóa hết
          </button>
        )}
      </div>

      {/* Cart summary nếu có sản phẩm */}
      {cart.length > 0 && (
        <div className="mb-3 bg-amber-50 border border-amber-200 rounded-lg p-2 flex flex-wrap gap-1.5">
          {cart.map(item => (
            <div key={item.productId} className="flex items-center gap-1 bg-white border border-amber-200 rounded-md px-2 py-1">
              <span className="text-xs font-medium text-gray-700">{item.name}</span>
              {item.size && item.size !== 'N/A' && (
                <Badge variant="outline" className="text-[10px] px-1 py-0">{item.size}</Badge>
              )}
              <span className="text-xs text-amber-600 font-bold">×{item.quantity}</span>
            </div>
          ))}
        </div>
      )}

      {/* Product grid theo category */}
      <div className="space-y-3">
        {Object.entries(grouped).map(([category, items]) => (
          <div key={category}>
            <p className="text-[11px] font-bold text-gray-500 uppercase mb-2">
              {CATEGORY_LABELS[category] || category}
            </p>
            <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
              {items.map(item => {
                const cartItem = cart.find(c => c.productId === item._id)
                const qty = cartItem?.quantity || 0

                return (
                  <div
                    key={item._id}
                    className={`border rounded-lg p-2 transition-all ${
                      qty > 0
                        ? 'border-amber-400 bg-amber-50'
                        : 'border-gray-200 hover:border-amber-300'
                    }`}
                  >
                    <div className="mb-1.5">
                      <div className="flex items-center gap-1 flex-wrap">
                        <span className="font-medium text-xs text-gray-900 line-clamp-1">{item.name}</span>
                        {item.size && item.size !== 'N/A' && (
                          <Badge variant="outline" className="text-[10px] px-1 py-0">{item.size}</Badge>
                        )}
                      </div>
                      <p className="text-amber-600 font-bold text-xs mt-0.5">
                        {item.price.toLocaleString('vi-VN')}đ
                      </p>
                    </div>

                    {qty === 0 ? (
                      <Button
                        size="sm"
                        variant="outline"
                        className="w-full h-7 text-xs border-amber-300 text-amber-700 hover:bg-amber-50"
                        onClick={() => onAdd(item)}
                        disabled={!item.inStock}
                      >
                        <Plus className="w-3 h-3 mr-1" /> Thêm
                      </Button>
                    ) : (
                      <div className="flex items-center gap-1">
                        <Button
                          size="sm"
                          variant="outline"
                          className="flex-1 h-7 px-0"
                          onClick={() => onRemove(item._id)}
                        >
                          <Minus className="w-3 h-3" />
                        </Button>
                        <span className="text-sm font-bold text-center w-6">{qty}</span>
                        <Button
                          size="sm"
                          className="flex-1 h-7 px-0 bg-amber-500 hover:bg-amber-600"
                          onClick={() => onAdd(item)}
                          disabled={qty >= item.stockQuantity}
                        >
                          <Plus className="w-3 h-3" />
                        </Button>
                      </div>
                    )}
                  </div>
                )
              })}
            </div>
          </div>
        ))}

        {products.length === 0 && (
          <div className="text-center py-6 text-gray-400">
            <ShoppingCart className="w-10 h-10 mx-auto mb-2 opacity-30" />
            <p className="text-sm">Không có sản phẩm</p>
          </div>
        )}
      </div>
    </Card>
  )
}

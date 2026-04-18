import React, { useState } from 'react'
import { X, Plus, Minus, ShoppingCart, Loader2 } from 'lucide-react'
import { useProducts } from '@/lib/api/products'
import type { Product } from '@/types/product'

// Types
interface CartItem extends Product {
  quantity: number
}

interface FoodSalesModalProps {
  isOpen: boolean
  onClose: () => void
  onConfirm: (items: CartItem[]) => void
  bookingCode: string
}

export function FoodSalesModal({ isOpen, onClose, onConfirm, bookingCode }: FoodSalesModalProps) {
  const [cart, setCart] = useState<CartItem[]>([])

  // Fetch products from API
  const {
    data: products,
    isLoading,
    error,
  } = useProducts({
    isActive: true,
    inStock: true,
  })

  if (!isOpen) return null

  const addToCart = (item: Product) => {
    setCart(prev => {
      const existing = prev.find(i => i._id === item._id)
      if (existing) {
        return prev.map(i => (i._id === item._id ? { ...i, quantity: i.quantity + 1 } : i))
      }
      return [...prev, { ...item, quantity: 1 }]
    })
  }

  const removeFromCart = (itemId: string) => {
    setCart(prev => {
      const existing = prev.find(i => i._id === itemId)
      if (existing && existing.quantity > 1) {
        return prev.map(i => (i._id === itemId ? { ...i, quantity: i.quantity - 1 } : i))
      }
      return prev.filter(i => i._id !== itemId)
    })
  }

  const getTotalAmount = () => {
    return cart.reduce((sum, item) => sum + item.price * item.quantity, 0)
  }

  const handleConfirm = () => {
    console.log('=== XÁC NHẬN THÊM SẢN PHẨM ===')
    console.log('Mã vé:', bookingCode)
    console.log(
      'Danh sách sản phẩm:',
      cart.map(item => ({
        id: item._id,
        tên: item.name,
        loại: item.category,
        kích_thước: item.size,
        số_lượng: item.quantity,
        đơn_giá: item.price,
        thành_tiền: item.price * item.quantity,
      }))
    )
    console.log('Tổng tiền:', getTotalAmount().toLocaleString('vi-VN'), 'VNĐ')
    console.log('============================')

    onConfirm(cart)
    setCart([])
  }

  const handleClose = () => {
    setCart([])
    onClose()
  }

  // Group products by category
  const groupedProducts =
    products?.reduce(
      (acc, item) => {
        if (!acc[item.category]) {
          acc[item.category] = []
        }
        acc[item.category].push(item)
        return acc
      },
      {} as Record<string, Product[]>
    ) || {}

  // Category display names
  const categoryNames: Record<string, string> = {
    Popcorn: 'Bắp rang',
    Drink: 'Nước uống',
    Combo: 'Combo',
    Snack: 'Snack',
  }

  // Category icons
  const categoryIcons: Record<string, string> = {
    Popcorn: '🍿',
    Drink: '🥤',
    Combo: '🎁',
    Snack: '🍫',
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm">
      <div className="bg-white rounded-xl shadow-2xl max-w-4xl w-full max-h-[90vh] flex flex-col">
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-amber-100 rounded-lg flex items-center justify-center">
              <ShoppingCart className="w-5 h-5 text-amber-600" />
            </div>
            <div>
              <h2 className="text-xl font-semibold text-gray-900">Sản phẩm bán kèm</h2>
              <p className="text-sm text-gray-500">Chọn sản phẩm để bán thêm cho khách</p>
            </div>
          </div>
          <button
            onClick={handleClose}
            className="p-2 hover:bg-gray-100 rounded-full transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Content */}
        <div className="flex-1 overflow-y-auto p-6">
          {/* Loading State */}
          {isLoading && (
            <div className="flex items-center justify-center py-12">
              <Loader2 className="w-8 h-8 animate-spin text-amber-500" />
              <span className="ml-3 text-gray-600">Đang tải sản phẩm...</span>
            </div>
          )}

          {/* Error State */}
          {error && (
            <div className="text-center py-12">
              <p className="text-red-600">Không thể tải danh sách sản phẩm</p>
              <p className="text-sm text-gray-500 mt-1">Vui lòng thử lại sau</p>
            </div>
          )}

          {/* Empty State */}
          {!isLoading && !error && (!products || products.length === 0) && (
            <div className="text-center py-12">
              <ShoppingCart className="w-16 h-16 text-gray-300 mx-auto mb-4" />
              <p className="text-gray-600">Chưa có sản phẩm nào</p>
            </div>
          )}

          {/* Products List */}
          {!isLoading && !error && products && products.length > 0 && (
            <>
              {Object.entries(groupedProducts).map(([category, items]) => (
                <div key={category} className="mb-6">
                  <div className="flex items-center gap-2 mb-3">
                    <div className="w-6 h-6 bg-amber-500 rounded flex items-center justify-center">
                      <span className="text-white text-xs font-bold">
                        {categoryIcons[category] || '📦'}
                      </span>
                    </div>
                    <h3 className="font-semibold text-gray-900">
                      {categoryNames[category] || category}
                    </h3>
                    <span className="text-sm text-gray-500">({items.length})</span>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    {items.map(item => {
                      const cartItem = cart.find(i => i._id === item._id)
                      const quantity = cartItem?.quantity || 0

                      return (
                        <div
                          key={item._id}
                          className="border border-gray-200 rounded-lg p-4 hover:border-amber-300 transition-all hover:shadow-md"
                        >
                          <div className="flex items-start justify-between mb-3">
                            <div className="flex-1">
                              <div className="flex items-center gap-2">
                                <h4 className="font-medium text-gray-900">{item.name}</h4>
                                {item.size && item.size !== 'N/A' && (
                                  <span className="text-xs bg-gray-100 text-gray-600 px-2 py-0.5 rounded">
                                    {item.size}
                                  </span>
                                )}
                              </div>
                              {item.description && (
                                <p className="text-xs text-gray-500 mt-1 line-clamp-1">
                                  {item.description}
                                </p>
                              )}
                              <div className="flex items-center gap-2 mt-2">
                                <p className="text-amber-600 font-semibold">
                                  {item.price.toLocaleString('vi-VN')}đ
                                </p>
                                {item.stockQuantity > 0 && (
                                  <span className="text-xs text-gray-500">
                                    • Còn {item.stockQuantity}
                                  </span>
                                )}
                              </div>
                            </div>
                          </div>

                          <div className="flex items-center justify-between">
                            {quantity === 0 ? (
                              <button
                                onClick={() => addToCart(item)}
                                disabled={!item.inStock || item.stockQuantity === 0}
                                className="flex-1 bg-amber-500 hover:bg-amber-600 text-white px-4 py-2 rounded-lg font-medium transition-colors flex items-center justify-center gap-2 disabled:bg-gray-300 disabled:cursor-not-allowed"
                              >
                                <Plus className="w-4 h-4" />
                                {!item.inStock || item.stockQuantity === 0 ? 'Hết hàng' : 'Thêm'}
                              </button>
                            ) : (
                              <div className="flex items-center gap-3 flex-1">
                                <button
                                  onClick={() => removeFromCart(item._id)}
                                  className="w-10 h-10 bg-gray-100 hover:bg-gray-200 rounded-lg flex items-center justify-center transition-colors"
                                >
                                  <Minus className="w-4 h-4" />
                                </button>
                                <span className="text-lg font-semibold text-gray-900 min-w-8 text-center">
                                  {quantity}
                                </span>
                                <button
                                  onClick={() => addToCart(item)}
                                  disabled={quantity >= item.stockQuantity}
                                  className="w-10 h-10 bg-amber-500 hover:bg-amber-600 rounded-lg flex items-center justify-center transition-colors disabled:bg-gray-300 disabled:cursor-not-allowed"
                                >
                                  <Plus className="w-4 h-4 text-white" />
                                </button>
                              </div>
                            )}
                          </div>
                        </div>
                      )
                    })}
                  </div>
                </div>
              ))}

              {/* Cart Summary */}
              {cart.length > 0 && (
                <div className="mt-6 p-4 bg-amber-50 rounded-lg border border-amber-200">
                  <h4 className="font-semibold text-gray-900 mb-3">Tóm tắt đơn hàng</h4>
                  <div className="space-y-2">
                    {cart.map(item => (
                      <div key={item._id} className="flex items-center justify-between text-sm">
                        <span className="text-gray-700">
                          {item.name} {item.size && item.size !== 'N/A' && `(${item.size})`} ×{' '}
                          {item.quantity}
                        </span>
                        <span className="font-medium text-gray-900">
                          {(item.price * item.quantity).toLocaleString('vi-VN')}đ
                        </span>
                      </div>
                    ))}
                    <div className="border-t border-amber-300 pt-2 mt-2">
                      <div className="flex items-center justify-between font-semibold text-base">
                        <span className="text-gray-900">Tổng cộng</span>
                        <span className="text-amber-600 text-lg">
                          {getTotalAmount().toLocaleString('vi-VN')}đ
                        </span>
                      </div>
                    </div>
                  </div>
                </div>
              )}
            </>
          )}
        </div>

        {/* Footer */}
        <div className="border-t p-6 bg-gray-50">
          <div className="flex gap-3">
            <button
              onClick={handleClose}
              className="flex-1 px-6 py-3 border border-gray-300 hover:bg-gray-100 rounded-lg font-medium transition-colors"
            >
              Hủy
            </button>
            <button
              onClick={handleConfirm}
              disabled={cart.length === 0}
              className="flex-1 px-6 py-3 bg-green-600 hover:bg-green-700 text-white rounded-lg font-medium transition-colors disabled:bg-gray-300 disabled:cursor-not-allowed flex items-center justify-center gap-2"
            >
              <ShoppingCart className="w-4 h-4" />
              Xác nhận thêm ({cart.length})
            </button>
          </div>
        </div>
      </div>
    </div>
  )
}

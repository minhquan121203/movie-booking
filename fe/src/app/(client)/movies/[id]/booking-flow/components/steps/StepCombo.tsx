import Image from 'next/image'
import { Loader2, PackageOpen } from 'lucide-react'
import { Product } from '@/types/product'
import { useProducts } from '@/lib/api/products'
import { CartItem } from '@/types'

interface StepComboProps {
  cartItems: CartItem[]
  updateCartItem: (product: Product, quantity: number) => void
}

export function StepCombo({ cartItems, updateCartItem }: StepComboProps) {
  // 1. Fetch data từ API
  const { data: products = null, isLoading } = useProducts({})
  const formatPrice = (price: number) => price.toLocaleString('vi-VN') + ' đ'

  // 2. Hàm render ảnh (Ưu tiên ảnh thật -> Fallback icon)
  const renderProductImage = (product: Product) => {
    // Nếu có link ảnh hợp lệ
    if (product.imageUrl && product.imageUrl.startsWith('http')) {
      return (
        <Image
          src={product.imageUrl}
          alt={product.name}
          width={400}
          height={400}
          className="w-full h-full object-cover"
          onError={e => {
            // Fallback nếu ảnh lỗi (ẩn ảnh đi hiện icon)
            e.currentTarget.style.display = 'none'
            e.currentTarget.nextElementSibling?.classList.remove('hidden')
          }}
        />
      )
    }

    let icon = '🍿'
    switch (product.category) {
      case 'Drink':
        icon = '🥤'
        break
      case 'Combo':
        icon = '🍿🥤'
        break
      case 'Snack':
        icon = '🌭'
        break
      default:
        icon = '🍿'
    }

    // Wrapper div để hiển thị fallback (hoặc là icon chính nếu không có ảnh)
    return (
      <div
        className={`text-4xl w-full h-full flex items-center justify-center ${product.imageUrl ? 'hidden' : ''}`}
      >
        {icon}
      </div>
    )
  }

  // 3. Loading State
  if (isLoading) {
    return (
      <div className="flex flex-col justify-center items-center py-20 space-y-4">
        <Loader2 className="w-10 h-10 animate-spin text-primary" />
        <span className="text-text-secondary font-medium">Đang tải danh sách Combo...</span>
      </div>
    )
  }
  if (!products) {
    return <>No data</>
  }

  //Xử lý sắp xếp Nổi bật (Featured) lên đầu

  const sortedProducts = [...products].sort((a, b) => {
    // Ưu tiên 1: Thằng nào Nổi bật (featured) thì đẩy lên trước
    if (a.featured && !b.featured) return -1;
    if (!a.featured && b.featured) return 1;
    
    // Ưu tiên 2: Nhóm Combo lên trước, rồi mới đến Nước, Bắp...
    if (a.category === 'Combo' && b.category !== 'Combo') return -1;
    if (a.category !== 'Combo' && b.category === 'Combo') return 1;
    
    return 0; // Cùng loại thì giữ nguyên vị trí
  });

  return (
    <div className="animate-in fade-in slide-in-from-bottom-4 duration-500">
      <h2 className="mb-6 text-text-primary text-xl font-bold">Bắp nước & Combo</h2>

      {/* 4. Empty State */}
      {sortedProducts.length === 0 ? (
        <div className="text-center py-12 bg-surface border-2 border-dashed border-border rounded-2xl">
          <PackageOpen className="w-12 h-12 text-text-secondary mx-auto mb-3 opacity-50" />
          <p className="text-text-secondary font-medium">Hiện chưa có sản phẩm nào.</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          
          {/* Đã thay đổi: Lặp qua mảng sortedProducts thay vì mảng products gốc */}
          {sortedProducts.map(product => {
            const currentItem = cartItems.find(item => item.product._id === product._id)
            const quantity = currentItem?.quantity || 0
            const isSelected = quantity > 0

            // Kiểm tra còn hàng không (nếu có field inStock)
            const isOutOfStock = product.inStock === false

            return (
              <div
                key={product._id}
                className={`relative bg-surface rounded-2xl p-4 border-2 transition-all duration-200 flex items-center gap-4 group ${
                  isSelected
                    ? 'border-primary bg-primary/5 shadow-[0_4px_20px_rgba(108,99,255,0.15)]'
                    : isOutOfStock
                      ? 'border-border opacity-60 cursor-not-allowed bg-bg-secondary'
                      : 'border-border hover:border-primary/50 hover:shadow-sm'
                }`}
              >
                {/* Product Image */}
                <div className="w-20 h-20 bg-bg-primary rounded-xl flex items-center justify-center shadow-sm border border-gray-100 shrink-0 overflow-hidden relative">
                  {renderProductImage(product)}
                  {isOutOfStock && (
                    <div className="absolute inset-0 bg-black/50 flex items-center justify-center">
                      <span className="text-text-primary text-[10px] font-bold px-1 py-0.5 bg-red-500 rounded">
                        HẾT HÀNG
                      </span>
                    </div>
                  )}
                </div>

                {/* Info */}
                <div className="flex-1 min-w-0">
                  <h3
                    className="text-text-primary font-semibold truncate text-base mb-0.5"
                    title={product.name}
                  >
                    {product.name}
                  </h3>
                  <p className="text-xs text-text-secondary mb-2 line-clamp-2 h-8 leading-4">
                    {product.description || product.category}
                  </p>

                  <div className="flex items-baseline gap-2">
                    <span className="text-accent font-bold text-lg">
                      {formatPrice(product.price)}
                    </span>
                    {/* ĐÃ XÓA CODE HIỂN THỊ GIÁ BỊ GẠCH NGANG Ở ĐÂY */}
                  </div>
                </div>

                {/* Counter Controls */}
                <div
                  className={`flex items-center gap-1 bg-bg-primary rounded-lg p-1 border border-border shadow-sm ${isOutOfStock ? 'pointer-events-none opacity-50' : ''}`}
                >
                  <button
                    onClick={() => updateCartItem(product, Math.max(0, quantity - 1))}
                    className="w-8 h-8 flex items-center justify-center rounded-md hover:bg-bg-primary/50 text-text-secondary font-bold transition-colors disabled:opacity-30 active:scale-95"
                    disabled={quantity === 0}
                  >
                    -
                  </button>
                  <span className="w-8 text-center font-bold text-text-primary select-none">
                    {quantity}
                  </span>
                  <button
                    onClick={() => updateCartItem(product, quantity + 1)}
                    className="w-8 h-8 flex items-center justify-center rounded-md bg-primary text-text-primary hover:bg-primary/90 font-bold transition-colors shadow-sm active:scale-95"
                  >
                    +
                  </button>
                </div>
              </div>
            )
          })}
        </div>
      )}
    </div>
  )
}
'use client'

import { useState, useEffect } from 'react'
import { Card } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Badge } from '@/components/ui/badge'
import {
  ShoppingCart,
  Plus,
  Minus,
  X,
  CreditCard,
  Loader2,
  CheckCircle2,
  User,
  Phone,
  Mail,
  Ticket,
  Printer,
} from 'lucide-react'
import { useProducts } from '@/lib/api/products'
import { useCreateConcession, type ConcessionProduct } from '@/lib/api/concession'
import { useNotification } from '@/providers/NotificationProvider'
import type { Product } from '@/types/product'
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from '@/components/ui/dialog'
import { QRCodeSVG } from 'qrcode.react'

interface CartItem extends Product {
  quantity: number
}

// In hóa đơn bắp nước
function printConcessionReceipt(transaction: any, cart: CartItem[], customerName: string) {
  const txId = transaction?.transactionId || '---'
  const totalAmount = (transaction?.totalAmount || 0).toLocaleString('vi-VN')
  const now = new Date().toLocaleString('vi-VN')
  const itemRows = cart.map(item =>
    `<div class="item-row">
      <span class="item-name">${item.name}${item.size && item.size !== 'N/A' ? ` (${item.size})` : ''} x${item.quantity}</span>
      <span class="item-price">${(item.price * item.quantity).toLocaleString('vi-VN')}d</span>
    </div>`
  ).join('')
  const html = `<!DOCTYPE html><html lang="vi"><head><meta charset="UTF-8" /><title>Hoa Don - ${txId}</title>
  <style>* { margin:0; padding:0; box-sizing:border-box; } body { font-family:Arial,sans-serif; background:#f5f5f5; display:flex; justify-content:center; padding:20px; } .receipt { background:white; width:320px; border-radius:12px; overflow:hidden; box-shadow:0 4px 20px rgba(0,0,0,.15); } .header { background:linear-gradient(135deg,#f59e0b,#d97706); color:white; padding:16px; text-align:center; } .header h1 { font-size:20px; font-weight:900; } .header p { font-size:10px; opacity:.8; margin-top:2px; } .body { padding:16px; } .meta { font-size:10px; color:#888; margin-bottom:12px; } .customer { font-size:13px; font-weight:700; color:#1a1a2e; margin-bottom:12px; } .items-title { font-size:9px; color:#888; text-transform:uppercase; font-weight:700; margin-bottom:8px; } .item-row { display:flex; justify-content:space-between; font-size:12px; padding:4px 0; border-bottom:1px solid #f0f0f0; } .item-name { color:#374151; } .item-price { font-weight:700; color:#d97706; } .total-row { display:flex; justify-content:space-between; align-items:center; background:#1a1a2e; color:white; padding:10px 14px; border-radius:8px; margin-top:12px; } .total-row .label { font-size:12px; opacity:.8; } .total-row .amount { font-size:16px; font-weight:900; } .tx-code { text-align:center; font-size:10px; color:#aaa; margin-top:10px; } .footer { text-align:center; font-size:10px; color:#aaa; margin-top:8px; line-height:1.5; } @media print { body { background:white; padding:0; } .receipt { box-shadow:none; } }</style>
  </head><body><div class="receipt"><div class="header"><h1>CineBooking</h1><p>Hoa don bap nuoc</p></div><div class="body"><div class="meta">Thoi gian: ${now}</div><div class="customer">Khach hang: ${customerName || 'Khach le'}</div><div class="items-title">San pham</div>${itemRows}<div class="total-row"><span class="label">Tong tien</span><span class="amount">${totalAmount} d</span></div><div class="tx-code">Ma don: ${txId}</div><div class="footer">Cam on ban da su dung dich vu CineBooking!</div></div></div><script>window.onload=function(){window.print();window.onafterprint=function(){window.close();};}<\/script></body></html>`
  const w = window.open('', '_blank', 'width=400,height=580')
  if (w) { w.document.write(html); w.document.close() }
}

export default function ConcessionSalesPage() {
  const { showSuccess, showError } = useNotification()

  // State
  const [cart, setCart] = useState<CartItem[]>([])
  const [lastTransaction, setLastTransaction] = useState<any>(null) // Để in hóa đơn
  const [customerInfo, setCustomerInfo] = useState({
    fullName: '',
    phone: '',
    email: '',
  })
  const [voucherCode, setVoucherCode] = useState('')
  const [paymentMethod, setPaymentMethod] = useState<'cash' | 'bank_transfer'>('cash')

  const [qrModal, setQrModal] = useState({
    isOpen: false,
    qrString: '',
    amount: 0,
    orderCode: '',
    payosOrderCode: ''
  })

  // API
  const { data: products, isLoading } = useProducts({
    isActive: true,
    inStock: true,
  })
  const createConcession = useCreateConcession()

  // RADAR TỰ ĐỘNG KIỂM TRA THANH TOÁN
  useEffect(() => {
    let intervalId: any; 

    console.log("👉 Trạng thái Radar:", { Mở: qrModal.isOpen, MaPayOS: qrModal.payosOrderCode });

    if (qrModal.isOpen && qrModal.payosOrderCode) {
      intervalId = setInterval(async () => {
        try {
          const baseUrl = process.env.NEXT_PUBLIC_API_URL || 'https://movie-booking-api-bcfe.onrender.com';
          const endpoint = baseUrl.endsWith('/api') 
              ? `${baseUrl}/bookings/payos-status/${qrModal.payosOrderCode}`
              : `${baseUrl}/api/bookings/payos-status/${qrModal.payosOrderCode}`;

          console.log("📡 Radar đang quét URL:", endpoint);

          const response = await fetch(endpoint);
          const data = await response.json();

          console.log("💰 Kết quả trả về:", data);

          if (data.data?.status === 'PAID' || data.status === 'PAID') {
            clearInterval(intervalId);
            setQrModal(prev => ({...prev, isOpen: false}));
            showSuccess('Thanh toán thành công! 🎉', `Khách đã chuyển khoản xong đơn: ${qrModal.orderCode}`);
            clearCart();
          }
        } catch (error) {
          console.error("❌ Radar quét thất bại:", error);
        }
      }, 3000);
    }

    return () => {
      if (intervalId) clearInterval(intervalId);
    };
  }, [qrModal.isOpen, qrModal.payosOrderCode]);

  // Cart functions
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

  const clearCart = () => {
    setCart([])
    setCustomerInfo({ fullName: '', phone: '', email: '' })
    setVoucherCode('')
    setPaymentMethod('cash')
  }

  const getTotalAmount = () => {
    return cart.reduce((sum, item) => sum + item.price * item.quantity, 0)
  }

  // Submit order
  const handleSubmitOrder = async () => {
    // Validation
    if (cart.length === 0) {
      showError('Giỏ hàng trống', 'Vui lòng thêm sản phẩm vào giỏ hàng')
      return
    }

    if (!customerInfo.fullName.trim()) {
      showError('Thiếu thông tin', 'Vui lòng nhập tên khách hàng')
      return
    }

    if (!customerInfo.phone.trim()) {
      showError('Thiếu thông tin', 'Vui lòng nhập số điện thoại')
      return
    }

    // Prepare data
    const concessionData = {
      products: cart.map(item => ({
        productId: item._id,
        quantity: item.quantity,
        size: item.size !== 'N/A' ? item.size : undefined,
      })),
      customerInfo: {
        fullName: customerInfo.fullName,
        phone: customerInfo.phone,
        email: customerInfo.email || undefined,
      },
      voucherCode: voucherCode.trim() || undefined,
      paymentMethod,
    }

    try {
      const result: any = await createConcession.mutateAsync(concessionData as any)

      const responseData = result.data || result;
      const txId = responseData.transaction?.transactionId || responseData.transactionId || responseData.concessionId || 'Mới';
      const txAmount = responseData.transaction?.totalAmount || responseData.totalAmount || getTotalAmount();

      const qrData = responseData.payosQrCode || responseData.payosCheckoutUrl;

      // PAYOS 
      if (paymentMethod === 'bank_transfer' && qrData) {
        console.log("Check PayOS Code từ Backend:", responseData.payosOrderCode);
        setQrModal({ isOpen: true, qrString: qrData, amount: txAmount, orderCode: txId, payosOrderCode: responseData.payosOrderCode })
      } else {
        // Luồng tiền mặt
        setLastTransaction({ ...responseData, transactionId: txId, totalAmount: txAmount })
        showSuccess('Dơn hàng thành công!', `Ma don: ${txId} - Tong: ${txAmount.toLocaleString('vi-VN')}đ`)
        clearCart()
      }
    } catch (error: any) {
      console.log('Create concession error:', error)
      showError(
        'Tạo đơn thất bại',
        error.response?.data?.message || 'Có lỗi xảy ra. Vui lòng thử lại'
      )
    }
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

  const categoryNames: Record<string, string> = {
    Popcorn: 'Bắp rang',
    Drink: 'Nước uống',
    Combo: 'Combo',
    Snack: 'Snack',
  }

  const categoryIcons: Record<string, string> = {
    Popcorn: '🍿',
    Drink: '🥤',
    Combo: '🎁',
    Snack: '🍫',
  }
  const paymentMethods = [
    { value: 'cash', label: 'Tiền mặt', icon: '💵' },
    { value: 'bank_transfer', label: 'Chuyển khoản (PayOS)', icon: '🏦' }
  ]

  return (
    <div className="max-w-7xl mx-auto p-4 md:p-6 space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-2xl md:text-3xl font-semibold text-foreground">
          Bán sản phẩm tại quầy
        </h1>
        <p className="text-muted-foreground mt-1">Tạo đơn hàng bắp nước cho khách tại quầy</p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Products Section */}
        <div className="lg:col-span-2 space-y-4">
          <Card className="p-6">
            <h2 className="text-lg font-semibold mb-4">Chọn sản phẩm</h2>

            {isLoading && (
              <div className="flex items-center justify-center py-12">
                <Loader2 className="w-8 h-8 animate-spin text-amber-500" />
                <span className="ml-3 text-gray-600">Đang tải sản phẩm...</span>
              </div>
            )}

            {!isLoading && products && products.length > 0 && (
              <div className="space-y-6">
                {Object.entries(groupedProducts).map(([category, items]) => (
                  <div key={category}>
                    <div className="flex items-center gap-2 mb-3">
                      <span className="text-xl">{categoryIcons[category]}</span>
                      <h3 className="font-semibold text-gray-900">{categoryNames[category]}</h3>
                      <Badge variant="secondary">{items.length}</Badge>
                    </div>

                    <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
                      {items.map(item => {
                        const cartItem = cart.find(i => i._id === item._id)
                        const quantity = cartItem?.quantity || 0

                        return (
                          <div
                            key={item._id}
                            className="border rounded-lg p-3 hover:border-amber-400 transition-all"
                          >
                            <div className="mb-2">
                              <div className="flex items-center gap-1 mb-1">
                                <h4 className="font-medium text-sm">{item.name}</h4>
                                {item.size !== 'N/A' && (
                                  <Badge variant="outline" className="text-xs">
                                    {item.size}
                                  </Badge>
                                )}
                              </div>
                              <p className="text-amber-600 font-semibold text-sm">
                                {item.price.toLocaleString('vi-VN')}đ
                              </p>
                              <p className="text-xs text-gray-500">Còn: {item.stockQuantity}</p>
                            </div>

                            {quantity === 0 ? (
                              <Button
                                onClick={() => addToCart(item)}
                                disabled={!item.inStock || item.stockQuantity === 0}
                                size="sm"
                                className="w-full"
                              >
                                <Plus className="w-3 h-3 mr-1" />
                                Thêm
                              </Button>
                            ) : (
                              <div className="flex items-center gap-2">
                                <Button
                                  onClick={() => removeFromCart(item._id)}
                                  size="sm"
                                  variant="outline"
                                  className="flex-1"
                                >
                                  <Minus className="w-3 h-3" />
                                </Button>
                                <span className="font-semibold min-w-[1.5rem] text-center">
                                  {quantity}
                                </span>
                                <Button
                                  onClick={() => addToCart(item)}
                                  disabled={quantity >= item.stockQuantity}
                                  size="sm"
                                  className="flex-1"
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
              </div>
            )}
          </Card>
        </div>

        {/* Order Summary & Customer Info */}
        <div className="space-y-4">
          {/* Cart */}
          <Card className="p-6">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-lg font-semibold flex items-center gap-2">
                <ShoppingCart className="w-5 h-5" />
                Giỏ hàng
              </h2>
              {cart.length > 0 && (
                <Button variant="ghost" size="sm" onClick={clearCart} className="text-red-600">
                  <X className="w-4 h-4" />
                </Button>
              )}
            </div>

            {cart.length === 0 ? (
              <div className="text-center py-8 text-gray-500">
                <ShoppingCart className="w-12 h-12 mx-auto mb-2 opacity-30" />
                <p className="text-sm">Chưa có sản phẩm</p>
              </div>
            ) : (
              <div className="space-y-3">
                {cart.map(item => (
                  <div key={item._id} className="flex items-center justify-between text-sm">
                    <div className="flex-1">
                      <p className="font-medium">{item.name}</p>
                      <p className="text-xs text-gray-500">
                        {item.price.toLocaleString('vi-VN')}đ × {item.quantity}
                      </p>
                    </div>
                    <p className="font-semibold">
                      {(item.price * item.quantity).toLocaleString('vi-VN')}đ
                    </p>
                  </div>
                ))}

                <div className="border-t pt-3 mt-3">
                  <div className="flex justify-between items-center">
                    <span className="font-semibold">Tổng cộng</span>
                    <span className="text-lg font-bold text-amber-600">
                      {getTotalAmount().toLocaleString('vi-VN')}đ
                    </span>
                  </div>
                </div>
              </div>
            )}
          </Card>

          {/* Customer Info */}
          <Card className="p-6">
            <h2 className="text-lg font-semibold mb-4 flex items-center gap-2">
              <User className="w-5 h-5" />
              Thông tin khách hàng
            </h2>

            <div className="space-y-3">
              <div>
                <Label htmlFor="fullName">
                  Họ tên <span className="text-red-500">*</span>
                </Label>
                <Input
                  id="fullName"
                  value={customerInfo.fullName}
                  onChange={e => setCustomerInfo(prev => ({ ...prev, fullName: e.target.value }))}
                  placeholder="Nguyễn Văn A"
                />
              </div>

              <div>
                <Label htmlFor="phone">
                  Số điện thoại <span className="text-red-500">*</span>
                </Label>
                <Input
                  id="phone"
                  value={customerInfo.phone}
                  onChange={e => setCustomerInfo(prev => ({ ...prev, phone: e.target.value }))}
                  placeholder="0912345678"
                />
              </div>

              <div>
                <Label htmlFor="email">Email (tuỳ chọn)</Label>
                <Input
                  id="email"
                  type="email"
                  value={customerInfo.email}
                  onChange={e => setCustomerInfo(prev => ({ ...prev, email: e.target.value }))}
                  placeholder="email@example.com"
                />
              </div>

              <div>
                <Label htmlFor="voucher">Mã giảm giá (tuỳ chọn)</Label>
                <Input
                  id="voucher"
                  value={voucherCode}
                  onChange={e => setVoucherCode(e.target.value)}
                  placeholder="VOUCHER123"
                />
              </div>
            </div>
          </Card>

          {/* Payment Method */}
          <Card className="p-6">
            <h2 className="text-lg font-semibold mb-4 flex items-center gap-2">
              <CreditCard className="w-5 h-5" />
              Phương thức thanh toán
            </h2>

            <div className="grid grid-cols-2 gap-2">
              {paymentMethods.map(method => (
                <button
                  key={method.value}
                  onClick={() => setPaymentMethod(method.value as any)}
                  className={`p-3 border rounded-lg text-sm font-medium transition-all ${
                    paymentMethod === method.value
                      ? 'border-amber-500 bg-amber-50 text-amber-700'
                      : 'border-gray-200 hover:border-gray-300'
                  }`}
                >
                  <span className="text-lg mr-1">{method.icon}</span>
                  {method.label}
                </button>
              ))}
            </div>
          </Card>

          {/* Submit Button + In Hóa Đơn */}
          <div className="space-y-2">
            <Button
              onClick={handleSubmitOrder}
              disabled={cart.length === 0 || createConcession.isPending}
              className="w-full h-12 text-base"
            >
              {createConcession.isPending ? (
                <><Loader2 className="w-4 h-4 mr-2 animate-spin" />Ang xử lý...</>
              ) : (
                <><CheckCircle2 className="w-4 h-4 mr-2" />Xác nhận đơn hàng</>
              )}
            </Button>

            {lastTransaction && (
              <Button
                variant="outline"
                className="w-full h-10 border-amber-400 text-amber-700 hover:bg-amber-50"
                onClick={() => {
                  printConcessionReceipt(lastTransaction, cart.length > 0 ? cart : [], customerInfo.fullName)
                  setLastTransaction(null)
                }}
              >
                <Printer className="w-4 h-4 mr-2" /> In Hóa Đơn
              </Button>
            )}
          </div>
        </div>
      </div>
      <Dialog open={qrModal.isOpen} onOpenChange={(open) => !open && setQrModal(prev => ({...prev, isOpen: false}))}>
        <DialogContent className="sm:max-w-md bg-white">
          <DialogHeader>
            <DialogTitle className="text-center text-xl font-bold text-amber-600">
              Thanh Toán Chuyển Khoản
            </DialogTitle>
            <DialogDescription className="text-center text-gray-500">
              Vui lòng mời khách hàng quét mã QR bên dưới để thanh toán.
            </DialogDescription>
          </DialogHeader>

          <div className="flex flex-col items-center justify-center p-4 space-y-6">
            {/* Vẽ mã QR siêu nét */}
            <div className="bg-white p-4 rounded-xl shadow-sm border border-gray-100">
              {qrModal.qrString ? (
                <QRCodeSVG value={qrModal.qrString} size={256} />
              ) : (
                <Loader2 className="w-12 h-12 animate-spin text-amber-500" />
              )}
            </div>

            {/* Hiển thị số tiền */}
            <div className="text-center space-y-1">
              <p className="text-sm text-gray-500">Tổng tiền cần thanh toán:</p>
              <p className="text-3xl font-bold text-amber-600">
                {qrModal.amount.toLocaleString('vi-VN')}đ
              </p>
            </div>

            {/* Hiển thị mã đơn */}
            <div className="text-center space-y-1">
              <p className="text-sm text-gray-500">Mã đơn hàng:</p>
              <p className="text-md font-medium text-gray-900">{qrModal.orderCode}</p>
            </div>

            <div className="flex items-center gap-2 text-sm text-blue-600 animate-pulse bg-blue-50 px-4 py-2 rounded-full">
              <Loader2 className="w-4 h-4 animate-spin" />
              <span>Đang chờ khách hàng thanh toán...</span>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  )
}
'use client'

import { useState, useEffect } from 'react'
import { Voucher } from '../hooks/useVouchers'

interface Props {
  isOpen: boolean
  onClose: () => void
  mode: 'create' | 'edit'
  initialData: Voucher | null
  onSave: (mode: 'create' | 'edit', id: string | null, data: any) => Promise<boolean>
}

export function VoucherDialog({ isOpen, onClose, mode, initialData, onSave }: Props) {
  const [formData, setFormData] = useState({
    code: '', description: '', discountType: 'fixed', discountValue: 0,
    maxDiscountAmount: 0, minOrderValue: 0, startDate: '', endDate: '',
    usageLimit: 100, isActive: true,
  })

  const todayDateTimeStr = new Date(new Date().getTime() - new Date().getTimezoneOffset() * 60000).toISOString().slice(0, 16)

  useEffect(() => {
    if (isOpen) {
      if (mode === 'edit' && initialData) {
        setFormData({
          code: initialData.code,
          description: initialData.description,
          discountType: initialData.discountType,
          discountValue: initialData.discountValue,
          maxDiscountAmount: initialData.maxDiscountAmount || 0,
          minOrderValue: initialData.minOrderValue,
          startDate: new Date(initialData.startDate).toISOString().slice(0, 16),
          endDate: new Date(initialData.endDate).toISOString().slice(0, 16),
          usageLimit: initialData.usageLimit,
          isActive: initialData.isActive,
        })
      } else {
        setFormData({
          code: '', description: '', discountType: 'fixed', discountValue: 0,
          maxDiscountAmount: 0, minOrderValue: 0, startDate: '', endDate: '',
          usageLimit: 100, isActive: true,
        })
      }
    }
  }, [isOpen, mode, initialData])

  if (!isOpen) return null

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    const success = await onSave(mode, initialData?._id || null, formData)
    if (success) onClose()
  }

  return (
    <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4">
      <div className="bg-white rounded-xl shadow-xl w-full max-w-2xl max-h-[90vh] flex flex-col">
        <div className="p-6 border-b border-gray-200 flex justify-between items-center">
          <h2 className="text-xl font-bold text-gray-900">{mode === 'create' ? 'Thêm Mã Khuyến Mãi' : 'Chỉnh Sửa Mã Khuyến Mãi'}</h2>
          <button onClick={onClose} className="text-gray-400 hover:text-gray-600">✕</button>
        </div>
        
        <form onSubmit={handleSubmit} className="p-6 overflow-y-auto space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium mb-1">Mã Voucher *</label>
              <input type="text" required disabled={mode === 'edit'} value={formData.code} onChange={e => setFormData({...formData, code: e.target.value.toUpperCase()})} className="w-full px-3 py-2 border rounded-lg uppercase disabled:bg-gray-100" />
            </div>
            <div>
              <label className="block text-sm font-medium mb-1">Mô tả</label>
              <input type="text" required value={formData.description} onChange={e => setFormData({...formData, description: e.target.value})} className="w-full px-3 py-2 border rounded-lg" />
            </div>
            <div>
              <label className="block text-sm font-medium mb-1">Loại giảm giá</label>
              <select value={formData.discountType} onChange={e => setFormData({...formData, discountType: e.target.value as 'fixed' | 'percentage'})} className="w-full px-3 py-2 border rounded-lg">
                <option value="fixed">Giảm tiền mặt (VNĐ)</option>
                <option value="percentage">Giảm theo %</option>
              </select>
            </div>
            <div>
              <label className="block text-sm font-medium mb-1">Mức giảm *</label>
              <input type="number" required min="0" value={formData.discountValue} onChange={e => setFormData({...formData, discountValue: Number(e.target.value)})} className="w-full px-3 py-2 border rounded-lg" />
            </div>
            {formData.discountType === 'percentage' && (
              <div>
                <label className="block text-sm font-medium mb-1">Giảm tối đa (VNĐ)</label>
                <input type="number" min="0" value={formData.maxDiscountAmount} onChange={e => setFormData({...formData, maxDiscountAmount: Number(e.target.value)})} className="w-full px-3 py-2 border rounded-lg" />
              </div>
            )}
            <div>
              <label className="block text-sm font-medium mb-1">Đơn tối thiểu (VNĐ) *</label>
              <input type="number" required min="0" value={formData.minOrderValue} onChange={e => setFormData({...formData, minOrderValue: Number(e.target.value)})} className="w-full px-3 py-2 border rounded-lg" />
            </div>
            <div>
              <label className="block text-sm font-medium mb-1">Bắt đầu từ *</label>
              <input type="datetime-local" min={todayDateTimeStr} required value={formData.startDate} onChange={e => setFormData({...formData, startDate: e.target.value})} className="w-full px-3 py-2 border rounded-lg" />
            </div>
            <div>
              <label className="block text-sm font-medium mb-1">Hết hạn vào *</label>
              <input type="datetime-local" min={formData.startDate || todayDateTimeStr} required value={formData.endDate} onChange={e => setFormData({...formData, endDate: e.target.value})} className="w-full px-3 py-2 border rounded-lg" />
            </div>
            <div>
              <label className="block text-sm font-medium mb-1">Giới hạn số lượt dùng *</label>
              <input type="number" required min="1" value={formData.usageLimit} onChange={e => setFormData({...formData, usageLimit: Number(e.target.value)})} className="w-full px-3 py-2 border rounded-lg" />
            </div>
            <div className="flex items-center mt-6 col-span-1 md:col-span-2">
              <input type="checkbox" id="isActive" checked={formData.isActive} onChange={e => setFormData({...formData, isActive: e.target.checked})} className="w-4 h-4 text-violet-600 rounded" />
              <label htmlFor="isActive" className="ml-2 text-sm font-medium">Kích hoạt (Cho phép sử dụng ngay)</label>
            </div>
          </div>

          <div className="pt-6 border-t mt-6 flex justify-end gap-3">
            <button type="button" onClick={onClose} className="px-4 py-2 border rounded-lg hover:bg-gray-50">Hủy</button>
            <button type="submit" className="px-4 py-2 bg-violet-600 text-white rounded-lg hover:bg-violet-700">Lưu</button>
          </div>
        </form>
      </div>
    </div>
  )
}
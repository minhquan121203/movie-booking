'use client'

import { useState, useEffect } from 'react'
import { Plus, Search, Edit, Trash2, Tag } from 'lucide-react'
import { toast } from 'sonner'

// Định nghĩa Type dựa theo Model Voucher của fen
interface Voucher {
  _id: string
  code: string
  description: string
  discountType: 'fixed' | 'percentage'
  discountValue: number
  maxDiscountAmount?: number
  minOrderValue: number
  startDate: string
  endDate: string
  usageLimit: number
  usageCount: number
  isActive: boolean
}

export default function VouchersPage() {
  const [vouchers, setVouchers] = useState<Voucher[]>([])
  const [loading, setLoading] = useState(true)
  const [searchTerm, setSearchTerm] = useState('')
  const [page, setPage] = useState(1)
  const [totalPages, setTotalPages] = useState(1)

  // Modal State
  const [isModalOpen, setIsModalOpen] = useState(false)
  const [modalMode, setModalMode] = useState<'create' | 'edit'>('create')
  const [editingId, setEditingId] = useState<string | null>(null)

  // Form State
  const [formData, setFormData] = useState({
    code: '',
    description: '',
    discountType: 'fixed',
    discountValue: 0,
    maxDiscountAmount: 0,
    minOrderValue: 0,
    startDate: '',
    endDate: '',
    usageLimit: 100,
    isActive: true,
  })

  // --- 1. GỌI API LẤY DANH SÁCH ---
  const fetchVouchers = async () => {
    try {
      setLoading(true)
      const token = localStorage.getItem('accessToken') || ''
      const baseUrl = process.env.NEXT_PUBLIC_API_URL || 'https://movie-booking-api-bcfe.onrender.com'
      const fetchUrl = baseUrl.endsWith('/api') ? baseUrl : `${baseUrl}/api`
      
      const res = await fetch(`${fetchUrl}/admin/vouchers?page=${page}&limit=10&search=${searchTerm}`, {
        headers: { Authorization: `Bearer ${token}` }
      })
      const json = await res.json()
      
      if (res.ok && json.data) {
        setVouchers(json.data.vouchers || json.data)
        setTotalPages(json.data.pagination?.totalPages || 1)
      }
    } catch (error) {
      console.error(error)
      toast.error('Lỗi khi tải danh sách voucher')
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    fetchVouchers()
  }, [page, searchTerm])

  // --- 2. XỬ LÝ FORM THÊM / SỬA ---
  const openModal = (mode: 'create' | 'edit', voucher?: Voucher) => {
    setModalMode(mode)
    if (mode === 'edit' && voucher) {
      setEditingId(voucher._id)
      setFormData({
        code: voucher.code,
        description: voucher.description,
        discountType: voucher.discountType,
        discountValue: voucher.discountValue,
        maxDiscountAmount: voucher.maxDiscountAmount || 0,
        minOrderValue: voucher.minOrderValue,
        startDate: new Date(voucher.startDate).toISOString().slice(0, 16),
        endDate: new Date(voucher.endDate).toISOString().slice(0, 16),
        usageLimit: voucher.usageLimit,
        isActive: voucher.isActive,
      })
    } else {
      setEditingId(null)
      setFormData({
        code: '', description: '', discountType: 'fixed', discountValue: 0,
        maxDiscountAmount: 0, minOrderValue: 0, startDate: '', endDate: '',
        usageLimit: 100, isActive: true,
      })
    }
    setIsModalOpen(true)
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    try {
      const token = localStorage.getItem('accessToken') || ''
      const baseUrl = process.env.NEXT_PUBLIC_API_URL || 'https://movie-booking-api-bcfe.onrender.com'
      const fetchUrl = baseUrl.endsWith('/api') ? baseUrl : `${baseUrl}/api`
      
      const url = modalMode === 'create' 
        ? `${fetchUrl}/admin/vouchers` 
        : `${fetchUrl}/admin/vouchers/${editingId}`
        
      const method = modalMode === 'create' ? 'POST' : 'PUT'

      const res = await fetch(url, {
        method,
        headers: { 
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}` 
        },
        body: JSON.stringify({
          ...formData,
          code: formData.code.toUpperCase()
        })
      })

      if (res.ok) {
        toast.success(modalMode === 'create' ? 'Tạo mã thành công!' : 'Cập nhật thành công!')
        setIsModalOpen(false)
        fetchVouchers()
      } else {
        const errorData = await res.json()
        toast.error(errorData.message || 'Có lỗi xảy ra!')
      }
    } catch (error) {
      toast.error('Lỗi kết nối server!')
    }
  }

  // --- 3. XÓA VOUCHER ---
  const handleDelete = async (id: string) => {
    if (!confirm('Bạn có chắc chắn muốn xóa mã giảm giá này không?')) return
    
    try {
      const token = localStorage.getItem('accessToken') || ''
      const baseUrl = process.env.NEXT_PUBLIC_API_URL || 'https://movie-booking-api-bcfe.onrender.com'
      const fetchUrl = baseUrl.endsWith('/api') ? baseUrl : `${baseUrl}/api`
      
      const res = await fetch(`${fetchUrl}/admin/vouchers/${id}`, {
        method: 'DELETE',
        headers: { Authorization: `Bearer ${token}` }
      })

      if (res.ok) {
        toast.success('Xóa voucher thành công!')
        fetchVouchers()
      } else {
        toast.error('Không thể xóa voucher này!')
      }
    } catch (error) {
      toast.error('Lỗi kết nối server!')
    }
  }

  return (
    <div className="p-8 w-full max-w-[1600px] mx-auto">
      {/* Header */}
      <div className="mb-8">
        <h1 className="text-2xl font-bold text-gray-900 mb-6">Quản Lý Voucher</h1>
        
        <div className="flex flex-col sm:flex-row justify-between gap-4">
          <div className="relative w-full max-w-md">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 w-5 h-5" />
            <input
              type="text"
              placeholder="Tìm theo mã voucher..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full pl-10 pr-4 py-2 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-violet-500 focus:border-transparent text-sm"
            />
          </div>
          
          <button
            onClick={() => openModal('create')}
            className="flex items-center gap-2 bg-violet-600 text-white px-4 py-2 rounded-lg hover:bg-violet-700 transition-colors font-medium text-sm whitespace-nowrap"
          >
            <Plus className="w-4 h-4" />
            Thêm Mới
          </button>
        </div>
      </div>

      {/* Table */}
      <div className="bg-white rounded-xl border border-gray-200 shadow-sm overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-sm text-left">
            <thead className="bg-gray-50 text-gray-600 font-medium border-b border-gray-200">
              <tr>
                <th className="px-6 py-4">Mã Voucher</th>
                <th className="px-6 py-4">Mô Tả</th>
                <th className="px-6 py-4 text-center">Mức Giảm</th>
                <th className="px-6 py-4 text-center">Đơn Tối Thiểu</th>
                <th className="px-6 py-4 text-center">Đã Dùng / Giới Hạn</th>
                <th className="px-6 py-4 text-center">Trạng Thái</th>
                <th className="px-6 py-4 text-center">Hành Động</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-200">
              {loading ? (
                <tr><td colSpan={7} className="px-6 py-8 text-center text-gray-500">Đang tải dữ liệu...</td></tr>
              ) : vouchers.length === 0 ? (
                <tr><td colSpan={7} className="px-6 py-8 text-center text-gray-500">Không tìm thấy mã giảm giá nào.</td></tr>
              ) : (
                vouchers.map((voucher) => (
                  <tr key={voucher._id} className="hover:bg-gray-50 transition-colors">
                    <td className="px-6 py-4 font-bold text-violet-600">
                      <div className="flex items-center gap-2">
                        <Tag className="w-4 h-4" />
                        {voucher.code}
                      </div>
                    </td>
                    <td className="px-6 py-4 text-gray-600">{voucher.description}</td>
                    <td className="px-6 py-4 text-center font-medium">
                      {voucher.discountType === 'fixed' 
                        ? `${voucher.discountValue.toLocaleString('vi-VN')} đ` 
                        : `${voucher.discountValue}%`}
                    </td>
                    <td className="px-6 py-4 text-center text-gray-600">
                      {voucher.minOrderValue.toLocaleString('vi-VN')} đ
                    </td>
                    <td className="px-6 py-4 text-center text-gray-600">
                      {voucher.usageCount} / {voucher.usageLimit}
                    </td>
                    <td className="px-6 py-4 text-center">
                      <span className={`px-3 py-1 rounded-full text-xs font-medium ${
                        voucher.isActive && new Date(voucher.endDate) > new Date()
                          ? 'bg-green-100 text-green-700'
                          : 'bg-red-100 text-red-700'
                      }`}>
                        {voucher.isActive && new Date(voucher.endDate) > new Date() ? 'Hoạt động' : 'Hết hạn'}
                      </span>
                    </td>
                    <td className="px-6 py-4 text-center">
                      <div className="flex items-center justify-center gap-3">
                        <button onClick={() => openModal('edit', voucher)} className="text-blue-600 hover:text-blue-800">
                          <Edit className="w-4 h-4" />
                        </button>
                        <button onClick={() => handleDelete(voucher._id)} className="text-red-600 hover:text-red-800">
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>

        {/* Pagination */}
        {totalPages > 1 && (
          <div className="flex items-center justify-center gap-2 p-4 border-t border-gray-200">
            {Array.from({ length: totalPages }).map((_, idx) => (
              <button
                key={idx}
                onClick={() => setPage(idx + 1)}
                className={`w-8 h-8 rounded-lg text-sm font-medium transition-colors ${
                  page === idx + 1 ? 'bg-violet-600 text-white' : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
                }`}
              >
                {idx + 1}
              </button>
            ))}
          </div>
        )}
      </div>

      {/* Modal Thêm/Sửa */}
      {isModalOpen && (
        <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-xl shadow-xl w-full max-w-2xl max-h-[90vh] flex flex-col">
            <div className="p-6 border-b border-gray-200 flex justify-between items-center">
              <h2 className="text-xl font-bold text-gray-900">
                {modalMode === 'create' ? 'Thêm Mã Khuyến Mãi' : 'Chỉnh Sửa Mã Khuyến Mãi'}
              </h2>
              <button onClick={() => setIsModalOpen(false)} className="text-gray-400 hover:text-gray-600">✕</button>
            </div>
            
            <form onSubmit={handleSubmit} className="p-6 overflow-y-auto space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Mã Voucher *</label>
                  <input
                    type="text" required
                    disabled={modalMode === 'edit'}
                    value={formData.code}
                    onChange={(e) => setFormData({...formData, code: e.target.value.toUpperCase()})}
                    className="w-full px-3 py-2 border rounded-lg focus:ring-violet-500 focus:border-violet-500 uppercase disabled:bg-gray-100"
                    placeholder="VD: KHAI_TRUONG"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Mô tả</label>
                  <input
                    type="text" required
                    value={formData.description}
                    onChange={(e) => setFormData({...formData, description: e.target.value})}
                    className="w-full px-3 py-2 border rounded-lg focus:ring-violet-500 focus:border-violet-500"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Loại giảm giá</label>
                  <select
                    value={formData.discountType}
                    onChange={(e) => setFormData({...formData, discountType: e.target.value as 'fixed' | 'percentage'})}
                    className="w-full px-3 py-2 border rounded-lg focus:ring-violet-500 focus:border-violet-500"
                  >
                    <option value="fixed">Giảm tiền mặt (VNĐ)</option>
                    <option value="percentage">Giảm theo %</option>
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Mức giảm *</label>
                  <input
                    type="number" required min="0"
                    value={formData.discountValue}
                    onChange={(e) => setFormData({...formData, discountValue: Number(e.target.value)})}
                    className="w-full px-3 py-2 border rounded-lg focus:ring-violet-500 focus:border-violet-500"
                  />
                </div>

                {formData.discountType === 'percentage' && (
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Giảm tối đa (VNĐ)</label>
                    <input
                      type="number" min="0"
                      value={formData.maxDiscountAmount}
                      onChange={(e) => setFormData({...formData, maxDiscountAmount: Number(e.target.value)})}
                      className="w-full px-3 py-2 border rounded-lg focus:ring-violet-500 focus:border-violet-500"
                    />
                  </div>
                )}
                
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Đơn tối thiểu (VNĐ) *</label>
                  <input
                    type="number" required min="0"
                    value={formData.minOrderValue}
                    onChange={(e) => setFormData({...formData, minOrderValue: Number(e.target.value)})}
                    className="w-full px-3 py-2 border rounded-lg focus:ring-violet-500 focus:border-violet-500"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Bắt đầu từ *</label>
                  <input
                    type="datetime-local" required
                    value={formData.startDate}
                    onChange={(e) => setFormData({...formData, startDate: e.target.value})}
                    className="w-full px-3 py-2 border rounded-lg focus:ring-violet-500 focus:border-violet-500"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Hết hạn vào *</label>
                  <input
                    type="datetime-local" required
                    value={formData.endDate}
                    onChange={(e) => setFormData({...formData, endDate: e.target.value})}
                    className="w-full px-3 py-2 border rounded-lg focus:ring-violet-500 focus:border-violet-500"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Giới hạn số lượt dùng *</label>
                  <input
                    type="number" required min="1"
                    value={formData.usageLimit}
                    onChange={(e) => setFormData({...formData, usageLimit: Number(e.target.value)})}
                    className="w-full px-3 py-2 border rounded-lg focus:ring-violet-500 focus:border-violet-500"
                  />
                </div>
                
                <div className="flex items-center mt-6">
                  <input
                    type="checkbox"
                    id="isActive"
                    checked={formData.isActive}
                    onChange={(e) => setFormData({...formData, isActive: e.target.checked})}
                    className="w-4 h-4 text-violet-600 border-gray-300 rounded focus:ring-violet-500"
                  />
                  <label htmlFor="isActive" className="ml-2 text-sm font-medium text-gray-700">
                    Kích hoạt (Cho phép sử dụng ngay)
                  </label>
                </div>
              </div>

              <div className="pt-6 border-t mt-6 flex justify-end gap-3">
                <button
                  type="button"
                  onClick={() => setIsModalOpen(false)}
                  className="px-4 py-2 border border-gray-300 rounded-lg text-gray-700 font-medium hover:bg-gray-50 transition-colors"
                >
                  Hủy
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 bg-violet-600 text-white rounded-lg font-medium hover:bg-violet-700 transition-colors"
                >
                  {modalMode === 'create' ? 'Tạo Voucher' : 'Lưu Thay Đổi'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  )
}
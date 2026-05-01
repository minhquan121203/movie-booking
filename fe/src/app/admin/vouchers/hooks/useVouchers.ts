import { useState, useEffect } from 'react'
import { toast } from 'sonner'

export interface Voucher {
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

export const useVouchers = () => {
  const [vouchers, setVouchers] = useState<Voucher[]>([])
  const [loading, setLoading] = useState(true)
  const [searchTerm, setSearchTerm] = useState('')
  const [page, setPage] = useState(1)
  const [totalPages, setTotalPages] = useState(1)

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
      toast.error('Lỗi khi tải danh sách voucher')
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    fetchVouchers()
  }, [page, searchTerm])

  const deleteVoucher = async (id: string) => {
    if (!confirm('Bạn có chắc chắn muốn xóa mã giảm giá này không?')) return false
    
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
        return true
      }
      toast.error('Không thể xóa voucher này!')
      return false
    } catch (error) {
      toast.error('Lỗi kết nối server!')
      return false
    }
  }

  const saveVoucher = async (mode: 'create' | 'edit', editingId: string | null, formData: any) => {
    try {
      const token = localStorage.getItem('accessToken') || ''
      const baseUrl = process.env.NEXT_PUBLIC_API_URL || 'https://movie-booking-api-bcfe.onrender.com'
      const fetchUrl = baseUrl.endsWith('/api') ? baseUrl : `${baseUrl}/api`
      
      const url = mode === 'create' ? `${fetchUrl}/admin/vouchers` : `${fetchUrl}/admin/vouchers/${editingId}`
      const method = mode === 'create' ? 'POST' : 'PUT'

      const res = await fetch(url, {
        method,
        headers: { 
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}` 
        },
        body: JSON.stringify({ ...formData, code: formData.code.toUpperCase() })
      })

      if (res.ok) {
        toast.success(mode === 'create' ? 'Tạo mã thành công!' : 'Cập nhật thành công!')
        fetchVouchers()
        return true
      }
      
      const errorData = await res.json()
      toast.error(errorData.message || 'Có lỗi xảy ra!')
      return false
    } catch (error) {
      toast.error('Lỗi kết nối server!')
      return false
    }
  }

  return {
    vouchers, loading, searchTerm, setSearchTerm, page, setPage, totalPages,
    deleteVoucher, saveVoucher
  }
}
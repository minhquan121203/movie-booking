'use client'

import { Edit, Trash2, Tag } from 'lucide-react'
import { Voucher } from '../hooks/useVouchers'

interface Props {
  vouchers: Voucher[]
  loading: boolean
  page: number
  totalPages: number
  setPage: (page: number) => void
  onEdit: (voucher: Voucher) => void
  onDelete: (id: string) => void
}

export function VoucherTable({ vouchers, loading, page, totalPages, setPage, onEdit, onDelete }: Props) {
  return (
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
              <tr><td colSpan={7} className="px-6 py-8 text-center text-gray-500">Không có dữ liệu.</td></tr>
            ) : (
              vouchers.map((voucher) => (
                <tr key={voucher._id} className="hover:bg-gray-50 transition-colors">
                  <td className="px-6 py-4 font-bold text-violet-600">
                    <div className="flex items-center gap-2"><Tag className="w-4 h-4" />{voucher.code}</div>
                  </td>
                  <td className="px-6 py-4 text-gray-600">{voucher.description}</td>
                  <td className="px-6 py-4 text-center font-medium">
                    {voucher.discountType === 'fixed' ? `${voucher.discountValue.toLocaleString('vi-VN')} đ` : `${voucher.discountValue}%`}
                  </td>
                  <td className="px-6 py-4 text-center text-gray-600">{voucher.minOrderValue.toLocaleString('vi-VN')} đ</td>
                  <td className="px-6 py-4 text-center text-gray-600">{voucher.usageCount} / {voucher.usageLimit}</td>
                  <td className="px-6 py-4 text-center">
                    <span className={`px-3 py-1 rounded-full text-xs font-medium ${
                      voucher.isActive && new Date(voucher.endDate) > new Date() ? 'bg-green-100 text-green-700' : 'bg-red-100 text-red-700'
                    }`}>
                      {voucher.isActive && new Date(voucher.endDate) > new Date() ? 'Hoạt động' : 'Hết hạn'}
                    </span>
                  </td>
                  <td className="px-6 py-4 text-center">
                    <div className="flex items-center justify-center gap-3">
                      <button onClick={() => onEdit(voucher)} className="text-blue-600 hover:text-blue-800"><Edit className="w-4 h-4" /></button>
                      <button onClick={() => onDelete(voucher._id)} className="text-red-600 hover:text-red-800"><Trash2 className="w-4 h-4" /></button>
                    </div>
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>

      {totalPages > 1 && (
        <div className="flex items-center justify-center gap-2 p-4 border-t border-gray-200">
          {Array.from({ length: totalPages }).map((_, idx) => (
            <button
              key={idx} onClick={() => setPage(idx + 1)}
              className={`w-8 h-8 rounded-lg text-sm font-medium transition-colors ${page === idx + 1 ? 'bg-violet-600 text-white' : 'bg-gray-100 hover:bg-gray-200'}`}
            >
              {idx + 1}
            </button>
          ))}
        </div>
      )}
    </div>
  )
}
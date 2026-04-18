'use client'
import { useState } from 'react'
import { Card } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Textarea } from '@/components/ui/textarea'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { Send, CheckCircle, Phone, Mail, MessageSquare } from 'lucide-react'
import { useComplaintMutations } from '@/app/admin/complaints/hooks/useComplaintMutations'
import { ComplaintCreateDTO } from '@/types/complaint'

interface ComplaintFormProps {
  staffId: string
}

const CATEGORY_MAP: Record<string, string> = {
  service: 'Dịch vụ khách hàng',
  facility: 'Cơ sở vật chất',
  product: 'Sản phẩm',
  booking: 'Vấn đề về vé',
  technical: 'Kỹ thuật (âm thanh, hình ảnh)',
  other: 'Khác',
}

const PRIORITY_MAP: Record<string, string> = {
  low: 'Thấp',
  medium: 'Trung bình',
  high: 'Cao',
  urgent: 'Khẩn cấp',
}

export default function ComplaintForm({ staffId }: ComplaintFormProps) {
  const { createMutation } = useComplaintMutations()
  const [formData, setFormData] = useState({
    customerName: '',
    customerPhone: '',
    customerEmail: '',
    customerId: '',
    category: '',
    priority: '',
    description: '',
  })
  const [showSuccess, setShowSuccess] = useState(false)

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()

    // Tạo payload theo API
    const payload: ComplaintCreateDTO = {
      category: formData.category,
      description: formData.description,
      priority: formData.priority as 'low' | 'medium' | 'high' | 'urgent',
    }

    // Chỉ thêm customerId nếu có
    if (formData.customerId) {
      payload.customerId = formData.customerId
    }

    createMutation.mutate(payload, {
      onSuccess: () => {
        setShowSuccess(true)
        // Reset form
        setFormData({
          customerName: '',
          customerPhone: '',
          customerEmail: '',
          customerId: '',
          category: '',
          priority: '',
          description: '',
        })
        // Ẩn success message sau 3s
        setTimeout(() => setShowSuccess(false), 3000)
      },
    })
  }

  return (
    <Card className="p-6 border border-border rounded-[10px] shadow-sm hover:shadow-md transition-shadow">
      <div className="flex items-center gap-3 mb-6">
        <div className="w-10 h-10 bg-primary/10 rounded-[10px] flex items-center justify-center">
          <MessageSquare className="w-5 h-5 text-primary" />
        </div>
        <div>
          <h3 className="text-foreground">Form hỗ trợ khiếu nại</h3>
          <p className="text-sm text-muted-foreground">Ghi nhận thông tin phản ánh từ khách hàng</p>
        </div>
      </div>

      {showSuccess ? (
        <div className="py-12 text-center">
          <div className="w-16 h-16 bg-chart-3/10 rounded-[10px] flex items-center justify-center mx-auto mb-4">
            <CheckCircle className="w-8 h-8 text-chart-3" />
          </div>
          <h3 className="text-foreground mb-2">Đã gửi báo cáo thành công!</h3>
          <p className="text-muted-foreground">
            Báo cáo đã được ghi nhận và chuyển đến bộ phận xử lý
          </p>
        </div>
      ) : (
        <form onSubmit={handleSubmit} className="space-y-4">
          {/* Thông tin khách hàng - OPTIONAL */}
          <div className="space-y-4 p-4 bg-secondary rounded-[10px]">
            <div className="flex items-center justify-between">
              <h4 className="text-foreground">Thông tin khách hàng</h4>
              <span className="text-xs text-muted-foreground italic">
                (Tùy chọn - Để trống nếu báo cáo nội bộ)
              </span>
            </div>

            <div>
              <label className="text-sm text-muted-foreground mb-2 block">ID khách hàng</label>
              <Input
                value={formData.customerId}
                onChange={e => setFormData({ ...formData, customerId: e.target.value })}
                placeholder="Nhập ID khách hàng (nếu có)"
                className="rounded-[10px]"
              />
              <p className="text-xs text-muted-foreground mt-1">
                Có thể lấy từ booking code hoặc hệ thống
              </p>
            </div>

            <div>
              <label className="text-sm text-muted-foreground mb-2 block">Tên khách hàng</label>
              <Input
                value={formData.customerName}
                onChange={e => setFormData({ ...formData, customerName: e.target.value })}
                placeholder="Nhập tên khách hàng"
                className="rounded-[10px]"
              />
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="text-sm text-muted-foreground mb-2 block">Số điện thoại</label>
                <div className="relative">
                  <Phone className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                  <Input
                    value={formData.customerPhone}
                    onChange={e => setFormData({ ...formData, customerPhone: e.target.value })}
                    placeholder="0123456789"
                    className="pl-10 rounded-[10px]"
                  />
                </div>
              </div>

              <div>
                <label className="text-sm text-muted-foreground mb-2 block">Email</label>
                <div className="relative">
                  <Mail className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                  <Input
                    type="email"
                    value={formData.customerEmail}
                    onChange={e => setFormData({ ...formData, customerEmail: e.target.value })}
                    placeholder="email@example.com"
                    className="pl-10 rounded-[10px]"
                  />
                </div>
              </div>
            </div>
          </div>

          {/* Thông tin vấn đề - REQUIRED */}
          <div className="space-y-4">
            <h4 className="text-foreground">Thông tin vấn đề *</h4>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="text-sm text-muted-foreground mb-2 block">Loại vấn đề *</label>
                <Select
                  value={formData.category}
                  onValueChange={value => setFormData({ ...formData, category: value })}
                  required
                >
                  <SelectTrigger className="rounded-[10px]">
                    <SelectValue placeholder="-- Chọn loại vấn đề --" />
                  </SelectTrigger>
                  <SelectContent>
                    {Object.entries(CATEGORY_MAP).map(([key, label]) => (
                      <SelectItem key={key} value={key}>
                        {label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div>
                <label className="text-sm text-muted-foreground mb-2 block">Mức độ ưu tiên *</label>
                <Select
                  value={formData.priority}
                  onValueChange={value => setFormData({ ...formData, priority: value })}
                  required
                >
                  <SelectTrigger className="rounded-[10px]">
                    <SelectValue placeholder="-- Chọn mức độ --" />
                  </SelectTrigger>
                  <SelectContent>
                    {Object.entries(PRIORITY_MAP).map(([key, label]) => (
                      <SelectItem key={key} value={key}>
                        {label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>

            <div>
              <label className="text-sm text-muted-foreground mb-2 block">
                Nội dung phản ánh *
              </label>
              <Textarea
                value={formData.description}
                onChange={e => setFormData({ ...formData, description: e.target.value })}
                placeholder="Mô tả chi tiết vấn đề khách hàng gặp phải..."
                className="rounded-[10px]"
                rows={6}
                required
              />
            </div>
          </div>

          {/* Actions */}
          <div className="flex gap-3 pt-4">
            <Button
              type="submit"
              disabled={createMutation.isPending}
              className="flex-1 bg-primary hover:bg-primary-hover text-primary-foreground rounded-[10px] shadow-md shadow-primary/20"
            >
              <Send className="w-4 h-4 mr-2" />
              {createMutation.isPending ? 'Đang gửi...' : 'Gửi báo cáo sự cố'}
            </Button>
            <Button
              type="button"
              variant="outline"
              className="rounded-[10px]"
              onClick={() =>
                setFormData({
                  customerName: '',
                  customerPhone: '',
                  customerEmail: '',
                  customerId: '',
                  category: '',
                  priority: '',
                  description: '',
                })
              }
            >
              Hủy
            </Button>
          </div>
        </form>
      )}
    </Card>
  )
}

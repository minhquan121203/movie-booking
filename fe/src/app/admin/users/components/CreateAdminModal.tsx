'use client'
import { useState } from 'react'
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { toast } from 'react-hot-toast'
import Cookies from 'js-cookie'
import { Loader2 } from 'lucide-react'

interface CreateAdminModalProps {
  open: boolean
  onOpenChange: (open: boolean) => void
}

export function CreateAdminModal({ open, onOpenChange }: CreateAdminModalProps) {
  const [loading, setLoading] = useState(false)
  const [formData, setFormData] = useState({
    email: '',
    fullName: '',
    password: '',
    confirmPassword: '',
    phoneNumber: '',
    assignedCity: '',
    role: 'admin' 
  })

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    // KIỂM TRA MẬT KHẨU NHẬP LẠI
    if (formData.password !== formData.confirmPassword) {
        return toast.error('Mật khẩu nhập lại không khớp fen ơi! ❌');
    }

    // KIỂM TRA ĐÃ CHỌN VÙNG CHƯA 
    if (!formData.assignedCity) {
        return toast.error('Vui lòng chọn khu vực quản lý! 📍');
    }

    setLoading(true);

    try {
      const token = Cookies.get('authToken');
        const baseUrl = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5000/api';
        const response = await fetch(`${baseUrl}/admin/users`, {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify(formData)
        });

        const data = await response.json();

        if (data.success) {
        toast.success('Bổ nhiệm Quản trị viên vùng thành công! 🔑');
        onOpenChange(false);
        
        setFormData({ 
            email: '', 
            fullName: '', 
            password: '', 
            confirmPassword: '', 
            phoneNumber: '', 
            assignedCity: '',   
            role: 'admin' 
        });

        // Load lại trang để thấy admin mới
        window.location.reload();
      } else {
        toast.error(data.message || 'Có lỗi xảy ra')
      }
    } catch (error) {
      toast.error('Lỗi kết nối server!')
    } finally {
      setLoading(false)
    }
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[425px] bg-white text-gray-900">
        <DialogHeader>
          <DialogTitle className="text-red-600 font-bold text-xl">Thêm Quản Trị Viên (Admin)</DialogTitle>
        </DialogHeader>
        
        <form onSubmit={handleSubmit} className="space-y-4 py-4">
          <div className="space-y-2">
            <Label htmlFor="admin-name">Họ và tên</Label>
            <Input 
              id="admin-name" 
              placeholder="Nguyễn Văn Admin"
              required 
              value={formData.fullName}
              onChange={e => setFormData({...formData, fullName: e.target.value})}
            />
          </div>
          
          <div className="space-y-2">
            <Label htmlFor="admin-email">Email</Label>
            <Input 
              id="admin-email" 
              type="email" 
              placeholder="admin@cinebooking.com"
              required 
              value={formData.email}
              onChange={e => setFormData({...formData, email: e.target.value})}
            />
          </div>
          
          <div className="space-y-2">
            <Label htmlFor="admin-password">Mật khẩu khởi tạo</Label>
            <Input 
              id="admin-password" 
              type="password" 
              placeholder="••••••••"
              required 
              value={formData.password}
              onChange={e => setFormData({...formData, password: e.target.value})}
            />
          </div>
          
          <div className="space-y-2">
            <Label htmlFor="admin-phone">Số điện thoại</Label>
            <Input 
              id="admin-phone" 
              placeholder="09xx xxx xxx"
              value={formData.phoneNumber}
              onChange={e => setFormData({...formData, phoneNumber: e.target.value})}
            />
          </div>
          
          <DialogFooter className="pt-4">
            <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>
              Hủy
            </Button>
            <Button type="submit" className="bg-red-600 hover:bg-red-700 text-white" disabled={loading}>
              {loading && <Loader2 className="w-4 h-4 animate-spin mr-2" />}
              Xác nhận tạo Admin
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  )
}
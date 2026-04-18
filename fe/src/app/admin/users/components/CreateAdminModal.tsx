'use client'
import { useState } from 'react'
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { toast } from 'react-hot-toast'
import Cookies from 'js-cookie'
import { Loader2 } from 'lucide-react'
import { VIETNAM_CITIES } from '@/lib/location'

export function CreateAdminModal({ open, onOpenChange }: any) {
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

    if (formData.password !== formData.confirmPassword) {
      return toast.error('Mật khẩu nhập lại không khớp fen ơi!')
    }

    if (!formData.assignedCity) {
      return toast.error('Vui lòng chọn khu vực quản lý!')
    }

    setLoading(true)
    try {
      const token = Cookies.get('authToken')
      const response = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/admin/users`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${token}` },
        body: JSON.stringify(formData)
      })

      const data = await response.json()
      if (data.success) {
        toast.success(`Đã bổ nhiệm ${formData.fullName} quản lý vùng ${formData.assignedCity}! 🏢`)
        onOpenChange(false)
        window.location.reload()
      } else {
        toast.error(data.message)
      }
    } catch (error) {
      toast.error('Lỗi server!')
    } finally {
      setLoading(false)
    }
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[450px] bg-white text-gray-900">
        <DialogHeader>
          <DialogTitle className="text-red-600 font-bold text-xl">Thêm Quản Lý Vùng (Admin)</DialogTitle>
        </DialogHeader>
        
        <form onSubmit={handleSubmit} className="space-y-4 py-4">
          <div className="space-y-2">
            <Label>Họ và tên</Label>
            <Input required value={formData.fullName} onChange={e => setFormData({...formData, fullName: e.target.value})} />
          </div>
          
          <div className="space-y-2">
            <Label>Email đăng nhập</Label>
            <Input type="email" required value={formData.email} onChange={e => setFormData({...formData, email: e.target.value})} />
          </div>

          {/* CHỌN THÀNH PHỐ PHỤ TRÁCH */}
          <div className="space-y-2">
            <Label className="text-blue-600">Khu vực quản lý</Label>
            <Select onValueChange={(val) => setFormData({...formData, assignedCity: val})}>
              <SelectTrigger>
                <SelectValue placeholder="Bấm để chọn thành phố" />
              </SelectTrigger>
              <SelectContent className="max-h-[300px]"> 
                {VIETNAM_CITIES.map(city => (
                    <SelectItem key={city} value={city}>{city}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label>Mật khẩu</Label>
              <Input type="password" required value={formData.password} onChange={e => setFormData({...formData, password: e.target.value})} />
            </div>
            <div className="space-y-2">
              <Label>Nhập lại mật khẩu</Label>
              <Input type="password" required value={formData.confirmPassword} onChange={e => setFormData({...formData, confirmPassword: e.target.value})} />
            </div>
          </div>
          
          <DialogFooter className="pt-4">
            <Button type="submit" className="w-full bg-red-600 hover:bg-red-700" disabled={loading}>
              {loading && <Loader2 className="w-4 h-4 animate-spin mr-2" />}
              Xác nhận bổ nhiệm
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  )
}
'use client'
import { Card } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { Switch } from '@/components/ui/switch'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { CreditCard, Image, Bell, Palette, Shield } from 'lucide-react'

export default function SystemSettingsPage() {
  return (
    <main className="flex-1 overflow-y-auto p-8 bg-gray-50">
      {/* <div className="max-w-7xl mx-auto">
        <h1 className="text-gray-900 text-3xl mb-8">Cấu Hình Hệ Thống</h1>

        <Tabs defaultValue="payment" className="w-full">
          <TabsList className="bg-white border border-gray-200">
            <TabsTrigger value="payment" className="data-[state=active]:bg-gray-100">
              <CreditCard className="w-4 h-4 mr-2" />
              Thanh Toán
            </TabsTrigger>
            <TabsTrigger value="banners" className="data-[state=active]:bg-gray-100">
              <Image className="w-4 h-4 mr-2" />
              Banner & Media
            </TabsTrigger>
            <TabsTrigger value="notifications" className="data-[state=active]:bg-gray-100">
              <Bell className="w-4 h-4 mr-2" />
              Thông Báo
            </TabsTrigger>
            <TabsTrigger value="theme" className="data-[state=active]:bg-gray-100">
              <Palette className="w-4 h-4 mr-2" />
              Giao Diện
            </TabsTrigger>
            <TabsTrigger value="security" className="data-[state=active]:bg-gray-100">
              <Shield className="w-4 h-4 mr-2" />
              Bảo Mật
            </TabsTrigger>
          </TabsList>

          <TabsContent value="payment" className="mt-6">
            <Card className="bg-white border-gray-200 p-6">
              <h3 className="text-gray-900 mb-6">Cài Đặt Thanh Toán</h3>
              <div className="space-y-6">
                <div className="flex items-center justify-between p-4 border border-gray-200 rounded-lg">
                  <div className="flex items-center gap-3">
                    <div className="w-12 h-12 bg-blue-100 rounded flex items-center justify-center">
                      <CreditCard className="w-6 h-6 text-blue-600" />
                    </div>
                    <div>
                      <h4 className="text-gray-900">Thẻ Tín Dụng / Ghi Nợ</h4>
                      <p className="text-gray-500 text-sm">Visa, Mastercard, JCB</p>
                    </div>
                  </div>
                  <Switch />
                </div>
                <div className="flex items-center justify-between p-4 border border-gray-200 rounded-lg">
                  <div className="flex items-center gap-3">
                    <div className="w-12 h-12 bg-purple-100 rounded flex items-center justify-center">
                      <CreditCard className="w-6 h-6 text-purple-600" />
                    </div>
                    <div>
                      <h4 className="text-gray-900">Ví Điện Tử</h4>
                      <p className="text-gray-500 text-sm">MoMo, ZaloPay, VNPay</p>
                    </div>
                  </div>
                  <Switch defaultChecked />
                </div>
                <div className="flex items-center justify-between p-4 border border-gray-200 rounded-lg">
                  <div className="flex items-center gap-3">
                    <div className="w-12 h-12 bg-green-100 rounded flex items-center justify-center">
                      <CreditCard className="w-6 h-6 text-green-600" />
                    </div>
                    <div>
                      <h4 className="text-gray-900">Chuyển Khoản Ngân Hàng</h4>
                      <p className="text-gray-500 text-sm">Chuyển khoản trực tiếp</p>
                    </div>
                  </div>
                  <Switch defaultChecked />
                </div>
                <div className="pt-4">
                  <Label htmlFor="commissionRate" className="text-gray-700">Phí Giao Dịch (%)</Label>
                  <Input
                    id="commissionRate"
                    type="number"
                    placeholder="2.5"
                    className="bg-gray-50 border-gray-300 text-gray-900 mt-2"
                  />
                </div>
                <Button className="bg-blue-600 hover:bg-blue-700 text-white w-full">Lưu Cài Đặt</Button>
              </div>
            </Card>
          </TabsContent>

          <TabsContent value="banners" className="mt-6">
            <Card className="bg-white border-gray-200 p-6">
              <h3 className="text-gray-900 mb-6">Cài Đặt Banner & Media</h3>
              <div className="space-y-6">
                <div>
                  <Label htmlFor="mainBanner" className="text-gray-700">Banner Trang Chủ</Label>
                  <Input
                    id="mainBanner"
                    type="file"
                    accept="image/*"
                    className="bg-gray-50 border-gray-300 text-gray-900 mt-2"
                  />
                  <p className="text-gray-500 text-sm mt-2">Kích thước đề xuất: 1920x600px</p>
                </div>
                <div>
                  <Label htmlFor="promoBanner" className="text-gray-700">Banner Khuyến Mãi</Label>
                  <Input
                    id="promoBanner"
                    type="file"
                    accept="image/*"
                    className="bg-gray-50 border-gray-300 text-gray-900 mt-2"
                  />
                  <p className="text-gray-500 text-sm mt-2">Kích thước đề xuất: 1200x400px</p>
                </div>
                <div>
                  <Label htmlFor="logoUpload" className="text-gray-700">Logo Website</Label>
                  <Input
                    id="logoUpload"
                    type="file"
                    accept="image/*"
                    className="bg-gray-50 border-gray-300 text-gray-900 mt-2"
                  />
                  <p className="text-gray-500 text-sm mt-2">Kích thước đề xuất: 200x200px (PNG với nền trong suốt)</p>
                </div>
                <div>
                  <Label htmlFor="videoUrl" className="text-gray-700">URL Video Giới Thiệu</Label>
                  <Input
                    id="videoUrl"
                    placeholder="https://youtube.com/watch?v=..."
                    className="bg-gray-50 border-gray-300 text-gray-900 mt-2"
                  />
                </div>
                <Button className="bg-blue-600 hover:bg-blue-700 text-white w-full">Lưu Cài Đặt</Button>
              </div>
            </Card>
          </TabsContent>

          <TabsContent value="notifications" className="mt-6">
            <Card className="bg-white border-gray-200 p-6">
              <h3 className="text-gray-900 mb-6">Cài Đặt Thông Báo</h3>
              <div className="space-y-4">
                <div className="flex items-center justify-between p-4 border border-gray-200 rounded-lg">
                  <div>
                    <h4 className="text-gray-900">Email Xác Nhận Đặt Vé</h4>
                    <p className="text-gray-500 text-sm">Gửi email khi đặt vé thành công</p>
                  </div>
                  <Switch defaultChecked />
                </div>
                <div className="flex items-center justify-between p-4 border border-gray-200 rounded-lg">
                  <div>
                    <h4 className="text-gray-900">Nhắc Nhở Suất Chiếu</h4>
                    <p className="text-gray-500 text-sm">Gửi thông báo trước 1 giờ chiếu phim</p>
                  </div>
                  <Switch defaultChecked />
                </div>
                <div className="flex items-center justify-between p-4 border border-gray-200 rounded-lg">
                  <div>
                    <h4 className="text-gray-900">Khuyến Mãi & Ưu Đãi</h4>
                    <p className="text-gray-500 text-sm">Thông báo về chương trình khuyến mãi</p>
                  </div>
                  <Switch />
                </div>
                <div className="flex items-center justify-between p-4 border border-gray-200 rounded-lg">
                  <div>
                    <h4 className="text-gray-900">Phim Mới Ra Mắt</h4>
                    <p className="text-gray-500 text-sm">Thông báo khi có phim mới</p>
                  </div>
                  <Switch defaultChecked />
                </div>
                <div className="pt-4">
                  <Label htmlFor="emailTemplate" className="text-gray-700">Mẫu Email</Label>
                  <Textarea
                    id="emailTemplate"
                    placeholder="Nhập nội dung mẫu email..."
                    className="bg-gray-50 border-gray-300 text-gray-900 mt-2 min-h-[150px]"
                  />
                </div>
                <Button className="bg-blue-600 hover:bg-blue-700 text-white w-full">Lưu Cài Đặt</Button>
              </div>
            </Card>
          </TabsContent>

          <TabsContent value="theme" className="mt-6">
            <Card className="bg-white border-gray-200 p-6">
              <h3 className="text-gray-900 mb-6">Cài Đặt Giao Diện</h3>
              <div className="space-y-6">
                <div>
                  <Label htmlFor="primaryColor" className="text-gray-700">Màu Chủ Đạo</Label>
                  <div className="flex gap-2 mt-2">
                    <Input
                      id="primaryColor"
                      type="color"
                      defaultValue="#3b82f6"
                      className="w-20 h-10"
                    />
                    <Input
                      placeholder="#3b82f6"
                      className="flex-1 bg-gray-50 border-gray-300 text-gray-900"
                    />
                  </div>
                </div>
                <div>
                  <Label htmlFor="secondaryColor" className="text-gray-700">Màu Phụ</Label>
                  <div className="flex gap-2 mt-2">
                    <Input
                      id="secondaryColor"
                      type="color"
                      defaultValue="#8b5cf6"
                      className="w-20 h-10"
                    />
                    <Input
                      placeholder="#8b5cf6"
                      className="flex-1 bg-gray-50 border-gray-300 text-gray-900"
                    />
                  </div>
                </div>
                <div>
                  <Label htmlFor="fontFamily" className="text-gray-700">Font Chữ</Label>
                  <Select>
                    <SelectTrigger className="bg-gray-50 border-gray-300 text-gray-900 mt-2">
                      <SelectValue placeholder="Chọn font..." />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="inter">Inter</SelectItem>
                      <SelectItem value="roboto">Roboto</SelectItem>
                      <SelectItem value="opensans">Open Sans</SelectItem>
                      <SelectItem value="lato">Lato</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div>
                  <Label htmlFor="borderRadius" className="text-gray-700">Độ Bo Góc (px)</Label>
                  <Input
                    id="borderRadius"
                    type="number"
                    placeholder="8"
                    className="bg-gray-50 border-gray-300 text-gray-900 mt-2"
                  />
                </div>
                <div className="flex items-center justify-between p-4 border border-gray-200 rounded-lg">
                  <div>
                    <h4 className="text-gray-900">Chế Độ Tối</h4>
                    <p className="text-gray-500 text-sm">Bật chế độ giao diện tối</p>
                  </div>
                  <Switch />
                </div>
                <Button className="bg-blue-600 hover:bg-blue-700 text-white w-full">Lưu Cài Đặt</Button>
              </div>
            </Card>
          </TabsContent>

          <TabsContent value="security" className="mt-6">
            <Card className="bg-white border-gray-200 p-6">
              <h3 className="text-gray-900 mb-6">Cài Đặt Bảo Mật</h3>
              <div className="space-y-6">
                <div className="flex items-center justify-between p-4 border border-gray-200 rounded-lg">
                  <div>
                    <h4 className="text-gray-900">Xác Thực Hai Yếu Tố (2FA)</h4>
                    <p className="text-gray-500 text-sm">Bật xác thực hai bước cho admin</p>
                  </div>
                  <Switch />
                </div>
                <div className="flex items-center justify-between p-4 border border-gray-200 rounded-lg">
                  <div>
                    <h4 className="text-gray-900">Tự Động Đăng Xuất</h4>
                    <p className="text-gray-500 text-sm">Đăng xuất sau 30 phút không hoạt động</p>
                  </div>
                  <Switch defaultChecked />
                </div>
                <div>
                  <Label htmlFor="passwordPolicy" className="text-gray-700">Chính Sách Mật Khẩu</Label>
                  <Select>
                    <SelectTrigger className="bg-gray-50 border-gray-300 text-gray-900 mt-2">
                      <SelectValue placeholder="Chọn mức độ..." />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="weak">Yếu (6 ký tự)</SelectItem>
                      <SelectItem value="medium">Trung bình (8 ký tự, bao gồm số)</SelectItem>
                      <SelectItem value="strong">Mạnh (10 ký tự, bao gồm số và ký tự đặc biệt)</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div>
                  <Label htmlFor="sessionTimeout" className="text-gray-700">Thời Gian Phiên (phút)</Label>
                  <Input
                    id="sessionTimeout"
                    type="number"
                    placeholder="30"
                    className="bg-gray-50 border-gray-300 text-gray-900 mt-2"
                  />
                </div>
                <div>
                  <Label htmlFor="ipWhitelist" className="text-gray-700">IP Whitelist</Label>
                  <Textarea
                    id="ipWhitelist"
                    placeholder="192.168.1.1&#10;10.0.0.1"
                    className="bg-gray-50 border-gray-300 text-gray-900 mt-2"
                  />
                  <p className="text-gray-500 text-sm mt-2">Nhập mỗi IP trên một dòng</p>
                </div>
                <Button className="bg-blue-600 hover:bg-blue-700 text-white w-full">Lưu Cài Đặt</Button>
              </div>
            </Card>
          </TabsContent>
        </Tabs>
      </div> */}
      Chức năng đang phát triển
    </main>
  )
}

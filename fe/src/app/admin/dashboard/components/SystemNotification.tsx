import { TrendingUp } from 'lucide-react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Alert, AlertDescription } from '@/components/ui/alert'
import { Button } from '@/components/ui/button'

export function SystemNotification() {
  return (
    <Card className="border-none shadow-sm bg-gradient-to-br from-amber-50 to-orange-50 border-amber-100 h-full">
      <CardHeader>
        <CardTitle className="flex items-center gap-2 text-amber-800">
          <TrendingUp className="w-5 h-5" /> Thông báo hệ thống
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        <Alert className="bg-white/50 border-amber-200">
          <AlertDescription className="text-amber-900 text-sm">
            Hệ thống sẽ bảo trì định kỳ vào <strong>02:00 AM</strong> ngày mai. Vui lòng lưu lại các
            thay đổi quan trọng.
          </AlertDescription>
        </Alert>

        <div className="flex gap-2">
          <Button size="sm" className="bg-amber-600 hover:bg-amber-700 text-white border-none">
            Xem lịch bảo trì
          </Button>
          <Button size="sm" variant="ghost" className="text-amber-800 hover:bg-amber-100">
            Bỏ qua
          </Button>
        </div>
      </CardContent>
    </Card>
  )
}

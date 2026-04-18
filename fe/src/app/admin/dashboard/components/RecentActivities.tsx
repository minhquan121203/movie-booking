import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card'
import { UserPlus, CreditCard, Settings, User } from 'lucide-react'
import { recentActivities } from '../constants/mockData'

const getIcon = (iconName: string) => {
  switch (iconName) {
    case 'UserPlus':
      return UserPlus
    case 'CreditCard':
      return CreditCard
    case 'Settings':
      return Settings
    default:
      return User
  }
}

export function RecentActivities() {
  return (
    <Card className="border-gray-100 shadow-sm h-full bg-gray-50">
      <CardHeader>
        <CardTitle className="text-lg font-bold text-gray-800">Hoạt Động Gần Đây</CardTitle>
        <CardDescription>Theo dõi hoạt động người dùng trên hệ thống</CardDescription>
      </CardHeader>
      <CardContent>
        <div className="relative pl-2">
          Chức năng đang phát triển
          {/* Timeline Line */}
          {/* <div className="absolute left-[19px] top-2 bottom-2 w-[2px] bg-gray-100" />
          
          <div className="space-y-6">
            {recentActivities.map((item, index) => {
                const Icon = getIcon(item.icon);
                return (
                    <div key={index} className="flex gap-4 relative">
                        <div className={`w-10 h-10 rounded-full flex items-center justify-center shrink-0 z-10 border-4 border-white ${item.color}`}>
                            <Icon className="w-4 h-4" />
                        </div>
                        <div className="pt-1">
                            <p className="text-sm text-gray-800">
                                <span className="font-semibold">{item.user}</span> {item.action}
                            </p>
                            <p className="text-xs text-gray-400 mt-0.5">{item.time}</p>
                        </div>
                    </div>
                )
            })}
          </div> */}
        </div>
      </CardContent>
    </Card>
  )
}

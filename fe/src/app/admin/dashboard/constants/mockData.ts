import { Users, Film, MapPin, UserCheck } from 'lucide-react'

export const kpiData = [
  {
    icon: Users,
    label: 'Tổng số tài khoản',
    value: '12,458',
    change: '+245 tài khoản mới',
    color: 'bg-indigo-500',
    bgColor: 'bg-indigo-50',
    textColor: 'text-indigo-600',
  },
  {
    icon: Film,
    label: 'Số lượng phim',
    value: '342',
    change: '+8 phim mới',
    color: 'bg-blue-500',
    bgColor: 'bg-blue-50',
    textColor: 'text-blue-600',
  },
  {
    icon: MapPin,
    label: 'Số lượng rạp',
    value: '28',
    change: '+2 rạp mới',
    color: 'bg-purple-500',
    bgColor: 'bg-purple-50',
    textColor: 'text-purple-600',
  },
  {
    icon: UserCheck,
    label: 'Tài khoản đang online',
    value: '1,847',
    change: 'Đang hoạt động',
    color: 'bg-green-500',
    bgColor: 'bg-green-50',
    textColor: 'text-green-600',
  },
]

export const topMovies = [
  { name: 'Avatar: The Way of Water', value: 125000, color: 'bg-indigo-400' },
  { name: 'Guardians of the Galaxy Vol. 3', value: 98000, color: 'bg-indigo-400' },
  { name: 'The Marvels', value: 85000, color: 'bg-indigo-400' },
  { name: 'Oppenheimer', value: 72000, color: 'bg-indigo-400' },
  { name: 'Barbie', value: 68000, color: 'bg-indigo-400' },
]

export const topTheaters = [
  { name: 'CGV Vincom Center', value: 2850, unit: 'Triệu', color: 'bg-orange-400' },
  { name: 'Lotte Cinema Landmark', value: 2620, unit: 'Triệu', color: 'bg-orange-400' },
  { name: 'Galaxy Nguyễn Du', value: 2380, unit: 'Triệu', color: 'bg-orange-400' },
  { name: 'CGV Aeon Mall', value: 2150, unit: 'Triệu', color: 'bg-orange-400' },
  { name: 'BHD Star Cineplex', value: 1980, unit: 'Triệu', color: 'bg-orange-400' },
]

export const upcomingMovies = [
  {
    id: 1,
    title: 'Avatar: The Way of Water',
    releaseDate: '15/12/2024',
    genre: 'Sci-Fi, Adventure',
    image: 'https://images.unsplash.com/photo-1536440136628-849c177e76a1?w=100&h=150&fit=crop',
  },
  {
    id: 2,
    title: 'Guardians of the Galaxy Vol. 3',
    releaseDate: '20/12/2024',
    genre: 'Action, Comedy',
    image: 'https://images.unsplash.com/photo-1626814026160-2237a95fc5a0?w=100&h=150&fit=crop',
  },
  {
    id: 3,
    title: 'The Marvels',
    releaseDate: '28/12/2024',
    genre: 'Action, Superhero',
    image: 'https://images.unsplash.com/photo-1635805737707-575885ab0820?w=100&h=150&fit=crop',
  },
  {
    id: 4,
    title: 'Dune: Part Two',
    releaseDate: '05/01/2025',
    genre: 'Sci-Fi, Drama',
    image: 'https://images.unsplash.com/photo-1547700055-b61cacebece9?w=100&h=150&fit=crop',
  },
]

export const recentActivities = [
  {
    user: 'Nguyễn Văn An',
    action: 'đã đăng ký tài khoản mới',
    time: '5 phút trước',
    icon: 'UserPlus',
    color: 'text-green-500 bg-green-100',
  },
  {
    user: 'Trần Thị Bình',
    action: 'đã đặt 3 vé xem Avatar',
    time: '12 phút trước',
    icon: 'CreditCard',
    color: 'text-blue-500 bg-blue-100',
  },
  {
    user: 'Lê Minh Châu',
    action: 'đã đăng ký tài khoản mới',
    time: '18 phút trước',
    icon: 'UserPlus',
    color: 'text-green-500 bg-green-100',
  },
  {
    user: 'Phạm Văn Dũng',
    action: 'đã cập nhật thông tin cá nhân',
    time: '25 phút trước',
    icon: 'Settings',
    color: 'text-purple-500 bg-purple-100',
  },
  {
    user: 'Hoàng Thị Hoa',
    action: 'đã đặt 2 vé xem Guardians',
    time: '32 phút trước',
    icon: 'CreditCard',
    color: 'text-blue-500 bg-blue-100',
  },
  {
    user: 'Đỗ Văn Khải',
    action: 'đã đăng ký tài khoản mới',
    time: '45 phút trước',
    icon: 'UserPlus',
    color: 'text-green-500 bg-green-100',
  },
]

import { useState, useMemo } from 'react'
import { UserProfile } from '../types'
import { useMe } from '@/lib/api/userMe' // Import thêm
import { updateProfileApi, UpdateProfileDTO } from '@/lib/api/userMe' // Import API cập nhật
import { useMutation, useQueryClient } from '@tanstack/react-query' // Import React Query
import { toast } from 'sonner'
import { useNotification } from '@/providers/NotificationProvider'

export function useProfile() {
  const queryClient = useQueryClient() // Dùng để refresh data
  const { showSuccess, showError } = useNotification()

  // 1. Lấy dữ liệu từ API (Server State)
  const { data: userData, isLoading, error, refetch } = useMe()

  const [localUpdates, setLocalUpdates] = useState<Partial<UserProfile>>({})
  const [isEditing, setIsEditing] = useState(false)

  // 2. Derived State (Giữ nguyên logic cũ để hiển thị)
  const user = useMemo(() => {
    if (!userData) return null
    const baseUser = userData as UserProfile

    return {
      ...baseUser,
      dateOfBirth: baseUser.dateOfBirth || '',
      phoneNumber: baseUser.phoneNumber || '',
      preferences: {
        emailNotification: true,
        smsNotification: false,
        ...(baseUser.preferences || {}),
        ...(localUpdates.preferences || {}),
      },
      ...localUpdates,
    } as UserProfile
  }, [userData, localUpdates])

  // 3. Mutation gọi API cập nhật (THÊM MỚI)
  const { mutate: saveProfile, isPending: isUpdating } = useMutation({
    mutationFn: (data: UpdateProfileDTO) => updateProfileApi(data),

    onSuccess: () => {
      showSuccess('Cập nhập hồ sơ thành công!')
      setIsEditing(false)
      setLocalUpdates({}) // Reset local updates vì data mới đã được fetch
      queryClient.invalidateQueries({ queryKey: ['me'] }) // Fetch lại dữ liệu mới nhất từ server
    },

    onError: (err: any) => {
      const msg = err?.response?.data?.message || 'Cập nhật thất bại'
      showError('Lỗi!', msg)
    },
  })

  // 4. Hàm xử lý update (được gọi từ form)
  const updateProfile = (data: Partial<UserProfile>) => {
    // Cập nhật Optimistic UI (hiển thị ngay lập tức cho mượt)
    setLocalUpdates(prev => ({ ...prev, ...data }))

    // Chuẩn bị dữ liệu gửi lên API (chỉ lấy fullName và phoneNumber theo Swagger)
    const payload: UpdateProfileDTO = {
      fullName: data.fullName,
      phoneNumber: data.phoneNumber,
      // Nếu backend sau này hỗ trợ dateOfBirth thì thêm vào đây:
      // dateOfBirth: data.dateOfBirth
    }

    // Gọi API
    saveProfile(payload)
  }

  // 5. Toggle preferences (Giữ nguyên - giả sử chỉ lưu local hoặc gọi API khác)
  const togglePreference = (key: keyof NonNullable<UserProfile['preferences']>) => {
    if (!user || !user.preferences) return
    const currentVal = user.preferences[key]

    setLocalUpdates(prev => {
      const basePreferences = user.preferences || {
        emailNotification: true,
        smsNotification: false,
      }
      return {
        ...prev,
        preferences: { ...basePreferences, [key]: !currentVal },
      }
    })
    // Lưu ý: Nếu muốn lưu preferences lên server, cần gọi thêm API tương ứng ở đây
  }

  return {
    user,
    isLoading: isLoading || isUpdating, // Hiển thị loading khi đang fetch hoặc đang update
    isError: !!error,
    isEditing,
    setIsEditing,
    updateProfile,
    togglePreference,
    refetch,
  }
}

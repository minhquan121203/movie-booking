'use client'

import { createContext, useContext, useState, useCallback, ReactNode } from 'react'
import { AnimatePresence } from 'framer-motion'
import { NotificationToast } from '@/app/components/Notification'

type NotificationType = 'success' | 'error'

interface NotificationData {
  id: number
  type: NotificationType
  title: string
  message?: string
}

interface NotificationContextType {
  showSuccess: (title: string, message?: string) => void
  showError: (title: string, message?: string) => void
}

const NotificationContext = createContext<NotificationContextType | undefined>(undefined)

export function NotificationProvider({ children }: { children: ReactNode }) {
  const [notification, setNotification] = useState<NotificationData | null>(null)

  const showNotification = useCallback(
    (type: NotificationType, title: string, message?: string) => {
      const id = Date.now()
      setNotification({ id, type, title, message })

      // Tự động ẩn sau 3 giây
      setTimeout(() => {
        setNotification(prev => (prev?.id === id ? null : prev))
      }, 3000)
    },
    []
  )

  const showSuccess = useCallback(
    (title: string, message?: string) => {
      showNotification('success', title, message)
    },
    [showNotification]
  )

  const showError = useCallback(
    (title: string, message?: string) => {
      showNotification('error', title, message)
    },
    [showNotification]
  )

  const closeNotification = () => {
    setNotification(null)
  }

  return (
    <NotificationContext.Provider value={{ showSuccess, showError }}>
      {children}

      {/* Vùng hiển thị Notification */}
      <AnimatePresence>
        {notification && (
          <NotificationToast
            key={notification.id}
            type={notification.type}
            title={notification.title}
            message={notification.message}
            onClose={closeNotification}
          />
        )}
      </AnimatePresence>
    </NotificationContext.Provider>
  )
}

// Custom Hook để sử dụng ở các component khác
export const useNotification = () => {
  const context = useContext(NotificationContext)
  if (!context) {
    throw new Error('useNotification phải được sử dụng bên trong NotificationProvider')
  }
  return context
}

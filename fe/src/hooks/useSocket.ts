'use client'

import { useEffect, useState } from 'react'
import { io, Socket } from 'socket.io-client'
import Cookies from 'js-cookie'

export default function useSocket() {
  const [socket, setSocket] = useState<Socket | null>(null)
  const [isConnected, setIsConnected] = useState(false)

  useEffect(() => {
    // 1. Lấy token
    const token = Cookies.get('authToken')

    // 2. Lấy API URL và đảm bảo không có trailing slash
    // const apiUrl = 'http://localhost:5000'.replace(/\/$/, '')
    const apiUrl = 'https://movie-booking-api-bcfe.onrender.com'.replace(/\/$/, '')

    console.log('🔌 Connecting to WebSocket:', apiUrl)
    // 3. Khởi tạo socket với cấu hình đúng
    const socketInstance = io(apiUrl, {
      auth: {
        token: token || undefined, // Guest nếu không có token
      },
      transports: ['websocket', 'polling'], // Thử websocket trước, fallback polling
      reconnection: true,
      reconnectionDelay: 1000,
      reconnectionDelayMax: 5000,
      reconnectionAttempts: 5,
      timeout: 20000, // 20 seconds timeout
      autoConnect: true, // Tự động kết nối
      forceNew: false, // Sử dụng lại connection nếu có
    })

    // 3. Lắng nghe các sự kiện kết nối
    socketInstance.on('connect', () => {
      console.log('✅ WebSocket Connected:', socketInstance.id)
      console.log('📡 Transport:', socketInstance.io.engine.transport.name)
      setIsConnected(true)
    })

    socketInstance.on('disconnect', reason => {
      console.log('❌ WebSocket Disconnected:', reason)
      setIsConnected(false)

      // Tự động reconnect cho một số lý do cụ thể
      if (reason === 'io server disconnect') {
        // Server ngắt kết nối, cần reconnect thủ công
        console.log('🔄 Server disconnected, attempting to reconnect...')
        socketInstance.connect()
      }
    })

    // socketInstance.on('connect_error', error => {
    //   console.error('🔴 Connection Error:', error.message)
    //   console.error('📋 Error details:', {
    //     type: error.type,
    //     description: error.description,
    //   })
    //   setIsConnected(false)
    // })

    socketInstance.on('connect_error', (error: any) => {
      console.error('🔴 Connection Error:', error.message)
      setIsConnected(false)
    })

    socketInstance.on('reconnect', attemptNumber => {
      console.log('🔄 Reconnected after', attemptNumber, 'attempts')
    })

    socketInstance.on('reconnect_attempt', attemptNumber => {
      console.log('🔄 Reconnection attempt:', attemptNumber)
    })

    socketInstance.on('reconnect_error', error => {
      console.error('🔴 Reconnection error:', error.message)
    })

    socketInstance.on('reconnect_failed', () => {
      console.error('🔴 Reconnection failed after all attempts')
    })

    setSocket(socketInstance)

    // 4. Cleanup: Ngắt kết nối khi unmount
    return () => {
      console.log('🔌 Disconnecting socket...')
      socketInstance.disconnect()
    }
  }, [])

  return { socket, isConnected }
}

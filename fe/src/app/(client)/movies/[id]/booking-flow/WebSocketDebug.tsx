'use client'

import { useEffect, useState } from 'react'
import useSocket from '@/hooks/useSocket'
import { Wifi, WifiOff, RefreshCw } from 'lucide-react'
import { Button } from '@/components/ui/button'

export function WebSocketDebug() {
  const { socket, isConnected } = useSocket()
  const [logs, setLogs] = useState<string[]>([])
  const [socketId, setSocketId] = useState<string>('')

  useEffect(() => {
    if (!socket) return

    const addLog = (message: string) => {
      setLogs(prev => [...prev.slice(-9), `${new Date().toLocaleTimeString()}: ${message}`])
    }

    socket.on('connect', () => {
      setSocketId(socket.id || '')
      addLog(`✅ Connected with ID: ${socket.id}`)
    })

    socket.on('disconnect', reason => {
      addLog(`❌ Disconnected: ${reason}`)
      setSocketId('')
    })

    socket.on('connect_error', error => {
      addLog(`🔴 Error: ${error.message}`)
    })

    return () => {
      socket.off('connect')
      socket.off('disconnect')
      socket.off('connect_error')
    }
  }, [socket])

  const handleReconnect = () => {
    if (socket) {
      socket.disconnect()
      setTimeout(() => socket.connect(), 500)
    }
  }

  return (
    <div className="fixed bottom-4 right-4 bg-surface border border-border rounded-lg p-4 shadow-lg max-w-sm z-50">
      <div className="flex items-center justify-between mb-3">
        <div className="flex items-center gap-2">
          {isConnected ? (
            <>
              <Wifi className="w-5 h-5 text-green-500" />
              <span className="text-sm font-semibold text-green-500">Connected</span>
            </>
          ) : (
            <>
              <WifiOff className="w-5 h-5 text-red-500" />
              <span className="text-sm font-semibold text-red-500">Disconnected</span>
            </>
          )}
        </div>
        <Button size="sm" variant="ghost" onClick={handleReconnect} className="h-8 w-8 p-0">
          <RefreshCw className="w-4 h-4" />
        </Button>
      </div>

      {socketId && (
        <div className="text-xs text-text-secondary mb-2">
          ID: <code className="bg-bg-secondary px-1 py-0.5 rounded">{socketId.slice(0, 8)}...</code>
        </div>
      )}

      <div className="space-y-1 max-h-32 overflow-y-auto text-xs">
        {logs.length === 0 ? (
          <div className="text-text-secondary italic">Waiting for events...</div>
        ) : (
          logs.map((log, i) => (
            <div key={i} className="text-text-secondary font-mono">
              {log}
            </div>
          ))
        )}
      </div>

      <div className="mt-3 pt-3 border-t border-border text-xs text-text-secondary">
        <div>API: {process.env.NEXT_PUBLIC_API_URL || 'localhost:5000'}</div>
      </div>
    </div>
  )
}

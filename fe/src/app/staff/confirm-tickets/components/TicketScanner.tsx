'use client'

import { useState, useRef, useEffect } from 'react'
import { Card } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { QrCode, ScanLine, Camera, X, AlertCircle, RotateCw } from 'lucide-react'
import { Alert, AlertDescription } from '@/components/ui/alert'
import { BrowserQRCodeReader, IScannerControls } from '@zxing/browser'
import { getBookingByCode } from '@/lib/api/booking'
import { TicketVerify } from '@/types/booking'
import { useNotification } from '@/providers/NotificationProvider'

interface TicketScannerProps {
  onScan: (ticketData: TicketVerify) => void
  isLoading?: boolean
}

export function TicketScanner({ onScan, isLoading }: TicketScannerProps) {
  const { showError } = useNotification()

  const [ticketCode, setTicketCode] = useState('')
  const [isCameraMode, setIsCameraMode] = useState(false)
  const [isInitializing, setIsInitializing] = useState(false)
  const [isFetching, setIsFetching] = useState(false)
  const [cameraError, setCameraError] = useState<string | null>(null)
  const [availableCameras, setAvailableCameras] = useState<MediaDeviceInfo[]>([])
  const [selectedCameraId, setSelectedCameraId] = useState<string>('')

  const videoRef = useRef<HTMLVideoElement>(null)
  const readerRef = useRef<BrowserQRCodeReader | null>(null)
  const controlsRef = useRef<IScannerControls | null>(null)

  // Initialize ZXing Reader
  useEffect(() => {
    readerRef.current = new BrowserQRCodeReader()
    return () => {
      stopCamera()
    }
  }, [])

  // Get available cameras
  const getCameras = async () => {
    try {
      const devices = await BrowserQRCodeReader.listVideoInputDevices()
      setAvailableCameras(devices)

      // Auto select back camera if available
      const backCamera = devices.find(
        device =>
          device.label.toLowerCase().includes('back') ||
          device.label.toLowerCase().includes('rear') ||
          device.label.toLowerCase().includes('environment')
      )

      setSelectedCameraId(backCamera?.deviceId || devices[0]?.deviceId || '')
      return devices
    } catch (error) {
      console.error('Error getting cameras:', error)
      setCameraError('Không thể truy cập danh sách camera')
      return []
    }
  }

  // Fetch booking data by code
  const fetchBookingData = async (bookingCode: string) => {
    setIsFetching(true)
    try {
      const bookingData = await getBookingByCode(bookingCode)
      console.log('Fetched booking data:', bookingData)
      onScan(bookingData)
    } catch (error: any) {
      showError('Lỗi!', error.message || 'Không tìm thấy vé')
    } finally {
      setIsFetching(false)
    }
  }

  // Start camera scanning
  const startCamera = async () => {
    await setIsCameraMode(true)
    if (!readerRef.current || !videoRef.current) return
    setIsInitializing(true)
    setCameraError(null)

    try {
      // Get cameras if not loaded
      if (availableCameras.length === 0) {
        const cameras = await getCameras()
        if (cameras.length === 0) {
          setCameraError('Không tìm thấy camera trên thiết bị')
          setIsInitializing(false)
          return
        }
      }

      // Start decoding from video device
      const controls = await readerRef.current.decodeFromVideoDevice(
        selectedCameraId || undefined,
        videoRef.current,
        (result, error) => {
          if (result) {
            stopCamera() 
            
            const scannedText = result.getText()
            let finalCode = scannedText 

            try {
              const qrData = JSON.parse(scannedText)
              console.log('Scanned QR JSON data:', qrData)
              
              if (qrData && (qrData.bookingCode || qrData._id)) {
                finalCode = qrData.bookingCode || qrData._id
              }
            } catch (parseError) {
              console.log('QR Code là text thường, không phải JSON')
            }

            console.log('Mã vé cuối cùng đem đi check:', finalCode)
            fetchBookingData(finalCode)
          }

          if (error) {
            const isNotFound =
              error.name === 'NotFoundException' || error.message?.includes('NotFound')

            if (!isNotFound) {
              console.warn('Decode error:', error)
            }
          }
        }
      )

      controlsRef.current = controls
      setIsCameraMode(true)
    } catch (error: any) {
      console.error('Camera error:', error)

      if (error.name === 'NotAllowedError') {
        setCameraError('Quyền truy cập camera bị từ chối. Vui lòng cho phép truy cập.')
      } else if (error.name === 'NotFoundError') {
        setCameraError('Không tìm thấy camera trên thiết bị.')
      } else if (error.name === 'NotReadableError') {
        setCameraError('Camera đang được sử dụng bởi ứng dụng khác.')
      } else if (error.name === 'OverconstrainedError') {
        setCameraError('Không thể khởi tạo camera với cấu hình này.')
      } else {
        setCameraError('Lỗi khi khởi động camera. Vui lòng thử lại.')
      }
    } finally {
      setIsInitializing(false)
    }
  }

  // Stop camera
  const stopCamera = () => {
    if (controlsRef.current) {
      controlsRef.current.stop()
      controlsRef.current = null
    }
    setIsCameraMode(false)
  }

  // Switch camera
  const switchCamera = async () => {
    if (availableCameras.length <= 1) return

    const currentIndex = availableCameras.findIndex(cam => cam.deviceId === selectedCameraId)
    const nextIndex = (currentIndex + 1) % availableCameras.length
    const nextCamera = availableCameras[nextIndex]

    setSelectedCameraId(nextCamera.deviceId)
    stopCamera()

    setTimeout(() => {
      startCamera()
    }, 300)
  }

  // Handle manual input
  const handleManualScan = async () => {
    const code = ticketCode.trim()
    if (code) {
      await fetchBookingData(code)
      setTicketCode('')
    }
  }

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && ticketCode.trim()) {
      handleManualScan()
    }
  }

  const isProcessing = isLoading || isFetching

  return (
    <Card className="p-6 border border-border rounded-[10px] shadow-sm hover:shadow-md transition-shadow">
      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 bg-primary/10 rounded-[10px] flex items-center justify-center">
            <QrCode className="w-5 h-5 text-primary" />
          </div>
          <div>
            <h3 className="text-foreground">Quét mã QR</h3>
            <p className="text-sm text-muted-foreground">
              {isCameraMode ? 'Đang quét bằng camera' : 'Quét mã vé của khách hàng'}
            </p>
          </div>
        </div>

        {isCameraMode && (
          <div className="flex gap-2">
            {availableCameras.length > 1 && (
              <Button
                variant="outline"
                size="sm"
                onClick={switchCamera}
                className="rounded-[10px]"
                title="Chuyển camera"
              >
                <RotateCw className="w-4 h-4" />
              </Button>
            )}
            <Button
              variant="ghost"
              size="icon"
              onClick={stopCamera}
              className="rounded-full"
              title="Đóng camera"
            >
              <X className="w-5 h-5" />
            </Button>
          </div>
        )}
      </div>

      {/* Camera Error Alert */}
      {cameraError && (
        <Alert variant="destructive" className="mb-4">
          <AlertCircle className="h-4 w-4" />
          <AlertDescription>{cameraError}</AlertDescription>
        </Alert>
      )}

      {/* QR Scan Area */}
      <div className="mb-6">
        {!isCameraMode ? (
          <div className="aspect-square bg-linear-to-br from-primary/5 to-primary/10 rounded-[10px] flex flex-col items-center justify-center border-2 border-dashed border-primary/30">
            <ScanLine className="w-16 h-16 text-primary/60 mb-4 animate-pulse" />
            <p className="text-foreground mb-2 font-medium">Quét mã QR với camera</p>
            <p className="text-sm text-muted-foreground mb-4">hoặc nhập mã thủ công bên dưới</p>
            <Button
              onClick={startCamera}
              disabled={isInitializing || isProcessing}
              className="bg-primary hover:bg-primary/90 text-white rounded-[10px]"
            >
              <Camera className="w-4 h-4 mr-2" />
              {isInitializing ? 'Đang khởi động...' : 'Bật Camera'}
            </Button>
          </div>
        ) : (
          <div className="relative rounded-[10px] overflow-hidden bg-black aspect-square">
            <video ref={videoRef} className="w-full h-full object-cover" playsInline muted />

            {/* Scan frame overlay */}
            <div className="absolute inset-0 pointer-events-none">
              <div className="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 w-64 h-64">
                <div className="absolute top-0 left-0 w-8 h-8 border-t-4 border-l-4 border-primary rounded-tl-xl" />
                <div className="absolute top-0 right-0 w-8 h-8 border-t-4 border-r-4 border-primary rounded-tr-xl" />
                <div className="absolute bottom-0 left-0 w-8 h-8 border-b-4 border-l-4 border-primary rounded-bl-xl" />
                <div className="absolute bottom-0 right-0 w-8 h-8 border-b-4 border-r-4 border-primary rounded-br-xl" />
                <div className="absolute inset-x-0 top-0 h-1 bg-primary/80 animate-scan-line" />
              </div>
            </div>

            {/* Instructions overlay */}
            <div className="absolute bottom-4 left-0 right-0 text-center pointer-events-none">
              <div className="inline-block bg-black/70 text-white px-4 py-2 rounded-full text-sm">
                Hướng mã QR vào khung hình
              </div>
            </div>

            {/* Camera info */}
            {availableCameras.length > 1 && (
              <div className="absolute top-4 left-0 right-0 text-center pointer-events-none">
                <div className="inline-block bg-black/70 text-white px-3 py-1 rounded-full text-xs">
                  {availableCameras.find(cam => cam.deviceId === selectedCameraId)?.label ||
                    'Camera'}
                </div>
              </div>
            )}
          </div>
        )}
      </div>

      {/* Manual Input */}
      {!isCameraMode && (
        <div className="space-y-3">
          <label className="text-sm text-muted-foreground">Hoặc nhập mã vé thủ công:</label>
          <Input
            value={ticketCode}
            onChange={e => setTicketCode(e.target.value)}
            onKeyPress={handleKeyPress}
            placeholder="Nhập mã vé (VD: BK20251202S9GA61)"
            className="rounded-[10px]"
            disabled={isProcessing}
          />
          <Button
            onClick={handleManualScan}
            disabled={!ticketCode.trim() || isProcessing}
            className="w-full bg-primary hover:bg-primary-hover text-primary-foreground rounded-[10px] shadow-md shadow-primary/20"
          >
            {isProcessing ? 'Đang kiểm tra...' : 'Kiểm tra vé'}
          </Button>
        </div>
      )}
    </Card>
  )
}

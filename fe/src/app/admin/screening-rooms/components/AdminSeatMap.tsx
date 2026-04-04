import { useState, useCallback } from 'react'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { cn } from '@/lib/utils'
import { X, Save, MousePointer2, Armchair } from 'lucide-react'
import { Badge } from '@/components/ui/badge'

export interface Seat {
  seatNumber: string
  row: string
  column: number
  seatType: 'Thường' | 'VIP' | 'Ghế đôi'
  isAvailable: boolean
  price?: number
}

export interface FlatRoom {
  _id: string
  roomName: string
  seatMap: Seat[]
}

interface AdminSeatMapProps {
  theaterId?: string
  room: FlatRoom
  onClose: () => void
  onSave: (updatedSeatMap: Seat[]) => void
  isSaving: boolean
}

// Interface để bọc dữ liệu ghế đôi lúc render
interface MergedSeatRender {
  mainSeat: Seat
  pairedSeat: Seat | null
  isPair: boolean
  displayNumber: string
}

export function AdminSeatMap({ theaterId, room, onClose, onSave, isSaving }: AdminSeatMapProps) {
  const [seats, setSeats] = useState<Seat[]>(room.seatMap ? room.seatMap : [])
  const [selectedSeats, setSelectedSeats] = useState<Seat[]>([])

  const handleSeatClick = (mergedItem: MergedSeatRender) => {
    const { mainSeat, pairedSeat, isPair } = mergedItem

    setSelectedSeats(prev => {
      const isSelected = prev.some(s => s.seatNumber === mainSeat.seatNumber)

      if (isSelected) {
        return prev.filter(
          s => s.seatNumber !== mainSeat.seatNumber && s.seatNumber !== pairedSeat?.seatNumber
        )
      } else {
        const toAdd = [mainSeat]
        if (isPair && pairedSeat) toAdd.push(pairedSeat)
        return [...prev, ...toAdd]
      }
    })
  }

  const handleSelectRow = (rowLabel: string) => {
    const seatsInRow = seats.filter(s => s.row === rowLabel)
    const allSelected = seatsInRow.every(rowSeat =>
      selectedSeats.some(selected => selected.seatNumber === rowSeat.seatNumber)
    )

    if (allSelected) {
      setSelectedSeats(prev => prev.filter(s => s.row !== rowLabel))
    } else {
      setSelectedSeats(prev => {
        const existingIds = new Set(prev.map(s => s.seatNumber))
        const newSeats = seatsInRow.filter(s => !existingIds.has(s.seatNumber))
        return [...prev, ...newSeats]
      })
    }
  }

  const updateSeatType = useCallback(
    (newType: 'Thường' | 'VIP' | 'Ghế đôi') => {
      if (selectedSeats.length === 0) return

      const selectedIds = new Set(selectedSeats.map(s => s.seatNumber))

      const updatedAllSeats = seats.map(seat => {
        if (selectedIds.has(seat.seatNumber)) {
          return { ...seat, seatType: newType }
        }
        return seat
      })

      setSeats(updatedAllSeats)
      const updatedSelectedSeats = updatedAllSeats.filter(s => selectedIds.has(s.seatNumber))
      setSelectedSeats(updatedSelectedSeats)
    },
    [seats, selectedSeats]
  )

  const toggleSeatStatus = () => {
    if (selectedSeats.length === 0) return

    const selectedIds = new Set(selectedSeats.map(s => s.seatNumber))

    const updatedAllSeats = seats.map(seat => {
      if (selectedIds.has(seat.seatNumber)) {
        return { ...seat, isAvailable: !seat.isAvailable }
      }
      return seat
    })

    setSeats(updatedAllSeats)
    const updatedSelectedSeats = updatedAllSeats.filter(s => selectedIds.has(s.seatNumber))
    setSelectedSeats(updatedSelectedSeats)
  }

  const getSeatStyle = (type: string, isAvailable: boolean, isSelected: boolean) => {
    if (!isAvailable) return 'bg-gray-200 text-gray-400 cursor-not-allowed opacity-60'

    const baseSelectedClass = 'transform scale-110 ring-2 z-10 shadow-md text-white font-bold'

    switch (type) {
      case 'VIP':
        if (isSelected) return `${baseSelectedClass} bg-orange-500 border-orange-600 ring-orange-200`
        return 'bg-orange-100 border-orange-300 text-orange-700 hover:bg-orange-200 font-semibold'
      case 'Ghế đôi':
        if (isSelected) return `${baseSelectedClass} bg-pink-500 border-pink-600 ring-pink-200`
        return 'bg-pink-100 border-pink-300 text-pink-700 hover:bg-pink-200 font-semibold'
      default:
        if (isSelected) return `${baseSelectedClass} bg-slate-600 border-slate-700 ring-slate-300`
        return 'bg-white border-gray-300 text-gray-700 hover:bg-gray-100'
    }
  }

  const rows = Array.from(new Set(seats.map(s => s.row))).sort()

  return (
    <Card className="mt-4 border-2 border-blue-50/50 shadow-xl animate-in fade-in slide-in-from-top-4 bg-white/50 backdrop-blur-sm">
      <CardHeader className="flex flex-row items-center justify-between pb-4 border-b bg-gray-50/80">
        <div>
          <CardTitle className="text-xl text-blue-950 flex items-center gap-2">
            <MousePointer2 className="w-6 h-6 text-blue-600" />
            Thiết lập sơ đồ: <span className="text-blue-700">{room.roomName}</span>
          </CardTitle>
          <p className="text-sm text-gray-500 mt-1 flex items-center gap-1">
            Click vào ghế hoặc tên hàng để chọn. Giữ <Badge variant="outline" className="text-xs">Shift</Badge> để chọn nhanh.
          </p>
        </div>

        <div className="flex items-center gap-3">
          <div className="text-sm font-medium mr-2 bg-white px-3 py-1.5 rounded-full border shadow-sm text-gray-700">
            Đang chọn:
            <Badge variant="secondary" className="ml-2 bg-blue-100 text-blue-800 hover:bg-blue-200">
              {selectedSeats.length}
            </Badge>
            <span className="ml-1 text-xs text-gray-400">ghế</span>
          </div>

          <Button variant="outline" size="sm" onClick={onClose} className="border-gray-300 hover:bg-gray-100">
            <X className="w-4 h-4 mr-2" /> Đóng
          </Button>

          <Button size="sm" onClick={() => onSave(seats)} disabled={isSaving} className="bg-blue-600 hover:bg-blue-700 min-w-[140px] shadow-md shadow-blue-200">
            {isSaving ? 'Đang lưu...' : <><Save className="w-4 h-4 mr-2" /> Lưu Thay Đổi</>}
          </Button>
        </div>
      </CardHeader>

      <CardContent className="p-6 bg-gray-50/30">
        <div className="flex flex-wrap items-center justify-center gap-4 mb-8 sticky top-0 z-20 bg-white/90 backdrop-blur-md p-3 rounded-2xl border shadow-sm transition-all duration-200">
          <span className="text-xs font-bold text-gray-400 uppercase tracking-wider flex items-center gap-1">
            <Armchair className="w-4 h-4" /> Loại ghế:
          </span>

          <div className="flex gap-2">
            <Button
              variant="outline"
              size="sm"
              className={cn('transition-all', selectedSeats.length > 0 && selectedSeats[0].seatType === 'Thường' ? 'ring-2 ring-gray-200 bg-gray-50' : 'hover:bg-gray-50')}
              onClick={() => updateSeatType('Thường')} disabled={selectedSeats.length === 0}
            >
              <div className="w-3 h-3 bg-white border border-gray-400 rounded-sm mr-2"></div> Thường
            </Button>
            <Button
              variant="outline"
              size="sm"
              className={cn('hover:bg-orange-50 border-orange-200 text-orange-700', selectedSeats.length > 0 && selectedSeats[0].seatType === 'VIP' && 'ring-2 ring-orange-200 bg-orange-50')}
              onClick={() => updateSeatType('VIP')} disabled={selectedSeats.length === 0}
            >
              <div className="w-3 h-3 bg-orange-100 border border-orange-400 rounded-sm mr-2"></div> VIP
            </Button>
            <Button
              variant="outline"
              size="sm"
              className={cn('hover:bg-pink-50 border-pink-200 text-pink-700', selectedSeats.length > 0 && selectedSeats[0].seatType === 'Ghế đôi' && 'ring-2 ring-pink-200 bg-pink-50')}
              onClick={() => updateSeatType('Ghế đôi')} disabled={selectedSeats.length === 0}
            >
              <div className="w-3 h-3 bg-pink-100 border border-pink-400 rounded-sm mr-2"></div> Ghế đôi
            </Button>
          </div>

          <div className="w-px h-6 bg-gray-300 mx-2"></div>

          <Button
            variant="ghost"
            size="sm"
            className="text-red-600 hover:bg-red-50 hover:text-red-700 hover:shadow-sm transition-all"
            onClick={toggleSeatStatus} disabled={selectedSeats.length === 0}
          >
            {selectedSeats.some(s => !s.isAvailable) ? 'Mở khóa ghế' : 'Bảo trì ghế'}
          </Button>
        </div>

        <div className="flex justify-center mb-12">
          <div className="w-3/4 max-w-3xl relative group">
            <div className="absolute -inset-4 bg-blue-500/10 blur-2xl rounded-[50%] opacity-0 group-hover:opacity-100 transition-opacity duration-700"></div>
            <div className="h-2 w-full bg-gradient-to-r from-blue-200 via-blue-400 to-blue-200 rounded-t-[50%] rounded-b-[20%] shadow-[0_15px_30px_-5px_rgba(59,130,246,0.3)]"></div>
            <p className="text-center text-[10px] text-blue-300 font-bold uppercase tracking-[0.5em] mt-4 select-none">Màn Hình Chiếu</p>
          </div>
        </div>

        <div className="flex justify-center overflow-x-auto pb-8 custom-scrollbar">
          <div className="grid gap-y-3 min-w-max mx-auto px-8 py-4 bg-white rounded-3xl border border-gray-100 shadow-inner">
            {rows.map(rowLabel => {
              const rawSeats = seats.filter(s => s.row === rowLabel).sort((a, b) => a.column - b.column)
              
              const mergedSeats: MergedSeatRender[] = []
              for (let i = 0; i < rawSeats.length; i++) {
                const currentSeat = rawSeats[i]
                const nextSeat = rawSeats[i + 1]

                if (currentSeat.seatType === 'Ghế đôi' && nextSeat && nextSeat.seatType === 'Ghế đôi') {
                  mergedSeats.push({
                    mainSeat: currentSeat,
                    pairedSeat: nextSeat,
                    isPair: true,
                    displayNumber: `${currentSeat.column}-${nextSeat.column}`
                  })
                  i++ 
                } else {
                  mergedSeats.push({
                    mainSeat: currentSeat,
                    pairedSeat: null,
                    isPair: false,
                    displayNumber: currentSeat.column.toString()
                  })
                }
              }

              return (
                <div key={rowLabel} className="flex items-center group/row">
                  <div
                    className="w-8 h-8 flex items-center justify-center text-sm font-bold text-gray-400 cursor-pointer hover:text-white hover:bg-blue-500 rounded-full transition-all duration-200 shadow-sm border border-transparent hover:border-blue-400 hover:shadow-blue-200 mr-6"
                    onClick={() => handleSelectRow(rowLabel)}
                    title={`Chọn cả hàng ${rowLabel}`}
                  >
                    {rowLabel}
                  </div>

                  <div className="grid grid-cols-10 gap-x-2.5">
                    {mergedSeats.map(mergedItem => {
                      const { mainSeat, pairedSeat, isPair, displayNumber } = mergedItem
                      
                      const isSelected = selectedSeats.some(s => s.seatNumber === mainSeat.seatNumber) || 
                                       (pairedSeat ? selectedSeats.some(s => s.seatNumber === pairedSeat.seatNumber) : false)

                      const isAvailable = mainSeat.isAvailable && (pairedSeat ? pairedSeat.isAvailable : true)

                      return (
                        <div
                          key={mainSeat.seatNumber}
                          onClick={() => handleSeatClick(mergedItem)}
                          className={cn(
                            'flex items-center justify-center rounded-lg border text-xs font-bold cursor-pointer transition-all duration-200 select-none shadow-sm h-10',
                            isPair ? 'w-full col-span-2' : 'w-10',
                            getSeatStyle(mainSeat.seatType, isAvailable, isSelected)
                          )}
                        >
                          {isPair ? (
                            <span className="text-[11px] tracking-widest">{mainSeat.row}{displayNumber}</span>
                          ) : (
                            displayNumber
                          )}
                        </div>
                      )
                    })}
                  </div>
                </div>
              )
            })}
          </div>
        </div>

        <div className="flex flex-wrap justify-center gap-x-8 gap-y-3 pt-8 border-t border-dashed mt-4 text-sm text-gray-600">
          <div className="flex items-center gap-2"><div className="w-5 h-5 rounded border border-gray-300 bg-white shadow-sm"></div> <span className="text-xs font-medium">Thường</span></div>
          <div className="flex items-center gap-2"><div className="w-5 h-5 rounded border border-orange-300 bg-orange-100 shadow-sm"></div> <span className="text-xs font-medium">VIP</span></div>
          <div className="flex items-center gap-2"><div className="w-10 h-5 rounded border border-pink-300 bg-pink-100 shadow-sm"></div> <span className="text-xs font-medium">Ghế đôi</span></div>
          <div className="flex items-center gap-2"><div className="w-5 h-5 rounded border border-gray-300 bg-gray-200 opacity-60"></div> <span className="text-xs font-medium">Bảo trì</span></div>
          <div className="flex items-center gap-2"><div className="w-5 h-5 rounded border-2 border-slate-500 bg-slate-600 shadow-md"></div> <span className="text-xs font-medium">Đang chọn (Màu đậm)</span></div>
        </div>
      </CardContent>
    </Card>
  )
}
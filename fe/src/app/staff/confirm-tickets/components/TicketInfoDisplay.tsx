import { Card } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Film, QrCode, Clock, MapPin, Armchair, CheckCircle2, XCircle, Coffee } from 'lucide-react'
import type { TicketVerify } from '@/types/booking'

interface TicketInfoDisplayProps {
  ticket: TicketVerify | null
  onConfirm: () => void
  isConfirming?: boolean
}

export function TicketInfoDisplay({ ticket, onConfirm, isConfirming }: TicketInfoDisplayProps) {
  console.log('Rendering TicketInfoDisplay with ticket:', ticket)
  return (
    <Card className="p-6 border border-border rounded-[10px] shadow-sm hover:shadow-md transition-shadow">
      {/* Header */}
      <div className="flex items-center gap-3 mb-6">
        <div className="w-10 h-10 bg-primary/10 rounded-[10px] flex items-center justify-center">
          <Film className="w-5 h-5 text-primary" />
        </div>
        <div>
          <h3 className="text-foreground">Thông tin vé</h3>
          <p className="text-sm text-muted-foreground">Chi tiết vé điện tử</p>
        </div>
      </div>

      {/* Empty State */}
      {!ticket ? (
        <div className="py-12 text-center">
          <QrCode className="w-16 h-16 text-muted mx-auto mb-4" />
          <p className="text-muted-foreground">Chưa có thông tin vé</p>
          <p className="text-sm text-muted-foreground/70 mt-1">
            Vui lòng quét mã QR hoặc nhập mã vé
          </p>
        </div>
      ) : (
        <div className="space-y-4">
          {/* Ticket Status */}
          <TicketStatusBadge status={ticket.validation.isUsed} />

          {/* Ticket Details */}
          <TicketDetails ticket={ticket} />

          {/* Customer Info */}
          <CustomerInfo ticket={ticket} />

          {/* Confirm Button */}
          {ticket.booking.status === 'Hoàn tất' && (
            <Button
              onClick={onConfirm}
              disabled={isConfirming}
              className="w-full bg-chart-3 hover:bg-chart-3/90 text-white rounded-[10px] shadow-md"
            >
              <CheckCircle2 className="w-4 h-4 mr-2" />
              {isConfirming ? 'Đang xác nhận...' : 'Xác nhận vào rạp'}
            </Button>
          )}
        </div>
      )}
    </Card>
  )
}

// Sub-components
function TicketStatusBadge({ status }: { status: boolean }) {
  const isValid = !status

  return (
    <div
      className={`p-4 rounded-[10px] flex items-center gap-3 ${
        isValid
          ? 'bg-chart-3/10 border border-chart-3/20'
          : 'bg-destructive/10 border border-destructive/20'
      }`}
    >
      {isValid ? (
        <>
          <CheckCircle2 className="w-6 h-6 text-chart-3" />
          <div>
            <p className="text-foreground font-semibold">Vé hợp lệ</p>
            <p className="text-sm text-muted-foreground">Có thể vào rạp</p>
          </div>
        </>
      ) : (
        <>
          <XCircle className="w-6 h-6 text-destructive" />
          <div>
            <p className="text-foreground font-semibold">Vé không hợp lệ</p>
            <p className="text-sm text-muted-foreground">Hết hạn hoặc đã sử dụng</p>
          </div>
        </>
      )}
    </div>
  )
}

function TicketDetails({ ticket }: { ticket: TicketVerify }) {
  return (
    <div className="space-y-3 p-4 bg-secondary rounded-[10px]">
      <DetailRow
        icon={<Film className="w-5 h-5 text-muted-foreground mt-0.5" />}
        label="Tên phim"
        value={ticket.booking.movieTitle}
      />

      <DetailRow
        icon={<Clock className="w-5 h-5 text-muted-foreground mt-0.5" />}
        label="Thời gian chiếu"
        value={`${ticket.booking.showDate ? new Date(ticket.booking.showDate).toLocaleDateString('vi-VN') : 'Đang cập nhật'} - ${ticket.booking.showTime || ''}`}
      />

      <DetailRow
        icon={<MapPin className="w-5 h-5 text-muted-foreground mt-0.5" />}
        label="Phòng chiếu"
        value={ticket.booking.roomName}
      />

      <div className="flex items-start gap-3">
        <Armchair className="w-5 h-5 text-muted-foreground mt-0.5" />
        <div className="flex-1">
          <p className="text-sm text-muted-foreground">Ghế ngồi</p>
          <div className="flex gap-2 mt-1 flex-wrap">
            {ticket.booking.seats.map(ghe => (
              <Badge key={ghe.seatNumber} variant="outline" className="rounded-[6px]">
                {ghe.seatNumber}
              </Badge>
            ))}
          </div>
        </div>
      </div>

      {ticket.booking.products && ticket.booking.products.length > 0 && (
        <div className="flex items-start gap-3 mt-3 pt-3 border-t border-border">
          <Coffee className="w-5 h-5 text-muted-foreground mt-0.5" />
          <div className="flex-1">
            <p className="text-sm text-muted-foreground">Bắp nước / Combo</p>
            <div className="mt-1 space-y-1">
              {ticket.booking.products.map((item: any, index: number) => {
                const itemName = item.name 
                              || item.productName 
                              || item.product?.name 
                              || item.combo?.name 
                              || item.item?.name
                              || 'Sản phẩm'; 

                return (
                  <p key={index} className="text-sm text-foreground font-medium">
                    {item.quantity}x {itemName}
                  </p>
                )
              })}
            </div>
          </div>
        </div>
      )}
    </div>
  )
}

function DetailRow({
  icon,
  label,
  value,
}: {
  icon: React.ReactNode
  label: string
  value: string
}) {
  return (
    <div className="flex items-start gap-3">
      {icon}
      <div className="flex-1">
        <p className="text-sm text-muted-foreground">{label}</p>
        <p className="text-foreground font-medium">{value}</p>
      </div>
    </div>
  )
}

function CustomerInfo({ ticket }: { ticket: TicketVerify }) {
  return (
    <div className="p-4 bg-primary/5 rounded-[10px] border border-primary/20">
      <p className="text-sm text-muted-foreground mb-1">Tên khách hàng</p>
      <p className="text-foreground font-semibold">{ticket.booking.customer.name}</p>
      <div className="flex justify-between mt-3 pt-3 border-t border-primary/20">
        <span className="text-sm text-muted-foreground">Mã vé:</span>
        <span className="text-foreground font-medium">{ticket.booking.bookingCode}</span>
      </div>
    </div>
  )
}

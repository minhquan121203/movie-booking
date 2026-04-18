import { Film } from 'lucide-react'

type SelectedCinemaHeaderProps = {
  cinemaName: string
  address: string // Bạn có thể tách cái này ra thêm nếu cần
}

export default function SelectedCinemaHeader({ cinemaName, address }: SelectedCinemaHeaderProps) {
  return (
    <div className="bg-surface border border-border p-3 sm:p-4 rounded-xl">
      <div className="flex items-start gap-2 sm:gap-3">
        <Film className="w-5 sm:w-6 h-5 sm:h-6 text-primary flex-shrink-0 mt-0.5" />
        <div className="flex-1 min-w-0">
          <h3 className="text-text-primary text-sm sm:text-base mb-1" style={{ fontWeight: 600 }}>
            {cinemaName}
          </h3>
          <p className="text-text-secondary text-xs sm:text-sm break-words">{address}</p>
        </div>
      </div>
    </div>
  )
}

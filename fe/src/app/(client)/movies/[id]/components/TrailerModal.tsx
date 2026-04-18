import { Button } from '@/components/ui/button'
interface TrailerModalProps {
  setShowTrailer: (show: boolean) => void
  showTrailer: boolean
  src: string
}

export function TrailerModal({ setShowTrailer, showTrailer, src }: TrailerModalProps) {
  return (
    <>
      <button onClick={() => setShowTrailer(!showTrailer)} className="text-primary underline">
        Xem trailer
      </button>
      {showTrailer && (
        <div className="fixed inset-0 bg-black/80 flex items-center justify-center z-50 p-4">
          <div className="bg-surface rounded-xl overflow-hidden w-full max-w-3xl shadow-lg animate-fadeIn">
            <iframe src={src} title="Trailer" className="w-full aspect-video" allowFullScreen />
            <div className="p-3 flex justify-end border-t border-border bg-secondary">
              <Button variant="outline" className="text-sm" onClick={() => setShowTrailer(false)}>
                Đóng
              </Button>
            </div>
          </div>
        </div>
      )}
    </>
  )
}

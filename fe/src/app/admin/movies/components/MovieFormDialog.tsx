import { useEffect, useState, useRef } from 'react'
import { useForm } from 'react-hook-form'
import { ImageIcon } from 'lucide-react'
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { Movie, MovieCreateDTO } from '@/types/movie'
import { useMovieMutations } from '../hooks/useMovieMutations'
import { Upload, X } from 'lucide-react'
import { ImageWithFallback } from '@/app/components/figma/ImageWithFallback'
import { useGenres } from '@/lib/api/genres'

// Mở rộng Type Form để bao gồm các trường mới (nếu DTO chưa cập nhật)
interface MovieFormValues extends MovieCreateDTO {
  director: string
  actors: string[]
  genres: string[] // Array of Genre IDs
  language: string
  subtitles: string[]
}

interface MovieFormDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  movieToEdit?: Movie | null
}

export function MovieFormDialog({ open, onOpenChange, movieToEdit }: MovieFormDialogProps) {
  const { createMutation, updateMutation, uploadPosterMutation } = useMovieMutations()
  // Lấy danh sách Genres để hiển thị
  const { data: genreData } = useGenres({ limit: 100, isActive: true })

  const isEditMode = !!movieToEdit

  const { register, handleSubmit, reset, setValue, watch, getValues } = useForm<MovieFormValues>({
    defaultValues: {
      title: '',
      duration: 0,
      status: 'Sắp chiếu',
      rating: 'P',
      description: '',
      director: '',
      actors: [],
      genres: [],
      language: '',
      subtitles: [],
    },
  })

  // State cho upload ảnh
  const [selectedFile, setSelectedFile] = useState<File | null>(null)
  const [previewUrl, setPreviewUrl] = useState<string>('')
  const fileInputRef = useRef<HTMLInputElement>(null)

  // Watch values để render UI
  const posterUrl = watch('posterUrl')
  const watchedActors = watch('actors')
  const watchedSubtitles = watch('subtitles')
  const watchedGenres = watch('genres')

  useEffect(() => {
    if (movieToEdit) {
      reset({
        ...movieToEdit,
        releaseDate: movieToEdit.releaseDate
          ? new Date(movieToEdit.releaseDate).toISOString().split('T')[0]
          : '',
        actors: movieToEdit.actors || [],

        // --- SỬA Ở ĐÂY ---
        // Kiểm tra từng item trong mảng genres:
        // Nếu là Object thì lấy ._id, nếu là String thì giữ nguyên
        genres: movieToEdit.genres
          ? movieToEdit.genres.map((g: any) => (typeof g === 'object' && g?._id ? g._id : g))
          : [],
        // ----------------

        subtitles: movieToEdit.subtitles || [],
        director: movieToEdit.director || '',
        language: movieToEdit.language || '',
      } as any)

      setPreviewUrl(movieToEdit.posterUrl || '')
      setSelectedFile(null)
    } else {
      reset({
        title: '',
        duration: 0,
        status: 'Sắp chiếu',
        rating: 'P',
        description: '',
        director: '',
        actors: [],
        genres: [],
        language: '',
        subtitles: [],
      })
      setPreviewUrl('')
      setSelectedFile(null)
    }
  }, [movieToEdit, open, reset])

  // --- Helpers xử lý Array Input (Actors, Subtitles) ---
  const handleAddArrayItem = (
    e: React.KeyboardEvent<HTMLInputElement>,
    field: 'actors' | 'subtitles'
  ) => {
    if (e.key === 'Enter') {
      e.preventDefault()
      const val = e.currentTarget.value.trim()
      if (val) {
        const current = getValues(field) || []
        if (!current.includes(val)) {
          setValue(field, [...current, val])
        }
        e.currentTarget.value = ''
      }
    }
  }

  const handleRemoveArrayItem = (field: 'actors' | 'subtitles', index: number) => {
    const current = getValues(field) || []
    setValue(
      field,
      current.filter((_, i) => i !== index)
    )
  }

  // --- Helper xử lý Genres (Checkbox logic) ---
  const toggleGenre = (genreId: string) => {
    const current = getValues('genres') || []
    console.log('Toggling genre:', genreId, 'Current:', current)
    if (current.includes(genreId)) {
      setValue(
        'genres',
        current.filter(id => id !== genreId)
      )
    } else {
      setValue('genres', [...current, genreId])
    }
  }

  // --- File Handling (Giữ nguyên logic cũ) ---
  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (file) {
      if (!file.type.startsWith('image/')) return alert('Vui lòng chọn file ảnh!')
      if (file.size > 5 * 1024 * 1024) return alert('Kích thước file quá 5MB!')
      setSelectedFile(file)
      const reader = new FileReader()
      reader.onloadend = () => setPreviewUrl(reader.result as string)
      reader.readAsDataURL(file)
    }
  }

  const uploadPosterIfNeeded = async (movieId: string) => {
    if (selectedFile) {
      try {
        const result = await uploadPosterMutation.mutateAsync({ movieId, file: selectedFile })
        if (result?.data?.url) setValue('posterUrl', result.data.url)
      } catch (error) {
        console.error('Upload poster error:', error)
      }
    }
  }

  const onSubmit = async (data: MovieFormValues) => {
    try {
      // Ép kiểu về DTO chuẩn nếu cần thiết trước khi gửi
      const submitData = { ...data } as MovieCreateDTO

      if (isEditMode && movieToEdit) {
        const res = await updateMutation.mutateAsync({ id: movieToEdit._id, data: submitData })
        await uploadPosterIfNeeded(movieToEdit._id)
        if (res.success) {
          onOpenChange(false)
        }
      } else {
        const result = await createMutation.mutateAsync(submitData)
        if (result?.data?._id) {
          await uploadPosterIfNeeded(result.data._id)
        }
        onOpenChange(false)
      }
    } catch (error) {
      console.error('Submit error:', error)
    }
  }

  const isLoading =
    createMutation.isPending || updateMutation.isPending || uploadPosterMutation.isPending

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="w-fit! max-w-[95vw]! overflow-y-auto! bg-white! text-gray-900!">
        <DialogHeader>
          <DialogTitle>{isEditMode ? 'Cập nhật phim' : 'Thêm phim mới'}</DialogTitle>
        </DialogHeader>

        <form onSubmit={handleSubmit(onSubmit)} className="space-y-6 py-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {/* CỘT TRÁI: Thông tin cơ bản */}
            <div className="space-y-4">
              <div>
                <Label>
                  Tên phim <span className="text-red-500">*</span>
                </Label>
                <Input {...register('title', { required: true })} placeholder="Nhập tên phim..." />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label>Đạo diễn</Label>
                  <Input {...register('director')} placeholder="Ví dụ: Christopher Nolan" />
                </div>
                <div>
                  <Label>Ngôn ngữ gốc</Label>
                  <Input {...register('language')} placeholder="Ví dụ: English" />
                </div>
              </div>

              {/* Actors Input (Tags) */}
              <div>
                <Label>Diễn viên (Nhấn Enter để thêm)</Label>
                <Input
                  placeholder="Nhập tên diễn viên..."
                  onKeyDown={e => handleAddArrayItem(e, 'actors')}
                />
                <div className="flex flex-wrap gap-2 mt-2">
                  {watchedActors?.map((actor, idx) => (
                    <div
                      key={idx}
                      className="bg-slate-100 border px-2 py-1 rounded-md text-sm flex items-center gap-1"
                    >
                      {actor}
                      <button
                        type="button"
                        onClick={() => handleRemoveArrayItem('actors', idx)}
                        className="text-gray-500 hover:text-red-500"
                      >
                        <X size={14} />
                      </button>
                    </div>
                  ))}
                </div>
              </div>

              {/* Subtitles Input (Tags) */}
              <div>
                <Label>Phụ đề (Nhấn Enter để thêm)</Label>
                <Input
                  placeholder="Nhập ngôn ngữ phụ đề..."
                  onKeyDown={e => handleAddArrayItem(e, 'subtitles')}
                />
                <div className="flex flex-wrap gap-2 mt-2">
                  {watchedSubtitles?.map((sub, idx) => (
                    <div
                      key={idx}
                      className="bg-slate-100 border px-2 py-1 rounded-md text-sm flex items-center gap-1"
                    >
                      {sub}
                      <button
                        type="button"
                        onClick={() => handleRemoveArrayItem('subtitles', idx)}
                        className="text-gray-500 hover:text-red-500"
                      >
                        <X size={14} />
                      </button>
                    </div>
                  ))}
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label>Thời lượng (phút)</Label>
                  <Input type="number" {...register('duration', { valueAsNumber: true })} />
                </div>
                <div>
                  <Label>Ngày phát hành</Label>
                  <Input type="date" {...register('releaseDate')} />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label>Trạng thái</Label>
                  <Select
                    onValueChange={(val: any) => setValue('status', val)}
                    value={watch('status')}
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="Sắp chiếu">Sắp chiếu</SelectItem>
                      <SelectItem value="Đang chiếu">Đang chiếu</SelectItem>
                      <SelectItem value="Ngừng chiếu">Ngừng chiếu</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div>
                  <Label>Rating</Label>
                  <Select
                    onValueChange={(val: any) => setValue('rating', val)}
                    value={watch('rating')}
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="P">P - Mọi lứa tuổi</SelectItem>
                      <SelectItem value="C13">C13 - 13+</SelectItem>
                      <SelectItem value="C16">C16 - 16+</SelectItem>
                      <SelectItem value="C18">C18 - 18+</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>
            </div>

            {/* CỘT PHẢI: Genres, Ảnh, Trailer, Mô tả */}
            <div className="space-y-4">
              {/* Genres Selection */}
              <div>
                <Label className="mb-2 block">Thể loại</Label>
                <div className="border rounded-md p-3 h-40 overflow-y-auto grid grid-cols-2 gap-2 bg-gray-50/50">
                  {genreData?.items?.map(genre => {
                    const isSelected = watchedGenres?.includes(genre._id)
                    return (
                      <div
                        key={genre._id}
                        onClick={() => toggleGenre(genre._id)}
                        className={`
                          cursor-pointer flex items-center gap-2 p-2 rounded border transition-all text-sm
                          ${isSelected ? 'bg-blue-50 border-blue-200 text-blue-700' : 'bg-white border-gray-100 hover:border-gray-300'}
                        `}
                      >
                        <div
                          className={`w-4 h-4 rounded border flex items-center justify-center ${isSelected ? 'bg-blue-500 border-blue-500' : 'border-gray-300'}`}
                        >
                          {isSelected && <span className="text-white text-[10px]">✓</span>}
                        </div>
                        <span className="truncate">{genre.name}</span>
                      </div>
                    )
                  })}
                  {!genreData?.items?.length && (
                    <p className="text-sm text-gray-400 col-span-2 text-center py-4">
                      Chưa có thể loại nào
                    </p>
                  )}
                </div>
              </div>

              {/* Upload Poster */}
              <div className="space-y-2">
                <Label>Poster phim</Label>
                <div className="flex gap-4 items-start">
                  <div className="relative w-32 h-44 shrink-0 bg-gray-100 rounded-lg overflow-hidden border">
                    {previewUrl ? (
                      <ImageWithFallback
                        src={previewUrl}
                        alt="Preview"
                        className="w-full h-full object-cover"
                      />
                    ) : (
                      <div className="flex items-center justify-center w-full h-full text-gray-400">
                        <ImageIcon size={24} />
                      </div>
                    )}
                  </div>

                  <div className="flex-1 space-y-3">
                    <div className="flex flex-col gap-2">
                      <input
                        ref={fileInputRef}
                        type="file"
                        accept="image/*"
                        onChange={handleFileSelect}
                        className="hidden"
                      />
                      <Button
                        type="button"
                        variant="outline"
                        size="sm"
                        onClick={() => fileInputRef.current?.click()}
                        className="w-full"
                      >
                        <Upload size={14} className="mr-2" /> Chọn ảnh
                      </Button>
                      {selectedFile && (
                        <Button
                          type="button"
                          variant="ghost"
                          size="sm"
                          onClick={() => {
                            setSelectedFile(null)
                            setPreviewUrl(posterUrl || '')
                          }}
                          className="text-red-500 hover:text-red-600 h-8"
                        >
                          Hủy chọn
                        </Button>
                      )}
                    </div>

                    <div className="space-y-1">
                      <Label className="text-xs text-gray-500">Hoặc URL ảnh</Label>
                      <Input
                        {...register('posterUrl')}
                        placeholder="https://..."
                        className="h-8 text-sm"
                        onChange={e => {
                          setValue('posterUrl', e.target.value)
                          if (!selectedFile) setPreviewUrl(e.target.value)
                        }}
                      />
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
          <div className="mt-6 space-y-5 border-t pt-5">
            <div>
              <Label className="mb-1.5 block">Trailer URL</Label>
              <Input
                {...register('trailerUrl')}
                placeholder="Link trailer Youtube..."
                className="w-full"
              />
            </div>

            <div>
              <Label className="mb-1.5 block">Mô tả</Label>
              <Textarea
                {...register('description')}
                placeholder="Tóm tắt nội dung phim..."
                className="h-24 resize-none w-full"
              />
            </div>
          </div>
          <div className="flex justify-end gap-3 pt-4 border-t mt-4">
            <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>
              Hủy
            </Button>
            <Button type="submit" disabled={isLoading}>
              {isLoading ? 'Đang xử lý...' : isEditMode ? 'Cập nhật' : 'Thêm mới'}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  )
}

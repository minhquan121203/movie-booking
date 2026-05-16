'use client'

import Link from 'next/link'
import { motion } from 'framer-motion'
import type { Genre } from '@/types/genre'

interface GenresProps {
  genres: Genre[]
  isLoading?: boolean
}

// Default genre icons when API doesn't provide them
const genreIconMap: Record<string, string> = {
  'kinh dị': '👻',
  'hành động': '💥',
  'hài': '😂',
  'tâm lý': '🧠',
  'gia đình': '👨‍👩‍👧‍👦',
  'phiêu lưu': '🗺️',
  'khoa học viễn tưởng': '🚀',
  'tình cảm': '💕',
  'lãng mạn': '💕',
  'hoạt hình': '🎨',
  'tài liệu': '📽️',
  'âm nhạc': '🎵',
  'hình sự': '🔍',
  'chiến tranh': '⚔️',
  'thể thao': '⚽',
  'lịch sử': '📜',
  'bí ẩn': '🔮',
  'chính kịch': '🎭',
  'gây cấn': '😱',
  'viễn tưởng': '🌌',
  'phim gia đình': '🏠',
  'phim hài': '🤣',
}

const genreColorMap: Record<string, string> = {
  'kinh dị': 'from-red-500/20 to-red-900/10',
  'hành động': 'from-orange-500/20 to-orange-900/10',
  'hài': 'from-yellow-500/20 to-yellow-900/10',
  'tâm lý': 'from-purple-500/20 to-purple-900/10',
  'gia đình': 'from-green-500/20 to-green-900/10',
  'phiêu lưu': 'from-cyan-500/20 to-cyan-900/10',
  'khoa học viễn tưởng': 'from-blue-500/20 to-blue-900/10',
  'tình cảm': 'from-pink-500/20 to-pink-900/10',
  'lãng mạn': 'from-pink-500/20 to-pink-900/10',
  'hoạt hình': 'from-amber-500/20 to-amber-900/10',
  'tài liệu': 'from-slate-500/20 to-slate-900/10',
  'âm nhạc': 'from-violet-500/20 to-violet-900/10',
  'hình sự': 'from-zinc-500/20 to-zinc-900/10',
  'chính kịch': 'from-indigo-500/20 to-indigo-900/10',
  'gây cấn': 'from-rose-500/20 to-rose-900/10',
}

function getGenreIcon(genre: Genre): string {
  if (genre.icon) return genre.icon
  const key = genre.name.toLowerCase()
  return genreIconMap[key] || '🎬'
}

function getGenreGradient(genre: Genre): string {
  const key = genre.name.toLowerCase()
  return genreColorMap[key] || 'from-violet-500/20 to-violet-900/10'
}

// Skeleton for individual genre card
function GenreCardSkeleton() {
  return (
    <div className="relative flex items-center justify-center gap-3 h-28 md:h-32 rounded-2xl border border-border bg-bg-primary overflow-hidden">
      <div className="absolute inset-0 bg-gradient-to-br from-muted/30 to-muted/10 animate-pulse" />
      <div className="relative w-10 h-10 md:w-12 md:h-12 bg-muted/40 rounded-full animate-pulse" />
      <div className="relative h-5 bg-muted/40 rounded w-20 md:w-24 animate-pulse" />
    </div>
  )
}

// Skeleton for entire genre grid
function GenreGridSkeleton() {
  return (
    <div className="py-12">
      <div className="container">
        <div className="mb-8">
          <div className="h-7 bg-muted/30 rounded w-64 animate-pulse" />
        </div>
        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-4">
          {[...Array(6)].map((_, index) => (
            <GenreCardSkeleton key={index} />
          ))}
        </div>
      </div>
    </div>
  )
}

export function GenreGrid({ genres, isLoading = false }: GenresProps) {
  if (isLoading) {
    return <GenreGridSkeleton />
  }

  if (genres.length === 0) {
    return (
      <div className="py-12">
        <div className="container">
          <h2 className="mb-8 text-start font-semibold text-foreground">Khám phá theo thể loại</h2>
          <div className="text-center py-16 bg-muted/10 rounded-2xl border-2 border-dashed border-muted">
            <p className="text-muted-foreground">Không có thể loại nào để hiển thị.</p>
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="py-12">
      <div className="container">
        <h2 className="mb-8 text-start font-semibold text-foreground">Khám phá theo thể loại</h2>

        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-5 xl:grid-cols-6 gap-3 md:gap-4">
          {genres.map((genre, index) => (
            <motion.div
              key={genre._id || genre.name}
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              transition={{ delay: index * 0.05, duration: 0.3 }}
              viewport={{ once: true }}
            >
              <Link
                href={`/movies?genre=${encodeURIComponent(genre.name)}`}
                className="group block"
              >
                <div
                  className={`
                    relative flex flex-col items-center justify-center gap-2
                    h-24 md:h-28 rounded-2xl border border-border/50
                    bg-bg-primary overflow-hidden
                    transition-all duration-300
                    hover:border-violet-500/40 hover:shadow-lg hover:shadow-violet-500/5
                    hover:-translate-y-1
                  `}
                >
                  {/* Gradient bg on hover */}
                  <div className={`absolute inset-0 bg-gradient-to-br ${getGenreGradient(genre)} opacity-0 group-hover:opacity-100 transition-opacity duration-300`} />

                  {/* Icon */}
                  <span className="relative text-2xl md:text-3xl transition-transform duration-300 group-hover:scale-125">
                    {getGenreIcon(genre)}
                  </span>

                  {/* Label */}
                  <span className="relative text-xs md:text-sm font-semibold text-foreground/80 group-hover:text-foreground transition-colors duration-300">
                    {genre.name}
                  </span>
                </div>
              </Link>
            </motion.div>
          ))}
        </div>
      </div>
    </div>
  )
}

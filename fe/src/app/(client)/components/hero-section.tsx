'use client'

import { useState, useEffect } from 'react'
import { Button } from '@/components/ui/button'
import { Play, ChevronLeft, ChevronRight, Star } from 'lucide-react'
import Link from 'next/link'
import { motion, AnimatePresence } from 'framer-motion'
import type { Movie } from '@/types/movie'
import Image from 'next/image'

interface MovieSectionProps {
  movies: Movie[]
  isLoading?: boolean
}

// Skeleton Component
function HeroSkeleton() {
  return (
    <section className="relative h-[70vh] md:h-[80vh] overflow-hidden">
      <div className="absolute inset-0">
        {/* Background skeleton */}
        <div className="absolute inset-0 bg-linear-to-br from-gray-800 to-gray-900 animate-pulse" />

        {/* Overlay gradients */}
        <div className="absolute inset-0 bg-linear-to-r from-background via-background/85 to-transparent" />
        <div className="absolute inset-0 bg-linear-to-t from-background/60 via-transparent to-transparent" />
      </div>

      {/* Content skeleton */}
      <div className="relative flex h-full items-center">
        <div className="px-[25px] md:px-[60px] xl:px-[86px] max-w-[680px] space-y-6">
          {/* Title skeleton */}
          <div className="space-y-3">
            <div className="h-12 md:h-16 bg-muted/30 rounded-lg w-3/4 animate-pulse" />
            <div className="h-12 md:h-16 bg-muted/30 rounded-lg w-1/2 animate-pulse" />
          </div>

          {/* Metadata skeleton */}
          <div className="flex flex-wrap items-center gap-3">
            <div className="h-5 bg-muted/30 rounded w-32 animate-pulse" />
            <div className="h-5 w-5 bg-muted/30 rounded-full animate-pulse" />
            <div className="h-5 bg-muted/30 rounded w-24 animate-pulse" />
            <div className="h-5 w-5 bg-muted/30 rounded-full animate-pulse" />
            <div className="h-5 bg-muted/30 rounded w-20 animate-pulse" />
          </div>

          {/* Description skeleton */}
          <div className="space-y-2">
            <div className="h-5 bg-muted/30 rounded w-full animate-pulse" />
            <div className="h-5 bg-muted/30 rounded w-full animate-pulse" />
            <div className="h-5 bg-muted/30 rounded w-3/4 animate-pulse" />
          </div>

          {/* Buttons skeleton */}
          <div className="flex flex-wrap gap-3">
            <div className="h-12 bg-muted/30 rounded-xl w-32 animate-pulse" />
            <div className="h-12 bg-muted/30 rounded-xl w-40 animate-pulse" />
          </div>
        </div>
      </div>

      {/* Navigation buttons skeleton */}
      <div className="absolute bottom-8 right-8 flex gap-2">
        <div className="h-10 w-10 bg-muted/30 rounded-md animate-pulse" />
        <div className="h-10 w-10 bg-muted/30 rounded-md animate-pulse" />
      </div>

      {/* Indicators skeleton */}
      <div className="absolute bottom-8 left-1/2 -translate-x-1/2 flex gap-2">
        {[...Array(3)].map((_, index) => (
          <div key={index} className="h-1 w-4 bg-muted/30 rounded-full animate-pulse" />
        ))}
      </div>
    </section>
  )
}

export function HeroSection({ movies, isLoading = false }: MovieSectionProps) {
  const [currentIndex, setCurrentIndex] = useState(0)

  useEffect(() => {
    if (movies.length === 0) return

    const timer = setInterval(() => {
      setCurrentIndex(prev => (prev + 1) % movies.length)
    }, 5000)
    return () => clearInterval(timer)
  }, [movies.length])

  // Show skeleton while loading
  if (isLoading || movies.length === 0) {
    return <HeroSkeleton />
  }

  const currentMovie = movies[currentIndex]

  return (
    <section className="relative h-[70vh] md:h-[80vh] overflow-hidden">
      <AnimatePresence mode="wait">
        <motion.div
          key={currentIndex}
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          transition={{ duration: 0.5 }}
          className="absolute inset-0"
        >
          {/* Background */}
          <div className="absolute inset-0 overflow-hidden"> 
            {/* Next.js Image as background */}
            <Image
              src={currentMovie.posterUrl || '/placeholder-poster.jpg'}
              alt={currentMovie.title || 'Movie poster'}
              fill
              className="object-fill" 
              priority
              quality={100}
              sizes="100vw"
            />

            {/* Overlay gradients giữ nguyên */}
            <div className="absolute inset-0 bg-linear-to-r from-background via-background/85 to-transparent" />
            <div className="absolute inset-0 bg-linear-to-t from-background/60 via-transparent to-transparent" />
          </div>

          {/* Content */}
          <div className="relative flex h-full items-center">
            <div className="px-[25px] md:px-[60px] xl:px-[86px] max-w-[680px] space-y-6">
              {/* Title */}
              <motion.h1
                initial={{ y: 20, opacity: 0 }}
                animate={{ y: 0, opacity: 1 }}
                transition={{ delay: 0.2 }}
                className="text-4xl md:text-6xl font-bold leading-tight text-foreground"
              >
                {currentMovie.title}
              </motion.h1>

              {/* Metadata */}
              <motion.div
                initial={{ y: 20, opacity: 0 }}
                animate={{ y: 0, opacity: 1 }}
                transition={{ delay: 0.3 }}
                className="flex flex-wrap items-center gap-3 text-sm text-muted-foreground"
              >
                <span className="uppercase tracking-wide font-semibold">
                  Đạo diễn:&nbsp;
                  <span className="text-foreground">{currentMovie.director}</span>
                </span>
                <span className="text-muted-foreground">•</span>
                <span className="uppercase">Thời lượng</span>
                <span className="text-foreground">{currentMovie.duration} phút</span>
                <span className="text-muted-foreground">•</span>
                <span className="uppercase">Đánh giá</span>
                <span className="flex items-center gap-1 text-[hsl(var(--accent))] font-semibold">
                  <Star className="h-4 w-4 fill-[hsl(var(--accent))]" />
                  {currentMovie.averageRating}/5
                </span>
              </motion.div>

              {/* Description */}
              <motion.p
                initial={{ y: 20, opacity: 0 }}
                animate={{ y: 0, opacity: 1 }}
                transition={{ delay: 0.4 }}
                className="text-base md:text-lg text-muted-foreground leading-relaxed max-w-[600px]"
              >
                {currentMovie.description}
              </motion.p>

              {/* Buttons */}
              <motion.div
                initial={{ y: 20, opacity: 0 }}
                animate={{ y: 0, opacity: 1 }}
                transition={{ delay: 0.5 }}
                className="flex flex-wrap gap-3"
              >
                <Button
                  size="lg"
                  asChild
                  className="bg-primary hover:bg-primary/90 text-white rounded-xl"
                >
                  <Link href={`/movies/${currentMovie._id}`}>
                    <Play className="mr-2 h-5 w-5" />
                    Đặt vé
                  </Link>
                </Button>
                {/* <Button size="lg" variant="outline" asChild className="rounded-xl border-border">
                  <Link href={`/movies/${currentMovie._id}`}>
                    <Info className="mr-2 h-5 w-5" />
                    Xem chi tiết
                  </Link>
                </Button> */}
              </motion.div>
            </div>
          </div>
        </motion.div>
      </AnimatePresence>

      {/* Navigation buttons */}
      <div className="absolute bottom-8 right-8 flex gap-2">
        <Button
          size="icon"
          variant="outline"
          onClick={() => setCurrentIndex(prev => (prev === 0 ? movies.length - 1 : prev - 1))}
          className="backdrop-blur-sm bg-background/80"
        >
          <ChevronLeft className="h-4 w-4" />
        </Button>
        <Button
          size="icon"
          variant="outline"
          onClick={() => setCurrentIndex(prev => (prev + 1) % movies.length)}
          className="backdrop-blur-sm bg-background/80"
        >
          <ChevronRight className="h-4 w-4" />
        </Button>
      </div>

      {/* Indicators */}
      <div className="absolute bottom-8 left-1/2 -translate-x-1/2 flex gap-2">
        {movies.map((_, index) => (
          <button
            key={index}
            onClick={() => setCurrentIndex(index)}
            className={`h-1 rounded-full transition-all ${
              index === currentIndex ? 'w-8 bg-[hsl(var(--primary))]' : 'w-4 bg-muted-foreground/50'
            }`}
            aria-label={`Go to slide ${index + 1}`}
          />
        ))}
      </div>
    </section>
  )
}

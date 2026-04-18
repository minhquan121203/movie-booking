import { create } from 'zustand'
import type { Genre } from '@/types/genre'

interface GenreState {
  genres: Genre[]
  setGenres: (genres: Genre[]) => void
}

export const useGenresStore = create<GenreState>(set => ({
  genres: [],
  setGenres: genres => set({ genres }),
}))

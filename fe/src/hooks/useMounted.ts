import { useEffect, useState } from 'react'

export function useMounted() {
  const [mounted, setMounted] = useState(false)

  useEffect(() => {
    // Delay để tránh cascading renders
    const timer = setTimeout(() => setMounted(true), 0)
    return () => clearTimeout(timer)
  }, [])

  return mounted
}

'use client'

import Link from 'next/link'
import Image from 'next/image'
import { usePathname } from 'next/navigation'
import { useTheme } from 'next-themes'
import { useState, useEffect, useRef, useCallback, memo } from 'react'
import {
  Moon,
  Sun,
  Search,
  User as UserIcon,
  ChevronDown,
  Ticket,
  Settings,
  X,
  Loader2,
  Clock,
  Star,
  Film,
  Menu, 
} from 'lucide-react'

// UI Components
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar'
import { Badge } from '@/components/ui/badge'
import { Skeleton } from '@/components/ui/skeleton'

// Logic & Store
import { useUserStore } from '@/store/userStore'
import { cn } from '@/lib/utils'
import { useDebounce } from '@/hooks/useDebounce'
import { useMounted } from '@/hooks/useMounted'
import { useMovies } from '@/lib/api/movies'
import { LogoutButton } from '@/app/components/shared/LogoutButton'
import type { Genre } from '@/types/genre'

// --- CONSTANTS ---
const NAV_LINKS = [
  { href: '/', label: 'Trang chủ' },
  { label: 'Lịch Chiếu', href: '/showtimes' },
  { href: '/movies', label: 'Phim' },
]

const MainNav = memo(({ className }: { className?: string }) => {
  const pathname = usePathname()

  return (
    <nav className={cn('flex items-center gap-8', className)}>
      {NAV_LINKS.map(link => (
        <Link
          key={link.href}
          href={link.href}
          className={cn(
            'text-sm font-medium transition-colors hover:text-primary',
            pathname === link.href ? 'text-primary' : 'text-muted-foreground'
          )}
        >
          {link.label}
        </Link>
      ))}
    </nav>
  )
})
MainNav.displayName = 'MainNav'

// 2. Search Component
interface SearchBarProps {
  isOpen: boolean
  onToggle: (open: boolean) => void
  className?: string
}

const SearchBar = ({ isOpen, onToggle, className }: SearchBarProps) => {
  const [query, setQuery] = useState('')
  const inputRef = useRef<HTMLInputElement>(null)
  const containerRef = useRef<HTMLDivElement>(null)

  const debouncedSearch = useDebounce(query, 500)

  const { data: movieData, isFetching: isSearching } = useMovies({
    search: debouncedSearch || '',
    limit: 5,
  })

  const movies = movieData?.movies || []

  // Handle click outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (containerRef.current && !containerRef.current.contains(event.target as Node)) {
        if (isOpen) {
          onToggle(false)
          setQuery('')
        }
      }
    }
    document.addEventListener('mousedown', handleClickOutside)
    return () => document.removeEventListener('mousedown', handleClickOutside)
  }, [isOpen, onToggle])

  // Auto focus logic
  useEffect(() => {
    if (isOpen && inputRef.current) {
      inputRef.current.focus()
    }
  }, [isOpen])

  const handleClose = useCallback(() => {
    onToggle(false)
    setQuery('')
  }, [onToggle])

  return (
    <div
      ref={containerRef}
      className={cn(
        'relative transition-all duration-300 ease-in-out',
        isOpen ? 'w-full md:w-[400px]' : 'w-auto',
        className
      )}
    >
      {isOpen ? (
        <div className="relative flex items-center animate-in fade-in zoom-in duration-200 z-50">
          <Search className="absolute left-3 h-4 w-4 text-muted-foreground" />
          <Input
            ref={inputRef}
            placeholder="Tìm tên phim, đạo diễn..."
            value={query}
            onChange={e => setQuery(e.target.value)}
            className="h-10 pl-9 pr-8 rounded-xl bg-background border-primary/50 ring-1 ring-primary/20 focus-visible:ring-primary w-full shadow-sm"
            onKeyDown={e => e.key === 'Escape' && handleClose()}
          />
          <div className="absolute right-2 flex items-center">
            {isSearching ? (
              <Loader2 className="h-4 w-4 animate-spin text-primary" />
            ) : (
              <Button
                variant="ghost"
                size="icon"
                className="h-6 w-6 rounded-full hover:bg-muted"
                onClick={handleClose}
              >
                <X className="h-3 w-3 text-muted-foreground" />
              </Button>
            )}
          </div>

          {query.trim() && (
            <div className="absolute top-full right-0 w-screen md:w-full mt-2 bg-popover border border-border rounded-xl shadow-xl overflow-hidden animate-in fade-in slide-in-from-top-2 z-50 max-w-[100vw] md:max-w-[400px] left-[-2rem] md:left-0">
              {isSearching ? (
                <div className="flex justify-center items-center py-6">
                  <Loader2 className="h-5 w-5 animate-spin text-primary" />
                </div>
              ) : movies.length > 0 ? (
                <div className="max-h-[60vh] overflow-y-auto py-2">
                  <div className="px-3 py-2 text-[10px] font-bold text-muted-foreground uppercase tracking-wider">
                    Phim gợi ý
                  </div>

                  {movies.map(movie => (
                    <Link
                      key={movie._id}
                      href={`/movies/${movie._id}`}
                      onClick={handleClose}
                      className="flex items-start gap-3 px-3 py-2 hover:bg-accent/50 transition-colors group"
                    >
                      <div className="relative w-10 h-14 shrink-0 rounded overflow-hidden bg-muted shadow-sm">
                        <Image
                          src={movie.posterUrl || '/placeholder-movie.png'}
                          alt={movie.title}
                          fill
                          className="object-cover"
                          sizes="40px"
                        />
                      </div>

                      <div className="flex-1 min-w-0">
                        <div className="flex justify-between items-start gap-2">
                          <p className="text-sm font-medium truncate group-hover:text-primary transition-colors">
                            {movie.title}
                          </p>

                          <Badge variant="outline" className="text-[10px] h-5 px-1 shrink-0">
                            {movie.status}
                          </Badge>
                        </div>

                        <div className="flex items-center gap-2 text-xs text-muted-foreground mt-1">
                          <span className="flex items-center gap-0.5">
                            <Clock className="h-3 w-3" /> {movie.duration} phút
                          </span>

                          <span>•</span>

                          <span className="flex items-center gap-0.5 text-yellow-500">
                            <Star className="h-3 w-3 fill-yellow-500" />
                            {movie.averageRating?.toFixed(1) || 'N/A'}
                          </span>
                        </div>
                      </div>
                    </Link>
                  ))}

                  <div className="border-t border-border mt-2 pt-2 px-2">
                    <Link
                      href={`/movies?search=${encodeURIComponent(query)}`}
                      onClick={handleClose}
                      className="block text-center text-xs text-primary hover:underline py-1 font-medium"
                    >
                      Xem tất cả kết quả
                    </Link>
                  </div>
                </div>
              ) : (
                <div className="p-6 text-center">
                  <p className="text-sm text-muted-foreground">Không tìm thấy phim.</p>
                </div>
              )}
            </div>
          )}
        </div>
      ) : (
        <Button
          variant="ghost"
          size="icon"
          className="rounded-full hover:bg-muted"
          onClick={() => onToggle(true)}
        >
          <Search className="h-[18px] w-[18px]" />
          <span className="sr-only">Tìm kiếm</span>
        </Button>
      )}
    </div>
  )
}



// 3. User Navigation Component
const UserNav = () => {
  const { user, isAuthenticated } = useUserStore()
  const { theme, setTheme } = useTheme()
  const isMounted = useMounted()

  return (
    <div className="flex items-center gap-2">
      <Button
        variant="ghost"
        size="icon"
        className="rounded-full"
        onClick={() => setTheme(theme === 'dark' ? 'light' : 'dark')}
      >
        <Sun className="h-[18px] w-[18px] rotate-0 scale-100 transition-all dark:-rotate-90 dark:scale-0" />
        <Moon className="absolute h-[18px] w-[18px] rotate-90 scale-0 transition-all dark:rotate-0 dark:scale-100" />
        <span className="sr-only">Đổi giao diện</span>
      </Button>

      {!isMounted ? (
        <Skeleton className="h-10 w-10 rounded-full" />
      ) : isAuthenticated && user ? (
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button
              variant="ghost"
              className="relative h-10 w-10 rounded-full ring-2 ring-transparent hover:ring-primary/20 transition-all"
            >
              <Avatar className="h-10 w-10 border border-border">
                <AvatarImage
                  width={200}
                  height={200}
                  src={user.profilePicture || ''}
                  alt={user.fullName}
                  className="object-cover"
                />
                <AvatarFallback className="bg-primary/10 text-primary font-medium">
                  {user.fullName?.charAt(0).toUpperCase() || 'U'}
                </AvatarFallback>
              </Avatar>
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent className="w-56" align="end" forceMount>
            <DropdownMenuLabel className="font-normal">
              <div className="flex flex-col space-y-1">
                <p className="text-sm font-medium leading-none truncate">{user.fullName}</p>
                <p className="text-xs leading-none text-muted-foreground truncate">{user.email}</p>
              </div>
            </DropdownMenuLabel>
            <DropdownMenuSeparator />
            <DropdownMenuItem asChild>
              <Link href="/profile" className="cursor-pointer">
                <UserIcon className="mr-2 h-4 w-4" />
                <span>Hồ sơ cá nhân</span>
              </Link>
            </DropdownMenuItem>
            <DropdownMenuItem asChild>
              <Link href="/order-history" className="cursor-pointer">
                <Ticket className="mr-2 h-4 w-4" />
                <span>Vé của tôi</span>
              </Link>
            </DropdownMenuItem>
            {user.role === 'admin' && (
              <DropdownMenuItem asChild>
                <Link href="/admin" className="cursor-pointer">
                  <Settings className="mr-2 h-4 w-4" />
                  <span>Trang quản trị</span>
                </Link>
              </DropdownMenuItem>
            )}
            <DropdownMenuSeparator />
            <DropdownMenuItem
              className="p-0 focus:bg-transparent"
              onSelect={e => e.preventDefault()}
            >
              <LogoutButton className="w-full bg-bg-primary justify-start rounded-sm px-2 py-1.5 text-sm outline-none transition-colors hover:bg-destructive/10 hover:text-destructive text-foreground shadow-none" />
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      ) : (
        <Button asChild className="rounded-xl px-4 font-semibold shadow-md">
          <Link href="/login">Đăng nhập</Link>
        </Button>
      )}
    </div>
  )
}

// --- MAIN HEADER ---

export function Header() {
  const [isSearchOpen, setIsSearchOpen] = useState(false)
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false) 
  const pathname = usePathname()

  useEffect(() => {
    setIsMobileMenuOpen(false)
  }, [pathname])

  return (
    <header className="sticky top-0 z-50 w-full border-b border-border/50 bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
      <div
        className={cn(
          'flex items-center justify-between w-full relative',
          'h-[72px] md:h-[82px] xl:h-[70px]',
          'px-4 md:px-6 xl:px-[86px]'
        )}
      >
        {/* LEFT: Logo + Nav */}
        <div
          className={cn(
            'flex items-center gap-3 md:gap-10 transition-all duration-300',
            isSearchOpen ? 'hidden md:flex' : 'flex'
          )}
        >
          <Button
            variant="ghost"
            size="icon"
            className="md:hidden shrink-0"
            onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
          >
            {isMobileMenuOpen ? <X className="h-6 w-6" /> : <Menu className="h-6 w-6" />}
          </Button>

          <Link href="/" className="flex items-center gap-2 shrink-0 group">
            <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-primary text-white shadow-lg shadow-primary/30 transition-transform group-hover:scale-105">
              <div className="w-10 h-10 rounded-xl bg-linear-to-br from-[#6C63FF] to-[#8C82FF] flex items-center justify-center shadow-lg">
                <Film className="w-6 h-6 text-white" />
              </div>
            </div>
            <span className="text-xl font-bold tracking-tight hidden xl:block bg-clip-text text-transparent bg-gradient-to-r from-primary to-purple-600">
              CineBooking
            </span>
          </Link>

          <div className="hidden md:block">
            <MainNav />
          </div>
        </div>

        {/* RIGHT: Actions */}
        <div
          className={cn(
            'flex items-center gap-2 md:gap-4',
            isSearchOpen ? 'w-full md:w-auto justify-end' : ''
          )}
        >
          {/* Search Box */}
          <SearchBar isOpen={isSearchOpen} onToggle={setIsSearchOpen} />

          {/* User & Theme Actions */}
          <div className={cn(isSearchOpen ? 'hidden md:block' : 'block')}>
            <UserNav />
          </div>
        </div>
      </div>

      {isMobileMenuOpen && (
        <div className="md:hidden absolute top-[72px] left-0 w-full border-b border-border bg-background/95 backdrop-blur-md shadow-lg p-4 flex flex-col gap-2 animate-in slide-in-from-top-2 z-40">
          {NAV_LINKS.map(link => (
            <Link
              key={link.href}
              href={link.href}
              onClick={() => setIsMobileMenuOpen(false)}
              className={cn(
                'text-base font-semibold px-4 py-3 rounded-xl transition-all',
                pathname === link.href 
                  ? 'bg-primary/10 text-primary' 
                  : 'text-muted-foreground hover:bg-muted hover:text-foreground'
              )}
            >
              {link.label}
            </Link>
          ))}
        </div>
      )}
    </header>
  )
}
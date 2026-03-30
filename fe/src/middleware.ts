import { NextResponse } from 'next/server'
import type { NextRequest } from 'next/server'
import { decodeJwt } from 'jose'

// --- CONSTANTS ---
const PUBLIC_PATHS = ['/login', '/register', '/forgot-password']
const ADMIN_PATHS = ['/admin']
const STAFF_PATHS = ['/staff']
const CUSTOMER_PATHS = ['/profile', '/order-history', '/bookings']
const MOVIE_PATH_REGEX = /^\/movies(\/[^/]+)?$/
const MOVIE_BOOKING_REGEX = /^\/movies\/[^/]+\/booking-flow/
// --- HELPERS ---
function isCustomerPath(pathname: string) {
  // Check 1: Các trang profile, bookings...
  if (CUSTOMER_PATHS.some(path => pathname.startsWith(path))) {
    return true
  }

  // Check 2: Trang movies public (để phân quyền role)
  if (MOVIE_PATH_REGEX.test(pathname)) {
    return true
  }

  // Check 3: Trang booking flow (SỬA THÊM VÀO ĐÂY)
  if (MOVIE_BOOKING_REGEX.test(pathname)) {
    return true
  }

  return false
}
// 1. Hàm gọi API refresh token
async function refreshAccessToken(request: NextRequest): Promise<string | null> {
  try {
    const response = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/auth/refresh-token`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Cookie: request.headers.get('cookie') || '',
      },
      credentials: 'include',
    })

    if (response.ok) {
      const data = await response.json()
      return data.data.accessToken
    }
    return null
  } catch (error) {
    console.error('Refresh token error:', error)
    return null
  }
}

// 2. Hàm Logout: Xóa cookie và đẩy về Login
function logoutAndRedirect(request: NextRequest, callbackUrl?: string): NextResponse {
  const loginUrl = new URL('/login', request.url)
  if (callbackUrl) {
    loginUrl.searchParams.set('callbackUrl', callbackUrl)
  }

  const response = NextResponse.redirect(loginUrl)
  response.cookies.delete('authToken') // Xóa cookie -> Client sẽ hiểu là user = null
  return response
}

// 3. Hàm điều hướng dựa trên Role (khi user đã login mà vào trang public)
function getRedirectByRole(role: string, request: NextRequest): NextResponse {
  if (role === 'admin') return NextResponse.redirect(new URL('/admin', request.url))
  if (role === 'staff') return NextResponse.redirect(new URL('/staff', request.url))
  return NextResponse.redirect(new URL('/', request.url))
}

// 4. Kiểm tra quyền truy cập
function checkRoleAccess(
  role: string,
  pathname: string,
  request: NextRequest
): NextResponse | null {
  // Admin không được vào trang Staff hoặc trang Customer
  if (role === 'admin') {
    if (
      STAFF_PATHS.some(path => pathname.startsWith(path)) ||
      isCustomerPath(pathname) ||
      pathname === '/'
    ) {
      return NextResponse.redirect(new URL('/admin', request.url))
    }
  }

  // Staff không được vào trang Admin hoặc Customer
  if (role === 'staff') {
    if (ADMIN_PATHS.some(path => pathname.startsWith(path))) {
      return NextResponse.rewrite(new URL('/404', request.url))
    }
    if (isCustomerPath(pathname) || pathname === '/') {
      return NextResponse.redirect(new URL('/staff', request.url))
    }
  }

  // User/Customer không được vào Admin hoặc Staff
  if (role === 'customer' || role === 'user') {
    if (
      ADMIN_PATHS.some(path => pathname.startsWith(path)) ||
      STAFF_PATHS.some(path => pathname.startsWith(path))
    ) {
      return NextResponse.rewrite(new URL('/404', request.url))
    }
  }

  return null
}

// --- MAIN MIDDLEWARE ---
export async function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl
  let token = request.cookies.get('authToken')?.value
  let isTokenRefreshed = false

  // Danh sách các trang cần bảo vệ
  const isProtectedPath =
    ADMIN_PATHS.some(path => pathname.startsWith(path)) ||
    STAFF_PATHS.some(path => pathname.startsWith(path)) ||
    CUSTOMER_PATHS.some(path => pathname.startsWith(path)) ||
    MOVIE_BOOKING_REGEX.test(pathname)

  // CASE 1: Không có token
  if (!token) {
    if (isProtectedPath) {
      // Nếu vào trang bảo vệ mà không có token -> Login
      return logoutAndRedirect(request, pathname)
    }
    // Trang public -> Cho qua
    return NextResponse.next()
  }

  // CASE 2: Có token -> Kiểm tra tính hợp lệ và Hết hạn
  try {
    let payload = decodeJwt(token)

    // Kiểm tra hết hạn
    if (payload.exp && Date.now() >= payload.exp * 1000) {
      // Token hết hạn -> Thử Refresh
      const newToken = await refreshAccessToken(request)

      if (!newToken) {
        // QUAN TRỌNG: Refresh thất bại -> Xóa cookie, đá về login (Set user null)
        return logoutAndRedirect(request)
      }

      // Refresh thành công -> Cập nhật biến để dùng tiếp bên dưới
      token = newToken
      payload = decodeJwt(newToken)
      isTokenRefreshed = true
    }

    const role = (payload.role as string)?.toLowerCase() || 'user'

    // CASE 3: Đã login (token valid) nhưng cố vào trang Public (Login/Register)
    if (PUBLIC_PATHS.some(path => pathname.startsWith(path))) {
      const response = getRedirectByRole(role, request)
      // Nếu vừa refresh token xong thì phải set lại cookie mới vào response redirect này
      if (isTokenRefreshed) {
        response.cookies.set('authToken', token, {
          httpOnly: true,
          secure: true,
          sameSite: 'none',
          maxAge: 60 * 60,
        })
      }
      return response
    }

    // CASE 4: Kiểm tra quyền truy cập (Role Access)
    const accessRedirect = checkRoleAccess(role, pathname, request)
    if (accessRedirect) {
      // Nếu bị redirect do sai quyền, cũng cần set lại cookie nếu đã refresh
      if (isTokenRefreshed) {
        accessRedirect.cookies.set('authToken', token, {
          httpOnly: true,
          secure: true,
          sameSite: 'none',
          maxAge: 60 * 60,
        })
      }
      return accessRedirect
    }

    // CASE 5: Hợp lệ tất cả -> Cho đi tiếp (Next)
    const response = NextResponse.next()

    // Nếu có token mới (do refresh), set lại cookie vào response cuối cùng
    if (isTokenRefreshed) {
      response.cookies.set('authToken', token, {
        httpOnly: true,
        secure: process.env.NODE_ENV === 'production',
        sameSite: 'strict',
        maxAge: 60 * 60,
      })
    }

    return response
  } catch (error) {
    // Token lỗi format hoặc bị can thiệp -> Xóa và Logout
    return logoutAndRedirect(request)
  }
}

export const config = {
  matcher: ['/((?!api|_next/static|_next/image|favicon.ico).*)'],
}

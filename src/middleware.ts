import { auth } from '@/auth'
import { NextResponse } from 'next/server'

export default auth((req) => {
  const isLoggedIn = !!req.auth
  const { pathname } = req.nextUrl

  // Public routes
  const publicRoutes = ['/', '/login', '/register']
  const isPublicRoute = publicRoutes.includes(pathname)

  // Auth API routes
  const isAuthRoute = pathname.startsWith('/api/auth')

  // API routes (need auth check separately)
  const isApiRoute = pathname.startsWith('/api')

  // Allow auth routes
  if (isAuthRoute) {
    return NextResponse.next()
  }

  // Redirect to login if not authenticated and trying to access protected route
  if (!isLoggedIn && !isPublicRoute && !isApiRoute) {
    return NextResponse.redirect(new URL('/login', req.url))
  }

  // Redirect to dashboard if authenticated and trying to access auth pages
  if (isLoggedIn && (pathname === '/login' || pathname === '/register')) {
    return NextResponse.redirect(new URL('/dashboard', req.url))
  }

  // Protect API routes (except auth)
  if (isApiRoute && !isAuthRoute && !isLoggedIn) {
    return NextResponse.json(
      {
        success: false,
        error: { code: 'UNAUTHORIZED', message: '인증이 필요합니다' }
      },
      { status: 401 }
    )
  }

  return NextResponse.next()
})

export const config = {
  matcher: ['/((?!_next/static|_next/image|favicon.ico).*)'],
  unstable_allowDynamic: [
    '/node_modules/bcryptjs/**',
  ],
}

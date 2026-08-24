import { NextResponse } from 'next/server'

// Routes that require authentication
const protectedRoutes = [
  '/dashboard',
  '/admin',
  '/sales',
  '/dc',
  '/rider', 
  '/vendor',
  '/packages',
  '/earnings',
  '/profile',
  '/users',
  '/settings',
  '/performance',
  '/pricing',
  '/policies',
  '/agents',
  '/distribution-centers',
  '/cod-payments',
  '/cache',
  '/vendors'
]

// Routes that should redirect authenticated users (auth pages)
const authRoutes = [
  '/signin',
  '/signup',
  '/forgot-password',
  '/reset-password'
]

// Public routes that don't require authentication
const publicRoutes = [
  '/',
  '/about',
  '/contact',
  '/terms',
  '/privacy'
]

function isTokenValid(token) {
  if (!token) return false
  
  try {
    // Decode JWT payload to check expiration
    const payload = JSON.parse(atob(token.split('.')[1]))
    return payload.exp * 1000 > Date.now()
  } catch (error) {
    console.error('Token validation error:', error)
    return false
  }
}

export function middleware(request) {
  const { pathname } = request.nextUrl
  
  // Get token from cookie
  const token = request.cookies.get('user-token')?.value
  const isAuthenticated = isTokenValid(token)
  
  // Check if the current path requires authentication
  const isProtectedRoute = protectedRoutes.some(route => 
    pathname.startsWith(route) || pathname === route
  )
  
  // Check if the current path is an auth route
  const isAuthRoute = authRoutes.some(route => 
    pathname.startsWith(route) || pathname === route
  )
  
  // If accessing a protected route without authentication
  if (isProtectedRoute && !isAuthenticated) {
    const signInUrl = new URL('/signin', request.url)
    signInUrl.searchParams.set('redirect', pathname)
    return NextResponse.redirect(signInUrl)
  }
  
  // If accessing auth routes while authenticated, redirect to root for role-based redirection
  if (isAuthRoute && isAuthenticated) {
    return NextResponse.redirect(new URL('/', request.url))
  }
  
  // For API routes, add CORS headers and token validation
  if (pathname.startsWith('/api/')) {
    const response = NextResponse.next()
    
    // Add CORS headers
    response.headers.set('Access-Control-Allow-Origin', '*')
    response.headers.set('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE, OPTIONS')
    response.headers.set('Access-Control-Allow-Headers', 'Content-Type, Authorization')
    
    // For protected API routes, ensure token is present
    if (pathname.startsWith('/api/protected/') && !isAuthenticated) {
      return new NextResponse(
        JSON.stringify({ error: 'Authentication required' }),
        { status: 401, headers: { 'content-type': 'application/json' } }
      )
    }
    
    return response
  }
  
  return NextResponse.next()
}

export const config = {
  matcher: [
    /*
     * Match all request paths except for the ones starting with:
     * - _next/static (static files)
     * - _next/image (image optimization files)
     * - favicon.ico (favicon file)
     * - public folder
     */
    '/((?!_next/static|_next/image|favicon.ico|public/).*)',
  ],
}

import { NextResponse } from "next/server"
import type { NextRequest } from "next/server"
import { getToken } from "next-auth/jwt"

export async function middleware(req: NextRequest) {
  const pathname = req.nextUrl.pathname

  // Define route types
  const isAuthPage = pathname.startsWith('/auth')
  const isApiRoute = pathname.startsWith('/api')
  const isHomePage = pathname === '/'
  const isStaticAsset = pathname.startsWith('/_next') || pathname === '/favicon.ico'
  const isProtectedPage = !isAuthPage && !isApiRoute && !isHomePage && !isStaticAsset

  // Allow static assets
  if (isStaticAsset) {
    return NextResponse.next()
  }

  // Allow API routes to handle their own auth
  if (isApiRoute) {
    return NextResponse.next()
  }

  // Get the token using getToken (more reliable than withAuth)
  const token = await getToken({
    req,
    secret: process.env.NEXTAUTH_SECRET,
    secureCookie: false, // Allow non-secure cookies for ngrok
  })

  const isAuth = !!token

  // Homepage: redirect authenticated users to their dashboard
  if (isHomePage && isAuth) {
    if (token.role === 'company_admin') {
      return NextResponse.redirect(new URL('/dashboard', req.url))
    }
    return NextResponse.redirect(new URL('/employee/dashboard', req.url))
  }

  // Homepage: allow unauthenticated users to see public homepage
  if (isHomePage && !isAuth) {
    return NextResponse.next()
  }

  // Auth pages: redirect authenticated users to their dashboard
  if (isAuthPage && isAuth) {
    if (token.role === 'company_admin') {
      return NextResponse.redirect(new URL('/dashboard', req.url))
    }
    return NextResponse.redirect(new URL('/employee/dashboard', req.url))
  }

  // Protected pages: redirect unauthenticated users to signin
  if (isProtectedPage && !isAuth) {
    let from = pathname
    if (req.nextUrl.search) {
      from += req.nextUrl.search
    }

    return NextResponse.redirect(
      new URL(`/auth/signin?callbackUrl=${encodeURIComponent(from)}`, req.url)
    )
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
     * - api/auth (NextAuth routes)
     */
    '/((?!_next/static|_next/image|favicon.ico|public|api/auth).*)',
  ],
}

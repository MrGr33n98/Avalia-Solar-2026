import { NextRequest, NextResponse } from 'next/server';

// This middleware runs on the edge
export function middleware(request: NextRequest) {
  const pathname = request.nextUrl.pathname;
  // Get the token from httpOnly cookie
  const token = request.cookies.get('jwt_token')?.value;

  console.log(`[Middleware] Request to: ${pathname}`, {
    hasToken: !!token,
    cookieCount: request.cookies.getAll().length
  });

  // Define protected routes
  const protectedPaths = [
    '/dashboard',
    '/profile',
    '/company-dashboard',
    '/review-dashboard',
    '/select-company',
  ];
  
  // Check if the current path is protected
  const isProtectedRoute = protectedPaths.some(path => 
    pathname.startsWith(path.replace('[id]', ''))
  );
  
  if (isProtectedRoute) {
    if (!token) {
      console.warn(`[Middleware] Unauthorized access to protected route: ${pathname}. Redirecting to /login`);
      const loginUrl = new URL('/login', request.url);
      const redirectTo = pathname + request.nextUrl.search;
      loginUrl.searchParams.set('redirect', redirectTo);
      return NextResponse.redirect(loginUrl);
    }
    console.log(`[Middleware] Authorized access to: ${pathname}`);
  }
  
  // Continue with the request
  return NextResponse.next();
}

// Configure which paths the middleware should run on
export const config = {
  matcher: [
    /*
     * Match all request paths except for the ones starting with:
     * - api (API routes)
     * - _next/static (static files)
     * - _next/image (image optimization files)
     * - favicon.ico (favicon file)
     */
    '/((?!api|_next/static|_next/image|favicon.ico).*)',
  ],
};

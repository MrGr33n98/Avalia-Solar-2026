import { NextRequest, NextResponse } from 'next/server';

// This middleware runs on the edge
export function middleware(request: NextRequest) {
  // Get the token from httpOnly cookie
  const token = request.cookies.get('jwt_token')?.value;

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
    request.nextUrl.pathname.startsWith(path.replace('[id]', ''))
  );
  
  if (isProtectedRoute) {
    if (!token) {
      const loginUrl = new URL('/login', request.url);
      const redirectTo = request.nextUrl.pathname + request.nextUrl.search;
      loginUrl.searchParams.set('redirect', redirectTo);
      return NextResponse.redirect(loginUrl);
    }
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

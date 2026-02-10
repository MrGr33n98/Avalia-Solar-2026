import { NextRequest, NextResponse } from 'next/server';

// This middleware runs on the edge
export function middleware(request: NextRequest) {
  const pathname = request.nextUrl.pathname;
  // Get the token from httpOnly cookie
  const token = request.cookies.get('jwt_token')?.value;
  const isRscRequest = request.headers.get('rsc') === '1' || request.nextUrl.searchParams.has('_rsc');
  const isServerActionRequest = request.headers.has('next-action');
  const shouldDisableCache = isRscRequest || isServerActionRequest;

  if (process.env.NODE_ENV === 'development') {
    console.log(`[Middleware] Request to: ${pathname}`, {
      hasToken: !!token,
      cookieCount: request.cookies.getAll().length,
      isRscRequest,
      isServerActionRequest,
    });
  }

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

  const applyNoStoreHeaders = (response: NextResponse) => {
    if (!shouldDisableCache) return response;
    response.headers.set('Cache-Control', 'no-store, no-cache, must-revalidate, proxy-revalidate');
    response.headers.set('Pragma', 'no-cache');
    response.headers.set('Expires', '0');
    return response;
  };
  
  if (isProtectedRoute) {
    if (!token) {
      if (process.env.NODE_ENV === 'development') {
        console.warn(`[Middleware] Unauthorized access to protected route: ${pathname}. Redirecting to /login`);
      }
      const loginUrl = new URL('/login', request.url);
      const redirectTo = pathname + request.nextUrl.search;
      loginUrl.searchParams.set('redirect', redirectTo);
      return applyNoStoreHeaders(NextResponse.redirect(loginUrl));
    }
    if (process.env.NODE_ENV === 'development') {
      console.log(`[Middleware] Authorized access to: ${pathname}`);
    }
  }
  
  // Continue with the request
  return applyNoStoreHeaders(NextResponse.next());
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

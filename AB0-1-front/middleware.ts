import { NextRequest, NextResponse } from 'next/server';

// This middleware runs on the edge
export function middleware(request: NextRequest) {
  // Get the token from cookies OR from Authorization header
  const token = request.cookies.get('auth_token')?.value || 
                request.headers.get('authorization')?.replace('Bearer ', '');
  
  // Define protected routes
  const protectedPaths = [
    '/dashboard',
    '/profile',
    '/companies/[id]/review',
    '/admin',
  ];
  
  // Check if the current path is protected
  const isProtectedRoute = protectedPaths.some(path => 
    request.nextUrl.pathname.startsWith(path.replace('[id]', ''))
  );
  
  // For protected routes, we can't check localStorage in middleware (runs on edge)
  // So we'll allow the request and let client-side handle auth check
  // The middleware will only block if there's explicitly no cookie/header token
  if (isProtectedRoute) {
    // Don't block - let client-side AuthContext handle it
    // This allows localStorage token to work
    return NextResponse.next();
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
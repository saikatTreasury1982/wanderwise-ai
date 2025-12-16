import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';
import { verifySession } from '@/app/lib/services/session-service';

// Routes that require authentication
const protectedRoutes = ['/dashboard'];

// Routes that should redirect to dashboard if already logged in
const authRoutes = ['/login', '/register'];

export async function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl;
  const sessionToken = request.cookies.get('session')?.value;

  // Verify session validity if token exists
  let isValidSession = false;
  if (sessionToken) {
    isValidSession = await verifySession(sessionToken);
    
    // If session is invalid, clear the cookie
    if (!isValidSession) {
      const response = NextResponse.next();
      response.cookies.delete('session');
      // Continue processing with isValidSession = false
    }
  }

  // Check if accessing a protected route
  const isProtectedRoute = protectedRoutes.some(route => 
    pathname.startsWith(route)
  );

  if (isProtectedRoute && !isValidSession) {
    const loginUrl = new URL('/login', request.url);
    const response = NextResponse.redirect(loginUrl);
    response.cookies.delete('session'); // Clear invalid session
    return response;
  }

  // Check if accessing auth routes with a valid session
  const isAuthRoute = authRoutes.some(route => 
    pathname.startsWith(route)
  );

  if (isAuthRoute && isValidSession) {
    const dashboardUrl = new URL('/dashboard', request.url);
    return NextResponse.redirect(dashboardUrl);
  }

  return NextResponse.next();
}

export const config = {
  matcher: [
    '/dashboard/:path*',
    '/login',
    '/register',
  ],
};
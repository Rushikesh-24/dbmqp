import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";
import jwt from "jsonwebtoken";

// Define protected routes that require authentication
const protectedRoutes = ["/dashboard", "/menu", "/orders", "/profile"];

// Define public routes that don't require authentication
const publicRoutes = ["/signin", "/signup", "/api/signin", "/api/signup"];

export function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl;

  // Allow all API routes except protected ones
  if (
    pathname.startsWith("/api/") &&
    !pathname.startsWith("/api/protected/") &&
    pathname !== "/api/restaurant"
  ) {
    return NextResponse.next();
  }

  // Allow public routes
  if (publicRoutes.includes(pathname)) {
    return NextResponse.next();
  }

  // Allow static files and Next.js internals
  if (
    pathname.startsWith("/_next/") ||
    pathname.startsWith("/favicon.ico") ||
    pathname.includes(".")
  ) {
    return NextResponse.next();
  }

  // Get token from cookies or Authorization header
  let token = request.cookies.get("token")?.value;

  if (!token) {
    const authHeader = request.headers.get("authorization");
    if (authHeader?.startsWith("Bearer ")) {
      token = authHeader.substring(7);
    }
  }

  // If no token and accessing protected route, redirect to signin
  if (!token && (protectedRoutes.includes(pathname) || pathname === "/")) {
    const signinUrl = new URL("/signin", request.url);
    signinUrl.searchParams.set("redirect", pathname);
    return NextResponse.redirect(signinUrl);
  }

  // If token exists, verify it
  if (token) {
    try {
      jwt.verify(token, process.env.JWT_SECRET as string);

      // If user is authenticated and trying to access signin/signup, redirect to home
      if (pathname === "/signin" || pathname === "/signup") {
        return NextResponse.redirect(new URL("/", request.url));
      }

      return NextResponse.next();
    } catch {
      // Invalid token, clear it and redirect to signin
      const response = NextResponse.redirect(new URL("/signin", request.url));
      response.cookies.delete("token");
      return response;
    }
  }

  return NextResponse.next();
}

export const config = {
  matcher: [
    /*
     * Match all request paths except for the ones starting with:
     * - _next/static (static files)
     * - _next/image (image optimization files)
     * - favicon.ico (favicon file)
     */
    "/((?!_next/static|_next/image|favicon.ico).*)",
  ],
};

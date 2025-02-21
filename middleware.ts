import { NextResponse } from "next/server";
import { getToken } from "next-auth/jwt";
import type { NextRequest } from "next/server";

// Define route configurations
const PUBLIC_ROUTES = new Set([
  "/",
  "/about",
  "/auth/signin",
  "/auth/register",
]);

const PROTECTED_PATHS = new Set(["/dashboard", "/admin", "/account"]);

const SPECIAL_ACCOUNT_ROUTES = new Set([
  "/account/reset-password",
  "/account/delete-account",
]);

export async function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl;

  // Skip middleware for API routes and static files
  if (pathname.startsWith("/api/")) {
    return NextResponse.next();
  }

  // Get the token early to avoid multiple calls
  const token = await getToken({
    req: request,
    secret: process.env.NEXTAUTH_SECRET,
  });

  // Allow access to public routes regardless of auth status
  if (PUBLIC_ROUTES.has(pathname)) {
    // Redirect authenticated users away from auth pages
    if (
      token &&
      (pathname === "/auth/signin" || pathname === "/auth/register")
    ) {
      return NextResponse.redirect(new URL("/dashboard", request.url));
    }
    return NextResponse.next();
  }

  // Check protected routes
  const isProtectedPath =
    PROTECTED_PATHS.has(pathname) ||
    SPECIAL_ACCOUNT_ROUTES.has(pathname) ||
    Array.from(PROTECTED_PATHS).some((path) => pathname.startsWith(path + "/"));

  if (isProtectedPath) {
    if (!token) {
      // Store the attempted URL to redirect back after login
      const callbackUrl = encodeURIComponent(request.url);
      return NextResponse.redirect(
        new URL(`/auth/signin?callbackUrl=${callbackUrl}`, request.url)
      );
    }
  }

  return NextResponse.next();
}

export const config = {
  matcher: [
    /*
     * Match all request paths except:
     * - _next/static (static files)
     * - _next/image (image optimization files)
     * - favicon.ico (favicon file)
     * - public files (public folder)
     */
    "/((?!_next/static|_next/image|favicon.ico|public/).*)",
  ],
};

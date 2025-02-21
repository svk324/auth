import { NextResponse } from "next/server";
import { getToken } from "next-auth/jwt";
import type { NextRequest } from "next/server";

export async function middleware(request: NextRequest) {
  const token = await getToken({
    req: request,
    secret: process.env.NEXTAUTH_SECRET,
  });
  const { pathname } = request.nextUrl;

  // Allow public routes
  const publicRoutes = ["/", "/about", "/auth/signin", "/auth/register"];
  if (publicRoutes.includes(pathname) || pathname.startsWith("/api")) {
    return NextResponse.next();
  }

  // Protect routes that were originally under /protected
  const protectedRoutes = ["/dashboard", "/admin", "/account"];
  if (
    protectedRoutes.some((route) => pathname === route) ||
    pathname.startsWith("/account/reset-password") ||
    pathname.startsWith("/account/delete-account")
  ) {
    if (!token) {
      return NextResponse.redirect(new URL("/auth/signin", request.url));
    }
  }

  return NextResponse.next();
}

export const config = {
  matcher: ["/((?!_next/static|_next/image|favicon.ico).*)"],
};

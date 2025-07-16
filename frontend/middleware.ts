// middleware.ts
import { NextRequest, NextResponse } from "next/server";

// Any public page should be listed here
const PUBLIC_PATHS = ["/", "/login", "/register"];

export function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl;
  const isPublic = PUBLIC_PATHS.some((path) => pathname.startsWith(path));

  const sessionCookie = request.cookies.get("session")?.value;

  // If user is NOT authenticated and tries to visit a protected route
  if (!sessionCookie && !isPublic) {
    console.log("🔒 Redirecting unauthenticated user from:", pathname);
    return NextResponse.redirect(new URL("/", request.url));
  }

  return NextResponse.next();
}

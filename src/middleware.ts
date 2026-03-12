import { type NextRequest, NextResponse } from "next/server";
import { updateSession } from "@/lib/supabase/middleware";

/**
 * Next.js edge middleware — runs on every matched request.
 *
 * Responsibilities:
 *  1. Refresh the Supabase session so cookies stay up to date (done here).
 *  2. Auth guard + role-based redirects (implemented fully in Step 4).
 */
export async function middleware(request: NextRequest) {
  // Step 1: refresh session and get the current user.
  const { supabaseResponse, user } = await updateSession(request);

  const pathname = request.nextUrl.pathname;

  // Public paths that never require auth.
  const isAuthPath =
    pathname.startsWith("/login") ||
    pathname.startsWith("/register") ||
    pathname.startsWith("/pending-approval");

  // If there is no session and the user is trying to access a protected route,
  // redirect to the login page.
  // NOTE: Full role-based guard (pending/rejected/inactive checks) is added in Step 4.
  if (!user && !isAuthPath) {
    const loginUrl = new URL("/login", request.url);
    loginUrl.searchParams.set("redirectedFrom", pathname);
    return NextResponse.redirect(loginUrl);
  }

  // If authenticated and visiting an auth page, redirect to dashboard.
  if (user && isAuthPath && !pathname.startsWith("/pending-approval")) {
    return NextResponse.redirect(new URL("/dashboard", request.url));
  }

  return supabaseResponse;
}

export const config = {
  matcher: [
    /*
     * Match all request paths EXCEPT:
     * - _next/static (static files)
     * - _next/image  (image optimization)
     * - favicon.ico, sitemap.xml, robots.txt
     * - /api/auth/callback (Supabase auth callback — must be public)
     */
    "/((?!_next/static|_next/image|favicon.ico|sitemap.xml|robots.txt|api/auth/callback).*)",
  ],
};

import { type NextRequest, NextResponse } from "next/server";
import { updateSession } from "@/lib/supabase/middleware";

/**
 * Next.js edge middleware — runs on every matched request.
 *
 * Responsibilities:
 *  1. Refresh the Supabase session so cookies stay up to date.
 *  2. Auth guard: redirect unauthenticated users to /login.
 *  3. Redirect authenticated users away from auth pages.
 *
 * Performance: We skip `supabase.auth.getUser()` for requests that do not
 * need session data (e.g. Next.js API routes that handle their own auth).
 * The matcher in `config` already excludes _next/static, _next/image, and
 * favicon; this function adds a fast-path for API routes.
 */
export async function proxy(request: NextRequest) {
  const pathname = request.nextUrl.pathname;

  // ── Fast-path: API routes (except the Supabase auth callback) ────────────
  // These routes either authenticate themselves (e.g. webhook handlers) or
  // rely on the Supabase client created inside the route handler.
  // Skipping updateSession() here avoids an extra `getUser()` round-trip on
  // every API call.
  if (pathname.startsWith("/api/") && !pathname.startsWith("/api/auth/")) {
    return NextResponse.next({ request });
  }

  // ── All other requests: refresh session and enforce auth guard ────────────
  const { supabaseResponse, user } = await updateSession(request);

  // Paths that don't require authentication.
  const isAuthPath =
    pathname.startsWith("/login") ||
    pathname.startsWith("/register") ||
    pathname.startsWith("/pending-approval");

  // Unauthenticated user visiting a protected route → redirect to /login.
  if (!user && !isAuthPath) {
    const loginUrl = new URL("/login", request.url);
    loginUrl.searchParams.set("redirectedFrom", pathname);
    return NextResponse.redirect(loginUrl);
  }

  // Authenticated user visiting an auth page → redirect to /dashboard.
  if (user && isAuthPath && !pathname.startsWith("/pending-approval")) {
    return NextResponse.redirect(new URL("/dashboard", request.url));
  }

  return supabaseResponse;
}

export const config = {
  matcher: [
    /*
     * Match all request paths EXCEPT:
     * - _next/static  (static files)
     * - _next/image   (image optimisation)
     * - favicon.ico, sitemap.xml, robots.txt
     * - /api/auth/callback (Supabase auth callback — must be public)
     */
    "/((?!_next/static|_next/image|favicon.ico|sitemap.xml|robots.txt|api/auth/callback).*)",
  ],
};

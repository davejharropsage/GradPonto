import { NextResponse, type NextRequest } from "next/server";
import { SESSION_COOKIE } from "@/lib/auth/constants";

/**
 * A quick, optimistic gate that runs before pages render: no session cookie means no app.
 *
 * It only checks that a cookie EXISTS. It does not touch the database (Proxy runs on every
 * request, including prefetches) and it cannot tell a real session from a made-up one.
 * The real check is `requireRegisteredUser()` / `userDb()` next to the data, in every page,
 * server action and API route. Never rely on this file alone.
 */

// Reachable without signing in.
const PUBLIC = [
  /^\/landing(\/|$)/,
  /^\/signin(\/|$)/,
  /^\/privacy$/,
  /^\/terms$/,
  /^\/dev\/outbox$/,
  /^\/api\/debug-env-2b9f$/, // TEMPORARY — remove alongside src/app/api/debug-env-2b9f/
];

export function proxy(request: NextRequest) {
  const { pathname } = request.nextUrl;

  if (PUBLIC.some((pattern) => pattern.test(pathname))) return NextResponse.next();
  if (request.cookies.has(SESSION_COOKIE)) return NextResponse.next();

  if (pathname.startsWith("/api/")) {
    return NextResponse.json({ error: "Not signed in" }, { status: 401 });
  }

  // Visitors to the front door see the marketing page; anything deeper goes to sign-in.
  return NextResponse.redirect(new URL(pathname === "/" ? "/landing" : "/signin", request.url));
}

export const config = {
  // Everything except Next's own assets and static files.
  matcher: ["/((?!_next/static|_next/image|favicon.ico|icon.svg|.*\\.(?:png|jpg|jpeg|gif|svg|webp|ico|css|js|map|txt)$).*)"],
};

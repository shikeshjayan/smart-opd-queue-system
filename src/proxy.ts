import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";
import { AUTH_COOKIE } from "@/config/app";

export async function proxy(request: NextRequest) {
  const { pathname } = request.nextUrl;
  const token = request.cookies.get(AUTH_COOKIE)?.value;

  const isWorkspace = [
    "/patient",
    "/doctor",
    "/clinical",
    "/reception",
    "/hospital-admin",
    "/district-admin",
    "/state-admin",
    "/display",
    "/lab",
  ].some((prefix) => pathname.startsWith(prefix));

  if (isWorkspace && !token) {
    const loginUrl = new URL("/login", request.url);
    loginUrl.searchParams.set("next", pathname);
    return NextResponse.redirect(loginUrl);
  }

  // If a token exists, verify it's a valid JWT shape (header.payload.signature)
  if (token) {
    const parts = token.split(".");
    if (parts.length !== 3) {
      // Invalid token format — clear it
      const loginUrl = new URL("/login", request.url);
      loginUrl.searchParams.set("next", pathname);
      const response = NextResponse.redirect(loginUrl);
      response.cookies.set(AUTH_COOKIE, "", { path: "/", maxAge: 0 });
      return response;
    }
    // For deeper verification (exp, signature) we rely on server actions.
    // Edge proxy does a lightweight structural check for redirect efficiency.
  }

  return NextResponse.next();
}

export const config = {
  matcher: [
    "/patient/:path*",
    "/doctor/:path*",
    "/clinical/:path*",
    "/reception/:path*",
    "/hospital-admin/:path*",
    "/district-admin/:path*",
    "/state-admin/:path*",
    "/display/:path*",
    "/lab/:path*",
  ],
};

import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";
import { AUTH_COOKIE } from "@/config/app";

export function proxy(request: NextRequest) {
  const { pathname } = request.nextUrl;
  const cookie = request.cookies.get(AUTH_COOKIE)?.value;
  
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

  if (isWorkspace && !cookie) {
    const loginUrl = new URL("/login", request.url);
    loginUrl.searchParams.set("next", pathname);
    return NextResponse.redirect(loginUrl);
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

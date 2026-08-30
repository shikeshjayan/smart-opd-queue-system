import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";
import { AUTH_COOKIE } from "@/config/app";

const WORKSPACE_PREFIXES = [
  "/patient",
  "/doctor",
  "/clinical",
  "/reception",
  "/hospital-admin",
  "/district-admin",
  "/state-admin",
  "/display",
  "/lab",
  "/pharmacy",
  "/audit",
  "/diagnostics",
];

function isExpiredJwt(token: string): boolean {
  try {
    const payload = JSON.parse(
      Buffer.from(token.split(".")[1], "base64url").toString("utf-8")
    );
    if (typeof payload.exp !== "number") return false;
    return payload.exp * 1000 < Date.now();
  } catch {
    return true;
  }
}

export async function proxy(request: NextRequest) {
  const { pathname } = request.nextUrl;
  const token = request.cookies.get(AUTH_COOKIE)?.value;

  const isWorkspace = WORKSPACE_PREFIXES.some(
    (prefix) => pathname === prefix || pathname.startsWith(prefix + "/")
  );

  if (isWorkspace && !token) {
    const loginUrl = new URL("/login", request.url);
    loginUrl.searchParams.set("next", pathname);
    return NextResponse.redirect(loginUrl);
  }

  if (token) {
    const parts = token.split(".");
    if (parts.length !== 3) {
      const loginUrl = new URL("/login", request.url);
      loginUrl.searchParams.set("next", pathname);
      const response = NextResponse.redirect(loginUrl);
      response.cookies.set(AUTH_COOKIE, "", { path: "/", maxAge: 0 });
      return response;
    }

    if (isExpiredJwt(token)) {
      const loginUrl = new URL("/login", request.url);
      loginUrl.searchParams.set("next", pathname);
      const response = NextResponse.redirect(loginUrl);
      response.cookies.set(AUTH_COOKIE, "", { path: "/", maxAge: 0 });
      return response;
    }
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
    "/pharmacy/:path*",
    "/audit/:path*",
    "/diagnostics/:path*",
  ],
};

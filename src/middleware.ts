import { type NextRequest, NextResponse } from "next/server";
import { TOKEN_COOKIE } from "@/shared/lib/auth-cookie";

const PROTECTED_PREFIXES = [
  "/dashboard",
  "/live-transcribe",
  "/ppt-audio",
  "/ppt-canvas",
  "/canvas-discussion",
];

const AUTH_ROUTES = ["/login", "/register"];

export function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl;
  const hasToken = Boolean(request.cookies.get(TOKEN_COOKIE)?.value);

  const isProtected = PROTECTED_PREFIXES.some(
    (prefix) => pathname === prefix || pathname.startsWith(`${prefix}/`),
  );

  if (isProtected && !hasToken) {
    const url = request.nextUrl.clone();
    url.pathname = "/login";
    url.searchParams.set("next", pathname);
    return NextResponse.redirect(url);
  }

  if (hasToken && AUTH_ROUTES.includes(pathname)) {
    const url = request.nextUrl.clone();
    url.pathname = "/dashboard";
    url.search = "";
    return NextResponse.redirect(url);
  }

  return NextResponse.next();
}

export const config = {
  matcher: [
    "/dashboard/:path*",
    "/live-transcribe/:path*",
    "/ppt-audio/:path*",
    "/ppt-canvas/:path*",
    "/canvas-discussion/:path*",
    "/login",
    "/register",
  ],
};

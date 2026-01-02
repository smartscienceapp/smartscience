import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";

export function middleware(request: NextRequest) {
  const token = request.cookies.get("token")?.value;
  const { pathname } = request.nextUrl;

  if (pathname.startsWith("/api")) {
    const backendUrl = process.env.NEXT_PUBLIC_API_URL || "http://127.0.0.1:8000";
    const newPath = pathname.replace(/^\/api/, "");
    const url = new URL(newPath || "/", backendUrl);
    url.search = request.nextUrl.search;
    return NextResponse.rewrite(url);
  }

  const isDashboardPage = pathname.startsWith("/dashboard");
  const isLoginPage = pathname === "/login_page";
  const isRootPage = pathname === "/"; // 
  if (isRootPage) {
    if (token) {
      const url = request.nextUrl.clone();
      url.pathname = "/dashboard";
      return NextResponse.redirect(url);
    } else {
      const url = request.nextUrl.clone();
      url.pathname = "/login_page";
      return NextResponse.redirect(url);
    }
  }

  if (isDashboardPage && !token) {
    const url = request.nextUrl.clone();
    url.pathname = "/login_page";
    return NextResponse.redirect(url);
  }

  if (isLoginPage && token) {
    const url = request.nextUrl.clone();
    url.pathname = "/dashboard";
    return NextResponse.redirect(url);
  }

  return NextResponse.next();
}

export const config = {
  matcher: ["/", "/dashboard/:path*", "/login_page", "/api/:path*"],
};
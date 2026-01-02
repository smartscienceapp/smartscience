import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";

export function proxy(request: NextRequest) {
  const token = request.cookies.get("token")?.value;
  const { pathname } = request.nextUrl;

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
  matcher: ["/", "/dashboard/:path*", "/login_page"],
};
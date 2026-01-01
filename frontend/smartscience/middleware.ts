import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";

export function middleware(request: NextRequest) {
  // 1. Ambil token manual yang Anda set di frontend
  const token = request.cookies.get("token")?.value;

  const isDashboardPage = request.nextUrl.pathname.startsWith("/dashboard");
  const isLoginPage = request.nextUrl.pathname === "/login_page";

  // 2. Logika Redirect Sederhana
  
  // Jika mau masuk dashboard tapi TIDAK punya token -> tendang ke login
  if (isDashboardPage && !token) {
    const url = request.nextUrl.clone();
    url.pathname = "/login_page";
    return NextResponse.redirect(url);
  }

  // Jika sudah punya token tapi mau masuk login page -> lempar ke dashboard
  if (isLoginPage && token) {
    const url = request.nextUrl.clone();
    url.pathname = "/dashboard";
    return NextResponse.redirect(url);
  }

  return NextResponse.next();
}

export const config = {
  matcher: ["/dashboard/:path*", "/login_page"],
};
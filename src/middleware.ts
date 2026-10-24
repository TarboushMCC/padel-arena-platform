import { getToken } from "next-auth/jwt";
import { NextResponse, type NextRequest } from "next/server";

const customerPaths = ["/account"];
const adminPaths = ["/admin", "/api/admin"];

export async function middleware(request: NextRequest) {
  const pathname = request.nextUrl.pathname;
  const isCustomerPath = customerPaths.some((path) => pathname.startsWith(path));
  const isAdminPath = adminPaths.some((path) => pathname.startsWith(path));

  if (!isCustomerPath && !isAdminPath) {
    return NextResponse.next();
  }

  const token = await getToken({ req: request, secret: process.env.NEXTAUTH_SECRET });

  if (!token) {
    const loginUrl = new URL("/login", request.url);
    loginUrl.searchParams.set("callbackUrl", pathname);
    return NextResponse.redirect(loginUrl);
  }

  if (isAdminPath && token.role !== "admin") {
    return NextResponse.redirect(new URL("/", request.url));
  }

  return NextResponse.next();
}

export const config = {
  matcher: ["/account/:path*", "/admin/:path*", "/api/admin/:path*"]
};

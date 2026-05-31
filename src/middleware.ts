import { withAuth } from "next-auth/middleware";
import { NextResponse } from "next/server";

export default withAuth(
  function middleware(req) {
    // Admin only routes protection
    if (
      (req.nextUrl.pathname.startsWith("/accounts") || req.nextUrl.pathname.startsWith("/inventory")) &&
      req.nextauth.token?.role !== "ADMIN"
    ) {
      return NextResponse.redirect(new URL("/", req.url));
    }
  },
  {
    callbacks: {
      authorized: ({ token }) => !!token,
    },
    pages: {
      signIn: '/login',
    },
  }
);

export const config = {
  matcher: [
    "/",
    "/orders",
    "/inventory",
    "/accounts",
    "/api/categories/:path*",
    "/api/products/:path*",
    "/api/orders/:path*",
  ],
};

import { NextResponse, type NextRequest } from "next/server";

// Sends visitors without a session cookie to the login page. The API still checks
// every request, so an expired cookie gets past here but is caught on the first call.
export function proxy(request: NextRequest) {
  const { pathname } = request.nextUrl;
  if (pathname === "/login" || request.cookies.has("session")) {
    return NextResponse.next();
  }
  const loginUrl = new URL("/login", request.url);
  if (pathname !== "/") {
    loginUrl.searchParams.set("next", pathname);
  }
  return NextResponse.redirect(loginUrl);
}

export const config = {
  matcher: ["/((?!api|_next/static|_next/image|.*\\..*).*)"],
};

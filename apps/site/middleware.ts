import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";

// The site is fully localized under /en and /ar. The bare root simply
// redirects to the English locale (search engines index /en and /ar directly).
export function middleware(request: NextRequest) {
  return NextResponse.redirect(new URL("/en", request.url));
}

export const config = {
  // Only run on the exact root path.
  matcher: ["/"],
};

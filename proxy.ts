import type { NextRequest } from "next/server";
import { updateSession } from "@/lib/auth/proxy-session";

/**
 * Next.js 16 proxy (formerly `middleware`). Gates every request on the
 * local signed session cookie.
 */
export async function proxy(request: NextRequest) {
  return updateSession(request);
}

export const config = {
  matcher: [
    // Everything except Next internals and static assets.
    "/((?!_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp)$).*)",
  ],
};

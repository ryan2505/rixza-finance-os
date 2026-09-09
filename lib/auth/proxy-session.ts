import { NextResponse, type NextRequest } from "next/server";
import { SESSION_COOKIE } from "./config";
import { verifySessionToken } from "./session";

/**
 * Runs on every matched request. Verifies the local signed session cookie;
 * page requests without it are redirected to `/login`, API requests get a
 * 401. `/login` and `/api/auth/*` are always public.
 */
export async function updateSession(request: NextRequest): Promise<NextResponse> {
  const response = NextResponse.next({ request });
  const { pathname } = request.nextUrl;

  const isPublic =
    pathname === "/login" ||
    pathname.startsWith("/api/auth") ||
    pathname.startsWith("/auth");
  const isApi = pathname.startsWith("/api");

  const user = await verifySessionToken(request.cookies.get(SESSION_COOKIE)?.value);
  const authed = !!user;

  if (!authed && !isPublic) {
    if (isApi) {
      return NextResponse.json({ error: "Non authentifié." }, { status: 401 });
    }
    const url = request.nextUrl.clone();
    url.pathname = "/login";
    url.search = pathname === "/" ? "" : `?next=${encodeURIComponent(pathname)}`;
    return NextResponse.redirect(url);
  }

  if (authed && pathname === "/login") {
    const url = request.nextUrl.clone();
    url.pathname = "/command-center";
    url.search = "";
    return NextResponse.redirect(url);
  }

  return response;
}

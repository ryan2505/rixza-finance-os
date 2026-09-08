import { NextResponse, type NextRequest } from "next/server";
import { createServerClient, type CookieOptions } from "@supabase/ssr";
import { supabaseConfigured } from "./env";

type CookieToSet = { name: string; value: string; options?: CookieOptions };
import { SESSION_COOKIE } from "@/lib/auth/config";
import { verifySessionToken } from "@/lib/auth/session";

/**
 * Runs on every matched request.
 *
 *  - Supabase configured  → refresh the auth session, gate on the Supabase user.
 *  - Seed mode            → gate on the local signed session cookie.
 *
 * Page requests without a session are redirected to `/login`; API requests
 * get a 401. `/login` and `/api/auth/*` are always public.
 */
export async function updateSession(request: NextRequest): Promise<NextResponse> {
  const response = NextResponse.next({ request });
  const { pathname } = request.nextUrl;

  const isPublic =
    pathname === "/login" ||
    pathname.startsWith("/api/auth") ||
    pathname.startsWith("/auth");
  const isApi = pathname.startsWith("/api");

  let authed = false;

  if (supabaseConfigured) {
    const supabase = createServerClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
      {
        cookies: {
          getAll() {
            return request.cookies.getAll();
          },
          setAll(cookiesToSet: CookieToSet[]) {
            for (const { name, value, options } of cookiesToSet) {
              response.cookies.set({ name, value, ...options });
            }
          },
        },
      },
    );
    const {
      data: { user },
    } = await supabase.auth.getUser();
    authed = !!user;
  } else {
    const user = await verifySessionToken(request.cookies.get(SESSION_COOKIE)?.value);
    authed = !!user;
  }

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

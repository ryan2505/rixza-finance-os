import { NextResponse } from "next/server";
import {
  findLocalUser,
  SESSION_COOKIE,
  SESSION_MAX_AGE,
  sessionCookieOptions,
} from "@/lib/auth/config";
import { createSessionToken } from "@/lib/auth/session";
import { supabaseConfigured } from "@/lib/supabase/env";

export async function POST(request: Request) {
  if (supabaseConfigured) {
    return NextResponse.json(
      { error: "Authentification Supabase active — utilisez ce flux." },
      { status: 400 },
    );
  }

  const body = (await request.json().catch(() => null)) as
    | { email?: unknown; password?: unknown }
    | null;

  const email = typeof body?.email === "string" ? body.email : "";
  const password = typeof body?.password === "string" ? body.password : "";

  if (!email || !password) {
    return NextResponse.json({ error: "Identifiants manquants." }, { status: 400 });
  }

  const user = findLocalUser(email, password);
  if (!user) {
    return NextResponse.json(
      { error: "E-mail ou mot de passe incorrect." },
      { status: 401 },
    );
  }

  const token = await createSessionToken(
    { email: user.email, name: user.name, role: user.role },
    SESSION_MAX_AGE,
  );

  const response = NextResponse.json({
    ok: true,
    user: { email: user.email, name: user.name, role: user.role },
  });
  response.cookies.set(SESSION_COOKIE, token, sessionCookieOptions(request));
  return response;
}

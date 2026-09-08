import "server-only";

import { cookies } from "next/headers";
import { supabaseConfigured } from "@/lib/supabase/env";
import { SESSION_COOKIE } from "./config";
import { verifySessionToken, type SessionUser } from "./session";

/** The signed-in user for the current request, or null. Works in both modes. */
export async function getCurrentUser(): Promise<SessionUser | null> {
  if (supabaseConfigured) {
    const { createClient } = await import("@/lib/supabase/server");
    const supabase = await createClient();
    const { data } = await supabase.auth.getUser();
    if (!data.user) return null;
    return {
      email: data.user.email ?? "",
      name:
        (data.user.user_metadata?.full_name as string | undefined) ??
        data.user.email ??
        "Utilisateur",
      role: "OWNER",
    };
  }

  const store = await cookies();
  return verifySessionToken(store.get(SESSION_COOKIE)?.value);
}

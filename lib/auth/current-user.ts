import "server-only";

import { cookies } from "next/headers";
import { SESSION_COOKIE } from "./config";
import { verifySessionToken, type SessionUser } from "./session";

/** The signed-in user for the current request, or null. */
export async function getCurrentUser(): Promise<SessionUser | null> {
  const store = await cookies();
  return verifySessionToken(store.get(SESSION_COOKIE)?.value);
}

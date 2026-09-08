import type { Role } from "@/lib/finance/types";

/**
 * Local credential auth — used when Supabase is not configured so the app
 * still requires sign-in. Credentials come from environment variables with
 * sensible development defaults.
 *
 *   APP_AUTH_USERS   "email:password:role,email:password:role"
 *   APP_AUTH_EMAIL / APP_AUTH_PASSWORD / APP_AUTH_NAME   single-user shortcut
 *   APP_SESSION_SECRET   HMAC secret for the session cookie
 */

export interface LocalUser {
  email: string;
  password: string;
  name: string;
  role: Role;
}

/** Comptes fournis par défaut (aucune variable d'environnement définie). */
const DEFAULT_USERS: LocalUser[] = [
  {
    email: "owner@rixza.local",
    password: "rixza",
    name: "Direction RIXZA",
    role: "OWNER",
  },
  {
    email: "admin@rixza.local",
    password: "rixza",
    name: "Administration RIXZA",
    role: "ADMIN",
  },
  {
    email: "viewer@rixza.local",
    password: "rixza",
    name: "Consultation RIXZA",
    role: "VIEWER",
  },
];

const ROLES: Role[] = ["OWNER", "ADMIN", "FINANCE", "MANAGER", "VIEWER"];

function normaliseRole(value: string | undefined): Role {
  const upper = value?.trim().toUpperCase() as Role | undefined;
  return upper && ROLES.includes(upper) ? upper : "VIEWER";
}

export function getLocalUsers(): LocalUser[] {
  const raw = process.env.APP_AUTH_USERS?.trim();
  if (raw) {
    const users = raw
      .split(",")
      .map((entry) => entry.trim())
      .filter(Boolean)
      .map((entry) => {
        const [email, password, role] = entry.split(":");
        return {
          email: email?.trim().toLowerCase() ?? "",
          password: password ?? "",
          name: email?.split("@")[0] ?? "Utilisateur",
          role: normaliseRole(role),
        } satisfies LocalUser;
      })
      .filter((u) => u.email && u.password);
    if (users.length > 0) return users;
  }

  const email = process.env.APP_AUTH_EMAIL?.trim().toLowerCase();
  const password = process.env.APP_AUTH_PASSWORD;
  if (email && password) {
    const explicit = process.env.APP_AUTH_ROLE?.trim();
    return [
      {
        email,
        password,
        name: process.env.APP_AUTH_NAME?.trim() || email.split("@")[0],
        role: explicit ? normaliseRole(explicit) : "OWNER",
      },
    ];
  }

  return DEFAULT_USERS;
}

export function findLocalUser(email: string, password: string): LocalUser | null {
  const target = email.trim().toLowerCase();
  return (
    getLocalUsers().find((u) => u.email === target && u.password === password) ?? null
  );
}

/** True when this role may create / edit / delete financial data. */
export function canEditFinancials(role: Role | undefined): boolean {
  return role === "OWNER" || role === "ADMIN" || role === "FINANCE";
}

export const ROLE_LABELS: Record<Role, string> = {
  OWNER: "Propriétaire — accès complet",
  ADMIN: "Administrateur — saisie et gestion financière",
  FINANCE: "Finance — saisie financière",
  MANAGER: "Manager — tableaux de bord en lecture",
  VIEWER: "Lecture seule",
};

export function getSessionSecret(): string {
  return (
    process.env.APP_SESSION_SECRET?.trim() || "rixza-dev-session-secret-change-me"
  );
}

export const SESSION_COOKIE = "rixza_session";
export const SESSION_MAX_AGE = 60 * 60 * 24 * 7; // 7 days

/**
 * `secure` cookies are only sent back over HTTPS. Follow the request's
 * actual protocol so the app works over plain HTTP on a LAN too.
 */
export function requestIsHttps(request: Request): boolean {
  const forwarded = request.headers.get("x-forwarded-proto");
  if (forwarded) return forwarded.split(",")[0].trim() === "https";
  try {
    return new URL(request.url).protocol === "https:";
  } catch {
    return false;
  }
}

export function sessionCookieOptions(request: Request) {
  return {
    httpOnly: true,
    sameSite: "lax" as const,
    secure: requestIsHttps(request),
    path: "/",
    maxAge: SESSION_MAX_AGE,
  };
}

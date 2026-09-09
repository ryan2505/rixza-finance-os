import { Suspense } from "react";
import { getLocalUsers, ROLE_LABELS } from "@/lib/auth/config";
import { LoginForm } from "./login-form";

export const metadata = { title: "Connexion" };

export default function LoginPage() {
  const usingDefaults = !process.env.APP_AUTH_USERS && !process.env.APP_AUTH_EMAIL;
  const accounts = usingDefaults ? getLocalUsers() : [];

  return (
    <div className="flex min-h-dvh items-center justify-center bg-bg px-6">
      <div className="w-full max-w-sm">
        <div className="mb-8 flex items-center gap-2.5">
          <span className="flex size-7 items-center justify-center rounded-md bg-accent text-sm font-bold text-accent-fg">
            R
          </span>
          <span className="text-sm font-semibold tracking-tight text-ink">
            RIXZA Finance OS
          </span>
        </div>

        <h1 className="text-xl font-semibold tracking-tight text-ink">Connexion</h1>
        <p className="mt-1 text-sm text-ink-2">Accès réservé à la direction de RIXZA.</p>

        <div className="mt-6">
          <Suspense fallback={<div className="h-44" />}>
            <LoginForm />
          </Suspense>
        </div>

        {accounts.length > 0 ? (
          <div className="mt-5 rounded-md border border-border bg-surface-2 px-3 py-2.5 text-xs text-ink-2">
            <p className="mb-1.5 font-medium text-ink">Comptes par défaut</p>
            <ul className="space-y-1">
              {accounts.map((a) => (
                <li key={a.email} className="flex flex-wrap gap-x-2">
                  <span className="font-medium text-ink">{a.email}</span>
                  <span className="text-ink-3">/ {a.password}</span>
                  <span className="text-ink-3">— {ROLE_LABELS[a.role].split(" — ")[0]}</span>
                </li>
              ))}
            </ul>
            <p className="mt-2 text-ink-3">
              Personnalisez avec <code>APP_AUTH_USERS</code> et{" "}
              <code>APP_SESSION_SECRET</code>.
            </p>
          </div>
        ) : null}
      </div>
    </div>
  );
}

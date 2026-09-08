"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { navGroups, navItems } from "./nav-items";
import { cn } from "@/lib/utils";

export function Sidebar({ canEdit }: { canEdit: boolean }) {
  const pathname = usePathname();
  const visible = navItems.filter((i) => canEdit || !i.editorsOnly);

  return (
    <aside className="hidden w-60 shrink-0 flex-col border-r border-border bg-surface lg:flex">
      <div className="flex h-14 items-center gap-2.5 border-b border-border px-5">
        <span className="flex size-6 items-center justify-center rounded-md bg-accent text-[13px] font-bold text-accent-fg">
          R
        </span>
        <span className="text-sm font-semibold tracking-tight text-ink">
          RIXZA Finance OS
        </span>
      </div>

      <nav className="flex-1 space-y-6 overflow-y-auto px-3 py-5">
        {navGroups.map((group) => {
          const items = visible.filter((i) => i.group === group.id);
          if (items.length === 0) return null;
          return (
            <div key={group.id}>
              <p className="px-2 pb-1.5 text-[11px] font-semibold tracking-wide text-ink-3 uppercase">
                {group.label}
              </p>
              <ul className="space-y-0.5">
                {items.map((item) => {
                  const active =
                    pathname === item.href || pathname.startsWith(`${item.href}/`);
                  return (
                    <li key={item.href}>
                      <Link
                        href={item.href}
                        aria-current={active ? "page" : undefined}
                        className={cn(
                          "flex items-center justify-between rounded-md px-2 py-1.5 text-[13px] transition-colors",
                          active
                            ? "bg-accent-soft font-medium text-accent"
                            : "text-ink-2 hover:bg-surface-2 hover:text-ink",
                        )}
                      >
                        <span>{item.label}</span>
                      </Link>
                    </li>
                  );
                })}
              </ul>
            </div>
          );
        })}
      </nav>

      <div className="border-t border-border px-5 py-3">
        <p className="text-[11px] text-ink-3">
          Connaissez vos chiffres. Pilotez votre activité.
        </p>
      </div>
    </aside>
  );
}

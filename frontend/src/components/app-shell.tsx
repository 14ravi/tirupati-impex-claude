"use client";

import { LayoutDashboard, LogOut, Mail, Settings, Users, Workflow } from "lucide-react";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { createContext, use, useEffect, useState, type ReactNode } from "react";
import { api, type User } from "@/lib/api";
import { APP_NAME } from "@/lib/brand";

const NAV = [
  { href: "/", label: "Dashboard", icon: LayoutDashboard },
  { href: "/workflows", label: "Workflows", icon: Workflow },
  { href: "/leads", label: "Leads", icon: Users },
  { href: "/emails", label: "Emails", icon: Mail },
  { href: "/settings", label: "Settings", icon: Settings },
];

const UserContext = createContext<User | null>(null);

/** The signed-in user, or null while it is still loading. */
export function useUser() {
  return use(UserContext);
}

export function AppShell({ children }: { children: ReactNode }) {
  const pathname = usePathname();
  const router = useRouter();
  const [user, setUser] = useState<User | null>(null);

  useEffect(() => {
    // A 401 here sends the browser to /login (see lib/api.ts).
    api<User>("/auth/me").then(setUser, () => {});
  }, []);

  async function logout() {
    await api("/auth/logout", { method: "POST" }).catch(() => {});
    router.replace("/login");
  }

  return (
    <UserContext value={user}>
      <div className="flex min-h-screen">
        <aside className="sticky top-0 flex h-screen w-56 shrink-0 flex-col border-r border-line bg-surface">
          <div className="flex h-14 items-center gap-2.5 border-b border-line px-4">
            <div className="flex size-7 shrink-0 items-center justify-center rounded-md bg-accent text-on-accent">
              <Workflow className="size-4" aria-hidden />
            </div>
            <span className="truncate text-sm font-semibold">{user?.agency.name ?? APP_NAME}</span>
          </div>

          <nav className="flex-1 space-y-0.5 p-2" aria-label="Main">
            {NAV.map(({ href, label, icon: Icon }) => {
              const active = href === "/" ? pathname === "/" : pathname.startsWith(href);
              return (
                <Link
                  key={href}
                  href={href}
                  aria-current={active ? "page" : undefined}
                  className={`flex h-9 items-center gap-2.5 rounded-md px-2.5 text-sm transition-colors ${
                    active ? "bg-subtle font-medium text-fg" : "text-muted hover:bg-subtle hover:text-fg"
                  }`}
                >
                  <Icon className="size-4" aria-hidden />
                  {label}
                </Link>
              );
            })}
          </nav>

          <div className="border-t border-line p-2">
            <div className="min-h-12 px-2.5 py-2">
              {user && (
                <>
                  <p className="truncate text-sm font-medium">{user.full_name}</p>
                  <p className="truncate text-xs text-muted">
                    <span className="capitalize">{user.role}</span> · {user.email}
                  </p>
                </>
              )}
            </div>
            <button
              type="button"
              onClick={logout}
              className="flex h-9 w-full cursor-pointer items-center gap-2.5 rounded-md px-2.5 text-sm text-muted transition-colors hover:bg-subtle hover:text-fg"
            >
              <LogOut className="size-4" aria-hidden />
              Log out
            </button>
          </div>
        </aside>

        <main className="min-w-0 flex-1">{children}</main>
      </div>
    </UserContext>
  );
}

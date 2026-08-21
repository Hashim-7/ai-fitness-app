"use client";

import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { ReactNode, useEffect } from "react";
import { clearToken, getToken } from "../../lib/api";

const navigation = [
  {
    href: "/dashboard",
    label: "Overview",
  },
  {
    href: "/dashboard/nutrition",
    label: "Nutrition",
  },
  {
    href: "/dashboard/workouts",
    label: "Workouts",
  },
];

export default function DashboardLayout({
  children,
}: {
  children: ReactNode;
}) {
  const pathname = usePathname();
  const router = useRouter();

  useEffect(() => {
    if (!getToken()) {
      router.replace("/login");
    }
  }, [router]);

  function handleLogout() {
    clearToken();
    router.replace("/login");
  }

  return (
    <div className="min-h-screen bg-zinc-50">
      <header className="border-b border-zinc-200 bg-white">
        <div className="mx-auto flex max-w-7xl items-center justify-between px-4 py-4 md:px-8">
          <Link
            href="/dashboard"
            className="text-xl font-bold tracking-tight text-zinc-950"
          >
            NutriTrack
          </Link>

          <button
            type="button"
            onClick={handleLogout}
            className="rounded-lg px-3 py-2 text-sm font-medium text-zinc-600 transition hover:bg-zinc-100 hover:text-zinc-950"
          >
            Log out
          </button>
        </div>
      </header>

      <div className="mx-auto flex max-w-7xl">
        <aside className="hidden w-56 shrink-0 border-r border-zinc-200 bg-white md:block">
          <nav className="space-y-1 p-4">
            {navigation.map((item) => {
              const active =
                item.href === "/dashboard"
                  ? pathname === "/dashboard"
                  : pathname.startsWith(item.href);

              return (
                <Link
                  key={item.href}
                  href={item.href}
                  className={`block rounded-lg px-3 py-2.5 text-sm font-medium transition ${
                    active
                      ? "bg-zinc-900 text-white"
                      : "text-zinc-600 hover:bg-zinc-100 hover:text-zinc-950"
                  }`}
                >
                  {item.label}
                </Link>
              );
            })}
          </nav>
        </aside>

        <main className="min-w-0 flex-1 p-4 md:p-8">
          {children}
        </main>
      </div>
    </div>
  );
}

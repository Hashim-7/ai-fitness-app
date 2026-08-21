"use client";

import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { ReactNode, useEffect } from "react";
import { clearToken, getToken } from "../../lib/api";
import { ThemeToggle } from "../../components/ThemeToggle";

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
    <div className="min-h-screen bg-slate-50 text-slate-900 transition-colors dark:bg-zinc-950 dark:text-zinc-100">
      <header className="border-b border-zinc-200 bg-white/80 backdrop-blur-md dark:border-zinc-800 dark:bg-zinc-900/80 sticky top-0 z-40">
        <div className="mx-auto flex max-w-7xl items-center justify-between px-4 py-3.5 md:px-8">
          <Link
            href="/dashboard"
            className="flex items-center gap-2 text-xl font-extrabold tracking-tight text-zinc-950 dark:text-white"
          >
            <span className="flex h-8 w-8 items-center justify-center rounded-xl bg-indigo-600 text-white font-bold text-base shadow-md shadow-indigo-500/30">
              N
            </span>
            <span>NutriTrack</span>
          </Link>

          <div className="flex items-center gap-3">
            <ThemeToggle />

            <button
              type="button"
              onClick={handleLogout}
              className="rounded-xl px-3.5 py-2 text-xs font-semibold text-zinc-600 transition hover:bg-zinc-100 hover:text-zinc-950 dark:text-zinc-400 dark:hover:bg-zinc-800 dark:hover:text-zinc-100"
            >
              Log out
            </button>
          </div>
        </div>
      </header>

      <div className="mx-auto flex max-w-7xl">
        <aside className="hidden w-60 shrink-0 border-r border-zinc-200 bg-white dark:border-zinc-800 dark:bg-zinc-900 md:block min-h-[calc(100vh-61px)]">
          <nav className="space-y-1.5 p-4 sticky top-20">
            {navigation.map((item) => {
              const active =
                item.href === "/dashboard"
                  ? pathname === "/dashboard"
                  : pathname.startsWith(item.href);

              return (
                <Link
                  key={item.href}
                  href={item.href}
                  className={`flex items-center gap-2.5 rounded-xl px-3.5 py-2.5 text-xs font-bold transition ${
                    active
                      ? "bg-zinc-900 text-white shadow-md dark:bg-zinc-100 dark:text-zinc-900"
                      : "text-zinc-600 hover:bg-zinc-100 hover:text-zinc-950 dark:text-zinc-400 dark:hover:bg-zinc-800 dark:hover:text-zinc-100"
                  }`}
                >
                  {item.label}
                </Link>
              );
            })}
          </nav>
        </aside>

        {/* Mobile Navigation bar */}
        <div className="fixed bottom-0 left-0 right-0 z-40 border-t border-zinc-200 bg-white/90 p-2 backdrop-blur-md dark:border-zinc-800 dark:bg-zinc-900/90 md:hidden flex justify-around">
          {navigation.map((item) => {
            const active =
              item.href === "/dashboard"
                ? pathname === "/dashboard"
                : pathname.startsWith(item.href);

            return (
              <Link
                key={item.href}
                href={item.href}
                className={`rounded-lg px-4 py-2 text-xs font-bold transition ${
                  active
                    ? "bg-zinc-900 text-white dark:bg-zinc-100 dark:text-zinc-900"
                    : "text-zinc-600 dark:text-zinc-400"
                }`}
              >
                {item.label}
              </Link>
            );
          })}
        </div>

        <main className="min-w-0 flex-1 p-4 pb-20 md:p-8 md:pb-8">
          {children}
        </main>
      </div>
    </div>
  );
}

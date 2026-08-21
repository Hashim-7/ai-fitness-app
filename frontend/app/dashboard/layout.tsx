import Link from "next/link";

export default function DashboardLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <div className="min-h-screen bg-zinc-50 text-zinc-950">
      <div className="flex min-h-screen">
        <aside className="hidden w-64 border-r border-zinc-200 bg-white md:flex md:flex-col">
          <div className="flex h-16 items-center border-b border-zinc-200 px-6">
            <Link
              href="/dashboard"
              className="text-xl font-bold tracking-tight"
            >
              NutriTrack
            </Link>
          </div>

          <nav className="flex flex-1 flex-col gap-1 p-4">
            <NavLink href="/dashboard">Dashboard</NavLink>
            <NavLink href="/dashboard/workouts">Workouts</NavLink>
            <NavLink href="/dashboard/nutrition">Nutrition</NavLink>
          </nav>
        </aside>

        <div className="flex min-w-0 flex-1 flex-col">
          <header className="flex h-16 items-center justify-between border-b border-zinc-200 bg-white px-4 md:px-8">
            <div className="md:hidden">
              <span className="font-bold">NutriTrack</span>
            </div>

            <div className="ml-auto flex items-center gap-3">
              <div className="flex h-9 w-9 items-center justify-center rounded-full bg-zinc-900 text-sm font-semibold text-white">
                U
              </div>

              <span className="hidden text-sm font-medium sm:block">User</span>
            </div>
          </header>

          <main className="flex-1 p-4 md:p-8">{children}</main>
        </div>
      </div>
    </div>
  );
}

function NavLink({
  href,
  children,
}: {
  href: string;
  children: React.ReactNode;
}) {
  return (
    <Link
      href={href}
      className="rounded-lg px-3 py-2.5 text-sm font-medium text-zinc-600 transition hover:bg-zinc-100 hover:text-zinc-950"
    >
      {children}
    </Link>
  );
}

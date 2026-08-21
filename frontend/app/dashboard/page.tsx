const stats = [
  {
    label: "Calories",
    value: "—",
    target: "—",
    unit: "kcal",
  },
  {
    label: "Protein",
    value: "—",
    target: "—",
    unit: "g",
  },
  {
    label: "Carbs",
    value: "—",
    target: "—",
    unit: "g",
  },
  {
    label: "Fat",
    value: "—",
    target: "—",
    unit: "g",
  },
];

const meals = [
  {
    name: "Breakfast",
    description: "No food logged",
  },
  {
    name: "Lunch",
    description: "No food logged",
  },
  {
    name: "Dinner",
    description: "No food logged",
  },
  {
    name: "Snacks",
    description: "No food logged",
  },
];

export default function DashboardPage() {
  return (
    <div className="mx-auto max-w-7xl">
      <div className="mb-8">
        <h1 className="text-2xl font-bold tracking-tight md:text-3xl">
          Dashboard
        </h1>

        <p className="mt-1 text-sm text-zinc-500">
          Keep track of your nutrition and daily progress.
        </p>
      </div>

      <section className="mb-8 grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        {stats.map((stat) => (
          <div
            key={stat.label}
            className="rounded-xl border border-zinc-200 bg-white p-5"
          >
            <p className="text-sm font-medium text-zinc-500">{stat.label}</p>

            <div className="mt-3 flex items-baseline gap-1">
              <span className="text-2xl font-bold">{stat.value}</span>
              <span className="text-sm text-zinc-500">{stat.unit}</span>
            </div>

            <p className="mt-2 text-xs text-zinc-400">
              Target: {stat.target} {stat.unit}
            </p>
          </div>
        ))}
      </section>

      <section>
        <div className="mb-4 flex items-center justify-between">
          <div>
            <h2 className="text-lg font-semibold">Today's meals</h2>
            <p className="text-sm text-zinc-500">
              Your meals for today will appear here.
            </p>
          </div>
        </div>

        <div className="grid gap-4 sm:grid-cols-2">
          {meals.map((meal) => (
            <div
              key={meal.name}
              className="rounded-xl border border-zinc-200 bg-white p-5"
            >
              <div className="flex items-center justify-between">
                <h3 className="font-semibold">{meal.name}</h3>

                <span className="rounded-full bg-zinc-100 px-2.5 py-1 text-xs font-medium text-zinc-500">
                  0 kcal
                </span>
              </div>

              <p className="mt-3 text-sm text-zinc-500">{meal.description}</p>
            </div>
          ))}
        </div>
      </section>
    </div>
  );
}

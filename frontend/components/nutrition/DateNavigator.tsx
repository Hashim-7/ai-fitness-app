import { addDays, formatDisplayDate, isToday, today } from "../../lib/nutrition/utils";

type DateNavigatorProps = {
  selectedDate: string;
  onDateChange: (date: string) => void;
  onOpenHistory: () => void;
  copying?: boolean;
  onCopyPreviousDay?: () => void;
};

export function DateNavigator({
  selectedDate,
  onDateChange,
  onOpenHistory,
  copying = false,
  onCopyPreviousDay,
}: DateNavigatorProps) {
  const isSelectedToday = isToday(selectedDate);

  return (
    <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
      <div className="flex items-center gap-2">
        <button
          type="button"
          onClick={() => onDateChange(addDays(selectedDate, -1))}
          aria-label="Previous day"
          className="rounded-lg border border-zinc-200 px-3 py-2 text-sm font-semibold text-zinc-700 hover:bg-zinc-50"
        >
          ←
        </button>

        <input
          type="date"
          value={selectedDate}
          max={today()}
          onChange={(event) => {
            if (event.target.value) {
              onDateChange(event.target.value);
            }
          }}
          className="rounded-lg border border-zinc-200 px-3 py-2 text-sm outline-none focus:border-zinc-900"
        />

        <button
          type="button"
          onClick={() => onDateChange(addDays(selectedDate, 1))}
          disabled={isSelectedToday}
          aria-label="Next day"
          className="rounded-lg border border-zinc-200 px-3 py-2 text-sm font-semibold text-zinc-700 hover:bg-zinc-50 disabled:cursor-not-allowed disabled:opacity-40"
        >
          →
        </button>

        {!isSelectedToday && (
          <button
            type="button"
            onClick={() => onDateChange(today())}
            className="rounded-lg border border-zinc-200 px-3 py-2 text-sm font-medium text-zinc-700 hover:bg-zinc-50"
          >
            Today
          </button>
        )}
      </div>

      <div className="flex flex-wrap items-center gap-2">
        {onCopyPreviousDay && (
          <button
            type="button"
            onClick={onCopyPreviousDay}
            disabled={copying}
            className="rounded-lg border border-zinc-200 px-3 py-2 text-sm font-medium text-zinc-700 hover:bg-zinc-50 disabled:opacity-50"
          >
            {copying ? "Copying..." : "Copy previous day"}
          </button>
        )}

        <button
          type="button"
          onClick={onOpenHistory}
          className="rounded-lg border border-zinc-200 px-3 py-2 text-sm font-medium text-zinc-700 hover:bg-zinc-50"
        >
          History
        </button>
      </div>

      <p className="text-sm text-zinc-500 sm:sr-only">
        {isSelectedToday ? "Today" : formatDisplayDate(selectedDate)}
      </p>
    </div>
  );
}

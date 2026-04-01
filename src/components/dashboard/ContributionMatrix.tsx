import { Fragment, useMemo } from 'react';

interface SimulationPoint {
  created_at: string | null;
}

const DAY_LABELS = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'];

function startOfWeek(date: Date) {
  const clone = new Date(date);
  const day = (clone.getDay() + 6) % 7;
  clone.setDate(clone.getDate() - day);
  clone.setHours(0, 0, 0, 0);
  return clone;
}

export function ContributionMatrix({ simulations }: { simulations: SimulationPoint[] }) {
  const weeks = useMemo(() => {
    const today = new Date();
    const currentWeekStart = startOfWeek(today);

    return Array.from({ length: 10 }, (_, weekIndex) => {
      const weekStart = new Date(currentWeekStart);
      weekStart.setDate(currentWeekStart.getDate() - (9 - weekIndex) * 7);

      return Array.from({ length: 7 }, (_, dayIndex) => {
        const date = new Date(weekStart);
        date.setDate(weekStart.getDate() + dayIndex);
        const dayCount = simulations.filter((simulation) => {
          if (!simulation.created_at) return false;
          const created = new Date(simulation.created_at);
          return created.toDateString() === date.toDateString();
        }).length;

        return {
          key: `${weekIndex}-${dayIndex}`,
          label: `${DAY_LABELS[dayIndex]} ${date.toLocaleDateString('en-IN', { day: 'numeric', month: 'short' })}`,
          count: dayCount,
        };
      });
    });
  }, [simulations]);

  const levelClass = (count: number) => {
    if (count === 0) return 'bg-muted/60';
    if (count === 1) return 'bg-primary/30';
    if (count <= 3) return 'bg-primary/50';
    if (count <= 5) return 'bg-primary/70';
    return 'bg-primary';
  };

  return (
    <div className="space-y-3">
      <div className="overflow-x-auto">
        <div className="grid min-w-[520px] grid-cols-[auto_repeat(10,minmax(0,1fr))] gap-2">
          <div />
          {weeks.map((_, weekIndex) => (
            <span key={weekIndex} className="text-center text-[10px] text-muted-foreground">
              W{weekIndex + 1}
            </span>
          ))}

          {DAY_LABELS.map((day, dayIndex) => (
            <Fragment key={day}>
              <span key={`${day}-label`} className="pr-2 text-[10px] text-muted-foreground">
                {day}
              </span>
              {weeks.map((week) => {
                const cell = week[dayIndex];
                return (
                  <div
                    key={cell.key}
                    title={`${cell.label}: ${cell.count} simulations`}
                    className={`h-7 rounded-[10px] border border-border/60 transition-transform duration-200 hover:-translate-y-0.5 ${levelClass(cell.count)}`}
                  />
                );
              })}
            </Fragment>
          ))}
        </div>
      </div>

      <div className="flex items-center justify-end gap-2 text-[10px] text-muted-foreground">
        <span>Lower</span>
        {[0, 1, 3, 5, 7].map((count) => (
          <div key={count} className={`h-3 w-6 rounded-full ${levelClass(count)}`} />
        ))}
        <span>Higher</span>
      </div>
    </div>
  );
}
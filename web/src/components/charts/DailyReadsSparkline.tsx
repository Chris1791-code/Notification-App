interface DayDatum {
  date: string; // yyyy-MM-dd
  value: number;
}

const BAR_COLOR = '#2a78d6';
const BASELINE_COLOR = '#c3c2b7';

export function DailyReadsSparkline({ data }: { data: DayDatum[] }) {
  const maxValue = Math.max(1, ...data.map((d) => d.value));
  const peakIndex = data.reduce((best, d, i) => (d.value > data[best].value ? i : best), 0);

  return (
    <div>
      <div className="flex h-24 items-end gap-1">
        {data.map((d, i) => {
          const heightPct = Math.max(4, (d.value / maxValue) * 100);
          return (
            <div key={d.date} className="group relative flex-1" title={`${d.date}: ${d.value} lượt đọc`}>
              <div
                className="mx-auto w-full max-w-[14px] rounded-t"
                style={{ height: `${heightPct}%`, backgroundColor: BAR_COLOR }}
              />
              {i === peakIndex && d.value > 0 && (
                <span className="pointer-events-none absolute -top-4 left-1/2 -translate-x-1/2 text-[10px] font-medium text-gray-700">
                  {d.value}
                </span>
              )}
            </div>
          );
        })}
      </div>
      <div className="mt-1 border-t" style={{ borderColor: BASELINE_COLOR }} />
      <div className="mt-1 flex justify-between text-[10px] text-gray-400">
        <span>{data[0]?.date}</span>
        <span>{data[data.length - 1]?.date}</span>
      </div>
    </div>
  );
}

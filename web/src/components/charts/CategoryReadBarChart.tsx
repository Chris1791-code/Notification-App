interface BarDatum {
  id: string;
  label: string;
  value: number;
}

const BAR_COLOR = '#2a78d6'; // dataviz skill — sequential blue, step 450 (light mode)
const TRACK_COLOR = '#e1e0d9'; // hairline gray, recessive

export function CategoryReadBarChart({ data }: { data: BarDatum[] }) {
  const maxValue = Math.max(1, ...data.map((d) => d.value));

  return (
    <div role="table" aria-label="Lượt đọc theo danh mục" className="space-y-3">
      {data.map((d) => {
        const widthPct = Math.max(2, (d.value / maxValue) * 100);
        return (
          <div key={d.id} role="row" className="flex items-center gap-3">
            <span role="cell" className="w-36 shrink-0 truncate text-xs text-gray-600" title={d.label}>
              {d.label}
            </span>
            <div role="cell" className="flex-1">
              <div className="h-5 rounded-full" style={{ backgroundColor: TRACK_COLOR }}>
                <div
                  className="h-5 rounded-full transition-[width]"
                  style={{ width: `${widthPct}%`, backgroundColor: BAR_COLOR }}
                />
              </div>
            </div>
            <span role="cell" className="w-10 shrink-0 text-right text-xs font-medium text-gray-900">
              {d.value.toLocaleString('vi-VN')}
            </span>
          </div>
        );
      })}
    </div>
  );
}

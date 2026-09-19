export function CategoryBadge({ label }: { label: string }) {
  return (
    <span className="inline-block rounded-full bg-brand-light px-2.5 py-0.5 text-xs font-medium text-brand-dark">
      {label}
    </span>
  );
}

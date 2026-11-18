export function StatCard({ label, value, icon: Icon, trend }) {
  return (
    <div className="panel flex min-w-0 items-start justify-between gap-2 p-4 sm:p-5">
      <div className="min-w-0">
        <p className="text-sm font-medium text-muted">{label}</p>
        <p className="mt-2 break-words font-display text-2xl font-semibold tracking-tight text-ink tabular-nums sm:text-3xl">{value}</p>
        {trend && <p className="mt-2 text-xs text-muted">{trend}</p>}
      </div>
      {Icon && <span className="grid size-9 shrink-0 place-items-center rounded-lg bg-ivory text-leaf"><Icon aria-hidden="true" /></span>}
    </div>
  );
}

/** Pulsing block used as a placeholder while data loads. */
const Pulse = ({ className = '' }: { className?: string }) => (
  <div className={`animate-pulse rounded bg-secondary-200 ${className}`} />
);

/** Skeleton for a single KPI card. */
export const KpiCardSkeleton = () => (
  <div className="card p-5 space-y-3">
    <Pulse className="h-3 w-24" />
    <Pulse className="h-8 w-32" />
    <Pulse className="h-3 w-20" />
  </div>
);

/** Skeleton for a chart card (title + rectangle). */
export const ChartSkeleton = () => (
  <div className="card p-5 space-y-4">
    <Pulse className="h-4 w-40" />
    <Pulse className="h-64 w-full" />
  </div>
);

/** Skeleton for a table (header row + body rows). */
export const TableSkeleton = ({ rows = 5 }: { rows?: number }) => (
  <div className="card p-5 space-y-3">
    <Pulse className="h-4 w-48 mb-4" />
    <div className="space-y-2">
      <Pulse className="h-8 w-full" />
      {Array.from({ length: rows }).map((_, i) => (
        <Pulse key={i} className="h-6 w-full" />
      ))}
    </div>
  </div>
);

/** Full-page skeleton for the Sales page (7 KPI cards + 2 charts + table). */
export const SalesPageSkeleton = () => (
  <div className="space-y-6">
    {/* KPI row */}
    <div className="grid grid-cols-1 md:grid-cols-4 lg:grid-cols-7 gap-4">
      {Array.from({ length: 7 }).map((_, i) => (
        <KpiCardSkeleton key={i} />
      ))}
    </div>
    {/* Charts row */}
    <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
      <ChartSkeleton />
      <ChartSkeleton />
    </div>
    {/* Table */}
    <TableSkeleton rows={6} />
  </div>
);

/** Full-page skeleton for the Revenue / ARR page (5 KPI cards + 2 retention cards + chart + table). */
export const RevenuePageSkeleton = () => (
  <div className="space-y-6">
    {/* KPI row */}
    <div className="grid grid-cols-1 md:grid-cols-5 gap-4">
      {Array.from({ length: 5 }).map((_, i) => (
        <KpiCardSkeleton key={i} />
      ))}
    </div>
    {/* Retention cards */}
    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
      <div className="card p-5 space-y-3">
        <Pulse className="h-3 w-32" />
        <Pulse className="h-8 w-24" />
        <Pulse className="h-12 w-full" />
      </div>
      <div className="card p-5 space-y-3">
        <Pulse className="h-3 w-32" />
        <Pulse className="h-8 w-24" />
        <Pulse className="h-12 w-full" />
      </div>
    </div>
    {/* Charts row */}
    <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
      <ChartSkeleton />
      <ChartSkeleton />
    </div>
    {/* Table */}
    <TableSkeleton rows={6} />
  </div>
);

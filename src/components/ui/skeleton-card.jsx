import { cn } from '@/lib/utils';

export function StatCardSkeleton({ className }) {
  return (
    <div className={cn('rounded-xl border border-border bg-card p-6 space-y-4', className)}>
      <div className="flex items-center justify-between">
        <div className="space-y-2 flex-1">
          <div className="skeleton h-4 w-24 rounded" />
          <div className="skeleton h-6 w-32 rounded" />
        </div>
        <div className="skeleton h-10 w-10 rounded-full" />
      </div>
    </div>
  );
}

export function ChartSkeleton({ className }) {
  return (
    <div className={cn('rounded-xl border border-border bg-card p-6 space-y-4', className)}>
      <div className="flex items-center justify-between">
        <div className="skeleton h-6 w-32 rounded" />
        <div className="skeleton h-8 w-8 rounded" />
      </div>
      <div className="space-y-3">
        {Array.from({ length: 5 }).map((_, i) => (
          <div key={i} className="space-y-2">
            <div className="flex justify-between">
              <div className="skeleton h-4 w-16 rounded" />
              <div className="skeleton h-4 w-20 rounded" />
            </div>
            <div className="skeleton h-2 w-full rounded" />
          </div>
        ))}
      </div>
    </div>
  );
}

export function TableSkeleton({ rows = 5, className }) {
  return (
    <div className={cn('space-y-3', className)}>
      {Array.from({ length: rows }).map((_, i) => (
        <div key={i} className="flex items-center space-x-4 p-4 border border-border rounded-lg">
          <div className="skeleton h-10 w-10 rounded-full" />
          <div className="flex-1 space-y-2">
            <div className="skeleton h-4 w-3/4 rounded" />
            <div className="skeleton h-3 w-1/2 rounded" />
          </div>
          <div className="skeleton h-4 w-20 rounded" />
          <div className="skeleton h-4 w-16 rounded" />
        </div>
      ))}
    </div>
  );
}

export function DashboardSkeleton({ className }) {
  return (
    <div className={cn('space-y-6', className)}>
      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        {Array.from({ length: 4 }).map((_, i) => (
          <StatCardSkeleton key={i} />
        ))}
      </div>
      
      {/* Charts */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <ChartSkeleton />
        <ChartSkeleton />
      </div>
      
      {/* Table */}
      <TableSkeleton rows={5} />
    </div>
  );
}

export function PageHeaderSkeleton({ className }) {
  return (
    <div className={cn('space-y-4', className)}>
      <div className="space-y-2">
        <div className="skeleton h-8 w-48 rounded" />
        <div className="skeleton h-4 w-96 rounded" />
      </div>
      <div className="flex items-center gap-4">
        <div className="skeleton h-10 w-32 rounded" />
        <div className="skeleton h-10 w-40 rounded" />
      </div>
    </div>
  );
}

export function NavigationSkeleton({ className }) {
  return (
    <div className={cn('flex items-center space-x-4', className)}>
      {Array.from({ length: 5 }).map((_, i) => (
        <div key={i} className="skeleton h-8 w-24 rounded" />
      ))}
    </div>
  );
}

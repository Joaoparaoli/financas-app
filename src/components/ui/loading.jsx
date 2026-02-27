import { cn } from '@/lib/utils';

export function LoadingSpinner({ className, size = 'default' }) {
  const sizeClasses = {
    sm: 'h-4 w-4',
    default: 'h-6 w-6',
    lg: 'h-8 w-8',
    xl: 'h-12 w-12'
  };

  return (
    <div
      className={cn(
        'animate-spin rounded-full border-2 border-primary border-t-transparent',
        sizeClasses[size],
        className
      )}
    />
  );
}

export function LoadingSkeleton({ className, ...props }) {
  return (
    <div
      className={cn('skeleton rounded-md', className)}
      {...props}
    />
  );
}

export function LoadingCard({ className, ...props }) {
  return (
    <div
      className={cn(
        'rounded-xl border border-border bg-card p-6 space-y-4',
        className
      )}
      {...props}
    >
      <div className="space-y-3">
        <LoadingSkeleton className="h-4 w-2/3" />
        <LoadingSkeleton className="h-6 w-1/2" />
      </div>
      <div className="space-y-2">
        <LoadingSkeleton className="h-4 w-full" />
        <LoadingSkeleton className="h-4 w-3/4" />
      </div>
    </div>
  );
}

export function LoadingTable({ rows = 5, className, ...props }) {
  return (
    <div className={cn('space-y-3', className)} {...props}>
      {Array.from({ length: rows }).map((_, i) => (
        <div key={i} className="flex space-x-4">
          <LoadingSkeleton className="h-8 w-8 rounded-full" />
          <LoadingSkeleton className="h-8 flex-1" />
          <LoadingSkeleton className="h-8 w-20" />
          <LoadingSkeleton className="h-8 w-16" />
        </div>
      ))}
    </div>
  );
}

export function FullPageLoading() {
  return (
    <div className="min-h-screen flex items-center justify-center">
      <div className="text-center space-y-4">
        <LoadingSpinner size="xl" />
        <p className="text-muted-foreground">Carregando...</p>
      </div>
    </div>
  );
}

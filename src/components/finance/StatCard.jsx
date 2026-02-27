import { Card, CardContent } from '@/components/ui/card';
import { cn } from '@/lib/utils';

// Splits "R$ 1.234,56" into { symbol: "R$", integer: "1.234", cents: ",56" }
function parseBRL(text) {
  const match = text.match(/^(R\$\s*)([\d.]+)(,\d{2})?$/);
  if (!match) return null;
  return {
    symbol: match[1].trim(),
    integer: match[2],
    cents: match[3] ?? '',
  };
}

function integerFontClass(integer) {
  const len = integer.length;
  if (len <= 3) return 'text-3xl';
  if (len <= 5) return 'text-2xl';
  if (len <= 7) return 'text-xl';
  if (len <= 9) return 'text-lg';
  return 'text-base';
}

export default function StatCard({
  title,
  value,
  icon: Icon,
  className,
  valueClassName,
  trend,
  trendValue,
  loading = false,
}) {
  const valueText = (() => {
    if (typeof value === 'string') return value;
    if (typeof value === 'number') return value.toString();
    if (value && typeof value === 'object' && 'toString' in value) return value.toString();
    return '';
  })();

  const charLength = valueText.replace(/\s/g, '').length || valueText.length;

  const responsiveValueClass = (() => {
    if (charLength <= 6) return 'text-2xl';
    if (charLength <= 10) return 'text-xl';
    if (charLength <= 14) return 'text-lg';
    if (charLength <= 18) return 'text-base';
    return 'text-sm';
  })();

  const letterSpacingClass = (() => {
    if (charLength <= 6) return 'tracking-tight';
    if (charLength <= 10) return 'tracking-[0.01em]';
    if (charLength <= 14) return 'tracking-[0.02em]';
    return 'tracking-[0.04em]';
  })();

  return (
    <Card
      className={cn(
        'relative overflow-hidden noise-overlay min-w-0 rounded-xl border border-border/30 bg-gradient-to-br from-white/70 via-white/40 to-white/10 dark:from-white/5 dark:via-white/0 dark:to-white/0 shadow-[0_10px_40px_-25px_rgba(0,0,0,0.45)] hover:shadow-[0_20px_45px_-25px_rgba(0,0,0,0.6)] transition-all duration-300 backdrop-blur-xl',
        className
      )}
    >
      <div className="absolute inset-0 opacity-50">
        <div className="absolute inset-y-0 right-0 w-1/2 bg-gradient-to-l from-primary/15 via-primary/5 to-transparent" />
        <div className="absolute -left-8 -bottom-8 h-24 w-24 rounded-full bg-muted/40 blur-3xl" />
      </div>

      <CardContent className="relative px-5 py-4 min-h-[128px] flex flex-col">
        <div className="flex items-start justify-between gap-3">
          <div className="flex flex-col gap-2 min-w-0">
            <p className="text-sm font-semibold text-muted-foreground leading-tight">{title}</p>
            {trend && (
              <span
                className={cn(
                  'inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium w-fit',
                  trend === 'up' && 'bg-success/10 text-success',
                  trend === 'down' && 'bg-destructive/10 text-destructive',
                  trend === 'neutral' && 'bg-muted text-muted-foreground'
                )}
              >
                {trendValue}
              </span>
            )}
          </div>

          {Icon && (
            <div className="relative">
              <div className="absolute inset-0 blur-2xl bg-primary/20" />
              <div className="relative rounded-2xl bg-gradient-to-br from-primary/15 via-primary/5 to-transparent p-3 shadow-inner">
                <Icon className="h-5 w-5 text-primary" />
              </div>
            </div>
          )}
        </div>

        <div className="mt-auto pt-4">
          {loading ? (
            <div className="skeleton h-6 w-28 rounded-md" />
          ) : (
            <div className="space-y-1">
              <p
                className={cn(
                  responsiveValueClass,
                  letterSpacingClass,
                  'font-semibold leading-tight overflow-hidden whitespace-nowrap text-balance text-foreground',
                  valueClassName
                )}
              >
                {value}
              </p>
              {trendValue && !trend && (
                <p className="text-[11px] text-muted-foreground">{trendValue}</p>
              )}
            </div>
          )}
        </div>
      </CardContent>
    </Card>
  );
}

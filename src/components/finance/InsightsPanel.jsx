"use client";

import { useMemo, useState } from 'react';
import { format, subMonths } from 'date-fns';
import { ptBR } from 'date-fns/locale/pt-BR';
import {
  ArrowUpRight,
  ArrowDownRight,
  CalendarRange,
  ChevronLeft,
  ChevronRight,
  Sparkles,
  BarChart3,
  X,
} from 'lucide-react';

import { Button } from '@/components/ui/button';
import { formatCurrency, cn } from '@/lib/utils';

const PERIOD_PRESETS = [
  { label: '30 dias', value: '30d', multiplier: 1 },
  { label: '90 dias', value: '90d', multiplier: 1 },
  { label: '6 meses', value: '6m', multiplier: 1 },
  { label: '1 ano', value: '1y', multiplier: 1 },
];

const ZERO_CATEGORY_DATA = {
  income: ['Salário', 'Projetos', 'Investimentos', 'Outros'].map((label) => ({ label, amount: 0 })),
  expense: ['Moradia', 'Cartões', 'Lazer', 'Educação', 'Saúde'].map((label) => ({ label, amount: 0 })),
};

const MONTHS_TO_SHOW = 6;
const ZERO_MONTHLY_SERIES = Array.from({ length: MONTHS_TO_SHOW }, (_, idx) => {
  const date = subMonths(new Date(), MONTHS_TO_SHOW - 1 - idx);
  return {
    label: format(date, 'MMM/yy', { locale: ptBR }),
    income: 0,
    expense: 0,
  };
});

function percentageChange(prev, current) {
  if (!prev) return 0;
  if (prev === 0) return current ? 100 : 0;
  return ((current - prev) / prev) * 100;
}

export default function InsightsPanel({ onClose }) {
  const [selectedPreset, setSelectedPreset] = useState(PERIOD_PRESETS[0].value);
  const [monthIndex, setMonthIndex] = useState(ZERO_MONTHLY_SERIES.length - 1);

  const multiplier = PERIOD_PRESETS.find((preset) => preset.value === selectedPreset)?.multiplier ?? 1;

  const incomeCategories = useMemo(
    () => ZERO_CATEGORY_DATA.income.map((cat) => ({ ...cat, amount: Math.round(cat.amount * multiplier) })),
    [multiplier]
  );
  const expenseCategories = useMemo(
    () => ZERO_CATEGORY_DATA.expense.map((cat) => ({ ...cat, amount: Math.round(cat.amount * multiplier) })),
    [multiplier]
  );

  const activeMonth = ZERO_MONTHLY_SERIES[monthIndex];
  const previousMonth = ZERO_MONTHLY_SERIES[Math.max(monthIndex - 1, 0)];

  const intelligentComparisons = useMemo(() => {
    const incomeDelta = percentageChange(previousMonth.income, activeMonth.income);
    const expenseDelta = percentageChange(previousMonth.expense, activeMonth.expense);
    const balanceDelta = percentageChange(
      previousMonth.income - previousMonth.expense,
      activeMonth.income - activeMonth.expense
    );

    return [
      {
        title: 'Saldo disponível',
        value: formatCurrency(activeMonth.income - activeMonth.expense),
        delta: balanceDelta,
        description: `Comparado a ${previousMonth.label}`,
      },
      {
        title: 'Entradas vs mês anterior',
        value: formatCurrency(activeMonth.income),
        delta: incomeDelta,
        description: `${formatCurrency(activeMonth.income - previousMonth.income)} de variação`,
      },
      {
        title: 'Saídas controladas',
        value: formatCurrency(activeMonth.expense),
        delta: -expenseDelta,
        description: expenseDelta >= 0 ? 'Saídas aumentaram' : 'Saídas em queda',
      },
    ];
  }, [activeMonth, previousMonth]);

  const maxMonthlyValue = Math.max(
    ...ZERO_MONTHLY_SERIES.map((month) => Math.max(month.income, month.expense))
  ) || 1;

  return (
    <div className="space-y-6 p-6 md:p-8">
      <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
        <div>
          <p className="text-xs uppercase tracking-wide text-muted-foreground">Painel inteligente</p>
          <h2 className="text-3xl font-semibold">Insights e comparações</h2>
          <p className="text-sm text-muted-foreground">
            Visualize categorias de entrada e saída, compare meses rapidamente e descubra oportunidades de otimização.
          </p>
        </div>
        <div className="flex items-center gap-2">
          <Button variant="ghost" size="sm" className="gap-2">
            <CalendarRange className="h-4 w-4" />
            Atualizado hoje
          </Button>
          <Button variant="outline" size="icon" onClick={onClose} aria-label="Fechar insights">
            <X className="h-4 w-4" />
          </Button>
        </div>
      </div>

      <div className="flex flex-wrap gap-2">
        {PERIOD_PRESETS.map((preset) => (
          <button
            key={preset.value}
            onClick={() => setSelectedPreset(preset.value)}
            className={cn(
              'rounded-2xl border px-4 py-2 text-sm font-medium transition',
              selectedPreset === preset.value
                ? 'bg-primary text-primary-foreground shadow'
                : 'border-border/60 bg-background/40 text-muted-foreground hover:text-foreground'
            )}
          >
            {preset.label}
          </button>
        ))}
      </div>

      <div className="grid gap-4 lg:grid-cols-2">
        <CategorySection title="Entradas por categoria" data={incomeCategories} accent="from-emerald-400 via-emerald-500 to-emerald-600" />
        <CategorySection title="Saídas por categoria" data={expenseCategories} accent="from-rose-400 via-rose-500 to-rose-600" />
      </div>

      <div className="rounded-3xl border border-border/50 bg-card/80 p-6 shadow-inner">
        <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
          <div>
            <p className="text-sm text-muted-foreground">Comparação mensal</p>
            <h3 className="text-xl font-semibold">{activeMonth.label}</h3>
          </div>
          <div className="flex items-center gap-2">
            <Button
              variant="ghost"
              size="icon"
              onClick={() => setMonthIndex((prev) => Math.max(prev - 1, 0))}
              disabled={monthIndex === 0}
            >
              <ChevronLeft className="h-4 w-4" />
            </Button>
            <Button
              variant="ghost"
              size="icon"
              onClick={() => setMonthIndex((prev) => Math.min(prev + 1, ZERO_MONTHLY_SERIES.length - 1))}
              disabled={monthIndex === ZERO_MONTHLY_SERIES.length - 1}
            >
              <ChevronRight className="h-4 w-4" />
            </Button>
          </div>
        </div>

        <div className="mt-6 flex flex-col gap-4">
          <div className="flex items-center gap-3 text-xs uppercase tracking-wide text-muted-foreground">
            <span className="flex items-center gap-1"><span className="h-2 w-2 rounded-full bg-emerald-400" /> Entradas</span>
            <span className="flex items-center gap-1"><span className="h-2 w-2 rounded-full bg-rose-400" /> Saídas</span>
          </div>
          <div className="flex items-end gap-3 overflow-x-auto pb-2">
            {ZERO_MONTHLY_SERIES.map((month, index) => {
              const incomeHeight = (month.income / maxMonthlyValue) * 100;
              const expenseHeight = (month.expense / maxMonthlyValue) * 100;
              return (
                <button
                  key={month.label}
                  onClick={() => setMonthIndex(index)}
                  className="flex flex-col items-center gap-2 focus:outline-none"
                >
                  <div
                    className={cn(
                      'flex h-36 w-10 flex-col justify-end gap-1 rounded-full bg-muted/40 p-1 transition',
                      index === monthIndex && 'bg-muted shadow-inner'
                    )}
                  >
                    <div
                      className="w-full rounded-full bg-emerald-400"
                      style={{ height: `${Math.max(incomeHeight, 8)}%` }}
                    />
                    <div
                      className="w-full rounded-full bg-rose-400"
                      style={{ height: `${Math.max(expenseHeight, 8)}%` }}
                    />
                  </div>
                  <span className="text-[11px] uppercase text-muted-foreground">{month.label}</span>
                </button>
              );
            })}
          </div>
        </div>
      </div>

      <div className="rounded-3xl border border-border/50 bg-card/80 p-6 space-y-4">
        <div className="flex items-center gap-2">
          <Sparkles className="h-4 w-4 text-primary" />
          <p className="text-sm font-semibold">Comparações inteligentes</p>
        </div>
        <div className="grid gap-4 md:grid-cols-3">
          {intelligentComparisons.map((item) => (
            <div key={item.title} className="rounded-2xl border border-border/40 bg-background/60 p-4 space-y-3">
              <p className="text-xs text-muted-foreground uppercase tracking-wide">{item.title}</p>
              <p className="text-2xl font-semibold">{item.value}</p>
              <div className="flex items-center gap-2">
                <span
                  className={cn(
                    'inline-flex items-center rounded-full px-2 py-0.5 text-xs font-semibold',
                    item.delta >= 0 ? 'text-emerald-600 bg-emerald-100/60 dark:bg-emerald-500/10' : 'text-rose-600 bg-rose-100/60 dark:bg-rose-500/10'
                  )}
                >
                  {item.delta >= 0 ? <ArrowUpRight className="mr-1 h-3 w-3" /> : <ArrowDownRight className="mr-1 h-3 w-3" />}
                  {Math.abs(item.delta).toFixed(1)}%
                </span>
                <span className="text-xs text-muted-foreground">{item.description}</span>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

function CategorySection({ title, data, accent }) {
  const total = data.reduce((sum, item) => sum + item.amount, 0) || 1;
  return (
    <div className="rounded-3xl border border-border/50 bg-card/80 p-6 shadow-inner">
      <div className="flex items-center justify-between">
        <div>
          <p className="text-sm text-muted-foreground">{title}</p>
          <h4 className="text-xl font-semibold">{formatCurrency(total)}</h4>
        </div>
        <BarChart3 className="h-5 w-5 text-muted-foreground" />
      </div>
      <div className="mt-6 space-y-4">
        {data.map((item) => {
          const percentage = Math.round((item.amount / total) * 100);
          return (
            <div key={`${title}-${item.label}`} className="space-y-2">
              <div className="flex items-center justify-between text-xs uppercase text-muted-foreground">
                <span>{item.label}</span>
                <span>{percentage}%</span>
              </div>
              <div className="h-3 w-full rounded-full bg-muted/50">
                <div
                  className={cn('h-full rounded-full bg-gradient-to-r', accent)}
                  style={{ width: `${percentage}%` }}
                />
              </div>
              <p className="text-sm font-semibold">{formatCurrency(item.amount)}</p>
            </div>
          );
        })}
      </div>
    </div>
  );
}

import { useState, useMemo, useEffect } from 'react';
import { motion } from 'framer-motion';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import {
  format,
  addMonths,
  subMonths,
  getMonth,
  getYear,
  differenceInCalendarDays,
} from 'date-fns';
import { ptBR } from 'date-fns/locale/pt-BR';
import {
  Wallet,
  TrendingUp,
  ArrowUpCircle,
  ArrowDownCircle,
  Clock,
  ChevronLeft,
  ChevronRight,
  ChevronDown,
  Plus,
} from 'lucide-react';

import { Button } from '@/components/ui/button';
import StatCard from '@/components/finance/StatCard';
import TransactionDialog from '@/components/finance/TransactionDialog';
import BulkDataDialog from '@/components/finance/BulkDataDialog';
import MonthTable from '@/components/finance/MonthTable';
import { TransactionAPI, CreditCardAPI } from '@/lib/api';
import { schedulePaymentReminders } from '@/lib/notifications';
import { formatCurrency, cn } from '@/lib/utils';
import { feedback } from '@/lib/feedback';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';

export default function FluxoCaixa() {
  const [currentMonth, setCurrentMonth] = useState(new Date());
  const [dialogOpen, setDialogOpen] = useState(false);
  const [dialogType, setDialogType] = useState('income');
  const [editingTransaction, setEditingTransaction] = useState(null);
  const [bulkDialogOpen, setBulkDialogOpen] = useState(false);
  const [viewMode, setViewMode] = useState('resumo');
  const [monthPickerOpen, setMonthPickerOpen] = useState(false);
  const [pickerYear, setPickerYear] = useState(() => new Date().getFullYear());

  const queryClient = useQueryClient();

  const month = getMonth(currentMonth) + 1;
  const year = getYear(currentMonth);

  const { data: transactions = [], isLoading: isLoadingTransactions } = useQuery({
    queryKey: ['transactions', month, year],
    queryFn: () => TransactionAPI.list({ month, year }),
  });

  const { data: creditCards = [] } = useQuery({
    queryKey: ['credit-cards'],
    queryFn: () => CreditCardAPI.list(),
  });

  const createMutation = useMutation({
    mutationFn: (data) => TransactionAPI.create(data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['transactions'] });
      feedback('success');
      setDialogOpen(false);
      setEditingTransaction(null);
    },
  });

  const updateMutation = useMutation({
    mutationFn: ({ id, data }) => TransactionAPI.update(id, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['transactions'] });
      feedback('success');
      setDialogOpen(false);
      setEditingTransaction(null);
    },
  });

  const deleteMutation = useMutation({
    mutationFn: (id) => TransactionAPI.delete(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['transactions'] });
      feedback('delete');
    },
  });

  useEffect(() => {
    if (!monthPickerOpen) {
      setPickerYear(currentMonth.getFullYear());
    }
  }, [currentMonth, monthPickerOpen]);

  useEffect(() => {
    if (!transactions.length) return undefined;

    let cleanups = [];
    let mounted = true;

    (async () => {
      const teardown = await schedulePaymentReminders(transactions);
      if (mounted) {
        cleanups = teardown;
      } else if (teardown?.length) {
        teardown.forEach((fn) => fn?.());
      }
    })();

    return () => {
      mounted = false;
      if (cleanups?.length) cleanups.forEach((fn) => fn?.());
    };
  }, [transactions]);

  const stats = useMemo(() => {
    const incomeTransactions = transactions.filter((t) => t.type === 'income');
    const expenseTransactions = transactions.filter((t) => t.type === 'expense');

    const completedIncome = incomeTransactions
      .filter((t) => t.status === 'completed')
      .reduce((sum, t) => sum + Number(t.amount), 0);

    const completedExpense = expenseTransactions
      .filter((t) => t.status === 'completed')
      .reduce((sum, t) => sum + Number(t.amount), 0);

    const predictedIncome = incomeTransactions
      .filter((t) => t.status === 'predicted')
      .reduce((sum, t) => sum + Number(t.amount), 0);

    const predictedExpense = expenseTransactions
      .filter((t) => t.status === 'predicted')
      .reduce((sum, t) => sum + Number(t.amount), 0);

    const totalIncome = completedIncome + predictedIncome;
    const totalExpense = completedExpense + predictedExpense;

    return {
      balance: completedIncome - completedExpense,
      projectedBalance: totalIncome - totalExpense,
      completedIncome,
      completedExpense,
      predictedIncome,
      predictedExpense,
    };
  }, [transactions]);

  const statCards = [
    {
      key: 'balance',
      title: 'Saldo',
      value: formatCurrency(stats.balance),
      icon: Wallet,
      valueClassName: stats.balance >= 0 ? 'text-emerald-600' : 'text-red-500',
    },
    {
      key: 'projectedBalance',
      title: 'Saldo Projetado',
      value: formatCurrency(stats.projectedBalance),
      icon: TrendingUp,
      valueClassName: stats.projectedBalance >= 0 ? 'text-emerald-600' : 'text-red-500',
    },
    {
      key: 'completedIncome',
      title: 'Entradas',
      value: formatCurrency(stats.completedIncome),
      icon: ArrowUpCircle,
      valueClassName: 'text-emerald-600',
    },
    {
      key: 'completedExpense',
      title: 'Saídas',
      value: formatCurrency(stats.completedExpense),
      icon: ArrowDownCircle,
      valueClassName: 'text-red-500',
    },
    {
      key: 'predictedIncome',
      title: 'Prev. Entradas',
      value: formatCurrency(stats.predictedIncome),
      icon: Clock,
    },
    {
      key: 'predictedExpense',
      title: 'Prev. Saídas',
      value: formatCurrency(stats.predictedExpense),
      icon: Clock,
    },
  ];

  const statCardVariants = {
    hidden: { opacity: 0, y: 14 },
    visible: { opacity: 1, y: 0 },
  };

  const handleOpenDialog = (type) => {
    setDialogType(type);
    setEditingTransaction(null);
    setDialogOpen(true);
  };

  const handleEdit = (transaction) => {
    setDialogType(transaction.type);
    setEditingTransaction(transaction);
    setDialogOpen(true);
  };

  const handleSave = async (data) => {
    const { recurring, recurringUntil, ...payload } = data;
    if (editingTransaction) {
      updateMutation.mutate({ id: editingTransaction.id, data: payload });
      return;
    }

    if (recurring && recurringUntil) {
      const startDate = new Date(payload.date);
      const endDate = new Date(recurringUntil);
      const entries = [];
      let cursor = new Date(startDate);
      while (cursor <= endDate) {
        const entryDate = new Date(cursor);
        entries.push({
          ...payload,
          date: entryDate.toISOString(),
          status: entryDate <= new Date() ? payload.status ?? 'completed' : 'predicted',
        });
        cursor = addMonths(cursor, 1);
      }
      for (const entry of entries) {
        await createMutation.mutateAsync(entry);
      }
      return;
    }

    createMutation.mutate(payload);
  };

  const handleDelete = (id) => {
    if (window.confirm('Tem certeza que deseja excluir esta transação?')) {
      deleteMutation.mutate(id);
    }
  };

  const handleDuplicate = (transaction) => {
    const newDate = addMonths(new Date(transaction.date), 1);
    const duplicatedData = {
      title: transaction.title,
      amount: transaction.amount,
      type: transaction.type,
      category: transaction.category,
      description: transaction.description,
      date: newDate.toISOString(),
      status: 'predicted',
    };
    createMutation.mutate(duplicatedData);
  };

  if (isLoadingTransactions) {
    return (
      <div className="flex items-center justify-center h-64">
        <p className="text-muted-foreground">Carregando...</p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Month Navigation */}
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div className="flex items-center justify-between gap-2">
          <Button variant="outline" size="icon" className="flex-1 sm:flex-none" onClick={() => setCurrentMonth((p) => subMonths(p, 1))}>
            <ChevronLeft className="h-4 w-4" />
          </Button>
          <DropdownMenu open={monthPickerOpen} onOpenChange={setMonthPickerOpen}>
            <DropdownMenuTrigger asChild>
              <button
                className="flex flex-wrap items-center gap-2 rounded-2xl border border-border/50 bg-card/70 px-4 py-2 text-sm sm:text-base font-semibold capitalize shadow-sm transition hover:border-primary/50"
                aria-label="Selecionar mês"
              >
                {format(currentMonth, 'MMMM yyyy', { locale: ptBR })}
                <ChevronDown className="h-4 w-4 text-muted-foreground" />
              </button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="center" className="w-64 space-y-4 p-4">
              <div className="flex items-center justify-between">
                <Button variant="ghost" size="icon" onClick={() => setPickerYear((prev) => prev - 1)}>
                  <ChevronLeft className="h-4 w-4" />
                </Button>
                <span className="text-sm font-semibold">{pickerYear}</span>
                <Button variant="ghost" size="icon" onClick={() => setPickerYear((prev) => prev + 1)}>
                  <ChevronRight className="h-4 w-4" />
                </Button>
              </div>
              <div className="grid grid-cols-3 gap-2">
                {Array.from({ length: 12 }).map((_, index) => {
                  const label = format(new Date(2024, index, 1), 'MMM', { locale: ptBR });
                  const isActive =
                    currentMonth.getMonth() === index && currentMonth.getFullYear() === pickerYear;
                  return (
                    <button
                      key={label}
                      className={cn(
                        'rounded-xl px-3 py-2 text-sm font-medium capitalize transition',
                        isActive
                          ? 'bg-primary text-primary-foreground shadow'
                          : 'bg-muted/40 text-muted-foreground hover:bg-muted/80 hover:text-foreground'
                      )}
                      onClick={() => {
                        setCurrentMonth(new Date(pickerYear, index, 1));
                        setMonthPickerOpen(false);
                      }}
                    >
                      {label}
                    </button>
                  );
                })}
              </div>
            </DropdownMenuContent>
          </DropdownMenu>
          <Button variant="outline" size="icon" className="flex-1 sm:flex-none" onClick={() => setCurrentMonth((p) => addMonths(p, 1))}>
            <ChevronRight className="h-4 w-4" />
          </Button>
        </div>

        <div className="flex items-center gap-2 rounded-2xl border border-border/40 bg-card/70 p-1 text-xs sm:text-sm">
          {['resumo', 'visao'].map((mode) => (
            <button
              key={mode}
              onClick={() => setViewMode(mode)}
              className={cn(
                'px-4 py-1.5 rounded-xl transition-all font-medium capitalize',
                viewMode === mode
                  ? 'bg-primary text-primary-foreground shadow'
                  : 'text-muted-foreground hover:text-foreground'
              )}
            >
              {mode === 'resumo' ? 'Resumo clássico' : 'Painel visual'}
            </button>
          ))}
        </div>
      </div>

      {viewMode === 'resumo' ? (
        <>
          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-3">
            {statCards.map((card, index) => (
              <motion.div
                key={card.key}
                variants={statCardVariants}
                initial="hidden"
                animate="visible"
                transition={{ duration: 0.4, delay: index * 0.06 }}
              >
                <StatCard title={card.title} value={card.value} icon={card.icon} valueClassName={card.valueClassName} />
              </motion.div>
            ))}
          </div>

          <div className="flex flex-col gap-2 sm:flex-row sm:gap-3">
            <Button variant="success" onClick={() => handleOpenDialog('income')} className="w-full sm:w-auto">
              <Plus className="h-4 w-4 mr-1.5" /> Entrada
            </Button>
            <Button variant="destructive" onClick={() => handleOpenDialog('expense')} className="w-full sm:w-auto">
              <Plus className="h-4 w-4 mr-1.5" /> Saída
            </Button>
          </div>

          {!transactions.length && (
            <motion.div
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              className="rounded-3xl border border-dashed border-primary/40 bg-primary/5 p-6 flex flex-col gap-3"
            >
              <h3 className="text-lg font-semibold">Sem movimentos neste mês</h3>
              <p className="text-sm text-muted-foreground">
                Adicione sua primeira entrada ou saída para começar a acompanhar o fluxo de caixa deste período.
              </p>
              <div className="flex gap-2">
                <Button variant="success" size="sm" onClick={() => handleOpenDialog('income')}>
                  <Plus className="h-4 w-4 mr-2" /> Nova entrada
                </Button>
                <Button variant="destructive" size="sm" onClick={() => handleOpenDialog('expense')}>
                  <Plus className="h-4 w-4 mr-2" /> Nova saída
                </Button>
              </div>
            </motion.div>
          )}

          <div className="rounded-3xl border border-border/20 bg-card/40 shadow-inner overflow-hidden">
            <div className="overflow-x-auto">
              <div className="min-w-[640px]">
                <MonthTable
                  transactions={transactions}
                  currentMonth={currentMonth}
                  onEdit={handleEdit}
                  onDelete={handleDelete}
                  onDuplicate={handleDuplicate}
                />
              </div>
            </div>
          </div>
        </>
      ) : (
        <AlternativeFlowView stats={stats} transactions={transactions} onNew={(type) => handleOpenDialog(type)} />
      )}

      {/* Transaction Dialog */}
      <TransactionDialog
        open={dialogOpen}
        onOpenChange={setDialogOpen}
        type={dialogType}
        transaction={editingTransaction}
        onSave={handleSave}
        defaultDate={currentMonth}
        onShortcut={() => setBulkDialogOpen(true)}
      />
      <BulkDataDialog
        open={bulkDialogOpen}
        onOpenChange={setBulkDialogOpen}
        onImportComplete={() => queryClient.invalidateQueries()}
      />
    </div>
  );
}

function AlternativeFlowView({ stats, transactions, onNew }) {
  const totalCompleted = stats.completedIncome + stats.completedExpense;
  const incomePercent = totalCompleted ? (stats.completedIncome / totalCompleted) * 100 : 0;

  const predicted = transactions
    .filter((t) => t.status === 'predicted')
    .sort((a, b) => new Date(a.date) - new Date(b.date))
    .slice(0, 6);

  return (
    <div className="space-y-6">
      <div className="rounded-3xl border border-border/40 bg-card/70 p-6 shadow-inner">
        <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
          <div>
            <p className="text-sm text-muted-foreground">Distribuição do fluxo concluído</p>
            <h3 className="text-2xl font-semibold">{formatCurrency(stats.balance)}</h3>
          </div>
          <div className="flex gap-3">
            <Button variant="success" size="sm" onClick={() => onNew('income')}>
              <Plus className="h-4 w-4 mr-2" /> Nova entrada
            </Button>
            <Button variant="destructive" size="sm" onClick={() => onNew('expense')}>
              <Plus className="h-4 w-4 mr-2" /> Nova saída
            </Button>
          </div>
        </div>
        <div className="mt-6 space-y-2">
          <div className="flex justify-between text-xs uppercase text-muted-foreground">
            <span>Entradas {formatCurrency(stats.completedIncome)}</span>
            <span>Saídas {formatCurrency(stats.completedExpense)}</span>
          </div>
          <div className="h-4 w-full rounded-full bg-muted/70 overflow-hidden">
            <motion.div
              initial={{ width: 0 }}
              animate={{ width: `${incomePercent}%` }}
              transition={{ duration: 0.6, ease: 'easeOut' }}
              className="h-full bg-gradient-to-r from-emerald-400 via-emerald-500 to-emerald-600"
            />
          </div>
        </div>
      </div>

      <div className="grid gap-4 md:grid-cols-2">
        <div className="rounded-3xl border border-border/40 bg-card/80 p-5">
          <h4 className="text-sm font-semibold text-muted-foreground">Previsões proximas</h4>
          <ul className="mt-4 space-y-3">
            {predicted.length === 0 && (
              <li className="text-sm text-muted-foreground">Nenhuma previsão futura.</li>
            )}
            {predicted.map((item) => {
              const diffDays = differenceInCalendarDays(new Date(item.date), new Date());
              const diffLabel = diffDays === 0 ? 'hoje' : diffDays > 0 ? `faltam ${diffDays} dias` : `${Math.abs(diffDays)} dias atrás`;
              return (
                <li key={item.id} className="flex items-center justify-between rounded-2xl border border-border/30 bg-background/70 px-3 py-2">
                  <div>
                    <p className="font-medium text-sm">{item.title}</p>
                    <p className="text-xs text-muted-foreground">
                      {format(new Date(item.date), 'dd MMM', { locale: ptBR })} · {diffLabel}
                    </p>
                  </div>
                <span className={cn('text-sm font-semibold', item.type === 'income' ? 'text-emerald-600' : 'text-red-500')}>
                  {formatCurrency(item.amount)}
                </span>
                </li>
              );
            })}
          </ul>
        </div>

        <div className="rounded-3xl border border-border/40 bg-card/80 p-5">
          <h4 className="text-sm font-semibold text-muted-foreground">Resumo rápido</h4>
          <div className="mt-4 grid grid-cols-2 gap-3">
            {[
              { label: 'Saldo projetado', value: stats.projectedBalance, tone: stats.projectedBalance >= 0 ? 'text-emerald-600' : 'text-red-500' },
              { label: 'Prev. entradas', value: stats.predictedIncome, tone: 'text-emerald-600' },
              { label: 'Prev. saídas', value: stats.predictedExpense, tone: 'text-red-500' },
              { label: 'Depreciação', value: stats.depreciation, tone: 'text-red-500' },
            ].map((item) => (
              <div key={item.label} className="rounded-2xl border border-border/30 bg-background/60 p-3">
                <p className="text-xs text-muted-foreground">{item.label}</p>
                <p className={cn('text-base font-semibold', item.tone)}>{formatCurrency(item.value)}</p>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}

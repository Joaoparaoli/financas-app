import { useMemo } from 'react';
import { getDaysInMonth, getDate, format } from 'date-fns';
import { ptBR } from 'date-fns/locale/pt-BR';
import { formatCurrency } from '@/lib/utils';
import { cn } from '@/lib/utils';
import { Pencil, Copy, Trash2 } from 'lucide-react';
import { Button } from '@/components/ui/button';

/**
 * Tabela estilo planilha:
 *  - Colunas: dias do mês (só os que têm transações, + coluna Total)
 *  - Seção ENTRADAS: cada transação = 1 linha
 *  - Linha subtotal Entradas por dia
 *  - Seção SAÍDAS: cada transação = 1 linha
 *  - Linha subtotal Saídas por dia
 *  - Linha SALDO DO DIA
 *  - Linha SALDO ACUMULADO
 */
export default function MonthTable({ transactions, currentMonth, onEdit, onDelete, onDuplicate }) {
  const daysInMonth = getDaysInMonth(currentMonth);

  // Dias que têm ao menos uma transação
  const activeDays = useMemo(() => {
    const days = new Set(
      transactions.map((t) => getDate(new Date(t.date)))
    );
    return Array.from(days).sort((a, b) => a - b);
  }, [transactions]);

  const incomeRows = transactions.filter((t) => t.type === 'income');
  const expenseRows = transactions.filter((t) => t.type === 'expense');

  // Monta um mapa: day -> [transactions]
  function byDay(rows) {
    const map = {};
    for (const t of rows) {
      const d = getDate(new Date(t.date));
      if (!map[d]) map[d] = [];
      map[d].push(t);
    }
    return map;
  }

  const incomeByDay = byDay(incomeRows);
  const expenseByDay = byDay(expenseRows);

  // Subtotais por dia
  function dayTotal(byDayMap, day) {
    return (byDayMap[day] || []).reduce((s, t) => s + t.amount, 0);
  }

  // Saldo do dia = entradas - saídas
  const dailyBalance = useMemo(() => {
    return activeDays.map((day) => ({
      day,
      balance: dayTotal(incomeByDay, day) - dayTotal(expenseByDay, day),
    }));
  }, [activeDays, incomeByDay, expenseByDay]);

  // Saldo acumulado
  const cumulativeBalance = useMemo(() => {
    let acc = 0;
    return dailyBalance.map(({ day, balance }) => {
      acc += balance;
      return { day, cumulative: acc };
    });
  }, [dailyBalance]);

  const cumulativeMap = Object.fromEntries(
    cumulativeBalance.map(({ day, cumulative }) => [day, cumulative])
  );
  const balanceMap = Object.fromEntries(
    dailyBalance.map(({ day, balance }) => [day, balance])
  );

  // Total geral das colunas
  const totalIncome = incomeRows.reduce((s, t) => s + t.amount, 0);
  const totalExpense = expenseRows.reduce((s, t) => s + t.amount, 0);
  const finalBalance = totalIncome - totalExpense;

  if (transactions.length === 0) {
    return (
      <div className="text-center py-12 text-muted-foreground text-sm">
        Nenhuma transação neste mês.
      </div>
    );
  }

  // Cabeçalho com nome curto do dia da semana
  function dayHeader(day) {
    const date = new Date(currentMonth.getFullYear(), currentMonth.getMonth(), day);
    const weekDay = format(date, 'EEE', { locale: ptBR });
    return (
      <div className="flex flex-col items-center leading-tight">
        <span className="font-bold text-sm">{day}</span>
        <span className="text-[10px] text-muted-foreground capitalize">{weekDay}</span>
      </div>
    );
  }

  // Célula de valor de uma transação num dia
  function TransactionCell({ transaction, day, isIncome }) {
    const txDay = getDate(new Date(transaction.date));
    if (txDay !== day) return <td className="border border-slate-100 px-1 py-1 text-center" />;
    return (
      <td className={cn(
        'border border-slate-100 px-2 py-1 text-center text-xs font-medium whitespace-nowrap',
        isIncome ? 'text-emerald-700 bg-emerald-50/40' : 'text-red-600 bg-red-50/40'
      )}>
        {formatCurrency(transaction.amount)}
      </td>
    );
  }

  // Linha de transação
  function TransactionRow({ transaction, isIncome }) {
    const isPredicted = transaction.status === 'predicted';
    return (
      <tr className={cn(
        'group hover:bg-slate-50 transition-colors',
        isPredicted && 'opacity-70'
      )}>
        {/* Nome + ações */}
        <td className="border border-slate-100 px-3 py-1.5 sticky left-0 bg-white z-10 min-w-[180px] max-w-[220px]">
          <div className="flex items-center justify-between gap-1">
            <div className="min-w-0">
              <p className={cn(
                'text-xs font-medium truncate',
                isPredicted && 'italic'
              )}>
                {transaction.title}
              </p>
              <p className="text-[10px] text-muted-foreground truncate">{transaction.category}</p>
            </div>
            <div className="flex gap-0 opacity-0 group-hover:opacity-100 transition-opacity shrink-0">
              <Button
                variant="ghost"
                size="icon-sm"
                className="h-5 w-5"
                onClick={() => onEdit(transaction)}
                title="Editar"
              >
                <Pencil className="h-2.5 w-2.5" />
              </Button>
              <Button
                variant="ghost"
                size="icon-sm"
                className="h-5 w-5"
                onClick={() => onDuplicate(transaction)}
                title="Duplicar"
              >
                <Copy className="h-2.5 w-2.5" />
              </Button>
              <Button
                variant="ghost"
                size="icon-sm"
                className="h-5 w-5 text-destructive"
                onClick={() => onDelete(transaction.id)}
                title="Excluir"
              >
                <Trash2 className="h-2.5 w-2.5" />
              </Button>
            </div>
          </div>
        </td>

        {/* Células dos dias */}
        {activeDays.map((day) => (
          <TransactionCell
            key={day}
            transaction={transaction}
            day={day}
            isIncome={isIncome}
          />
        ))}

        {/* Total da linha */}
        <td className={cn(
          'border border-slate-200 px-2 py-1 text-center text-xs font-semibold sticky right-0 bg-white',
          isIncome ? 'text-emerald-700' : 'text-red-600'
        )}>
          {formatCurrency(transaction.amount)}
        </td>
      </tr>
    );
  }

  return (
    <div className="overflow-x-auto rounded-lg border border-slate-200 shadow-sm">
      <table className="w-full border-collapse text-sm">
        <thead>
          <tr className="bg-slate-50">
            <th className="border border-slate-200 px-3 py-2 text-left text-xs font-semibold text-slate-600 sticky left-0 bg-slate-50 z-20 min-w-[180px]">
              Transação
            </th>
            {activeDays.map((day) => (
              <th
                key={day}
                className="border border-slate-200 px-2 py-2 text-center text-xs min-w-[72px]"
              >
                {dayHeader(day)}
              </th>
            ))}
            <th className="border border-slate-200 px-2 py-2 text-center text-xs font-semibold text-slate-600 sticky right-0 bg-slate-50 z-20 min-w-[90px]">
              Total
            </th>
          </tr>
        </thead>

        <tbody>
          {/* ── ENTRADAS ── */}
          <tr className="bg-emerald-600">
            <td
              colSpan={activeDays.length + 2}
              className="px-3 py-1.5 text-xs font-bold text-white tracking-wider sticky left-0"
            >
              ENTRADAS
            </td>
          </tr>

          {incomeRows.length === 0 ? (
            <tr>
              <td
                colSpan={activeDays.length + 2}
                className="px-3 py-2 text-xs text-muted-foreground italic"
              >
                Nenhuma entrada
              </td>
            </tr>
          ) : (
            incomeRows.map((t) => (
              <TransactionRow key={t.id} transaction={t} isIncome={true} />
            ))
          )}

          {/* Subtotal Entradas por dia */}
          <tr className="bg-emerald-50 font-semibold">
            <td className="border border-slate-200 px-3 py-1.5 text-xs text-emerald-800 sticky left-0 bg-emerald-50 z-10">
              Subtotal Entradas
            </td>
            {activeDays.map((day) => {
              const val = dayTotal(incomeByDay, day);
              return (
                <td
                  key={day}
                  className="border border-slate-200 px-2 py-1.5 text-center text-xs text-emerald-700 font-semibold"
                >
                  {val > 0 ? formatCurrency(val) : '—'}
                </td>
              );
            })}
            <td className="border border-slate-200 px-2 py-1.5 text-center text-xs text-emerald-700 font-bold sticky right-0 bg-emerald-50">
              {formatCurrency(totalIncome)}
            </td>
          </tr>

          {/* ── SAÍDAS ── */}
          <tr className="bg-red-600">
            <td
              colSpan={activeDays.length + 2}
              className="px-3 py-1.5 text-xs font-bold text-white tracking-wider sticky left-0"
            >
              SAÍDAS
            </td>
          </tr>

          {expenseRows.length === 0 ? (
            <tr>
              <td
                colSpan={activeDays.length + 2}
                className="px-3 py-2 text-xs text-muted-foreground italic"
              >
                Nenhuma saída
              </td>
            </tr>
          ) : (
            expenseRows.map((t) => (
              <TransactionRow key={t.id} transaction={t} isIncome={false} />
            ))
          )}

          {/* Subtotal Saídas por dia */}
          <tr className="bg-red-50 font-semibold">
            <td className="border border-slate-200 px-3 py-1.5 text-xs text-red-800 sticky left-0 bg-red-50 z-10">
              Subtotal Saídas
            </td>
            {activeDays.map((day) => {
              const val = dayTotal(expenseByDay, day);
              return (
                <td
                  key={day}
                  className="border border-slate-200 px-2 py-1.5 text-center text-xs text-red-600 font-semibold"
                >
                  {val > 0 ? formatCurrency(val) : '—'}
                </td>
              );
            })}
            <td className="border border-slate-200 px-2 py-1.5 text-center text-xs text-red-600 font-bold sticky right-0 bg-red-50">
              {formatCurrency(totalExpense)}
            </td>
          </tr>

          {/* ── SALDO DO DIA ── */}
          <tr className="bg-slate-700">
            <td className="border border-slate-600 px-3 py-1.5 text-xs font-bold text-white sticky left-0 bg-slate-700 z-10">
              Saldo do Dia
            </td>
            {activeDays.map((day) => {
              const val = balanceMap[day] ?? 0;
              return (
                <td
                  key={day}
                  className={cn(
                    'border border-slate-600 px-2 py-1.5 text-center text-xs font-bold',
                    val >= 0 ? 'text-emerald-300' : 'text-red-300'
                  )}
                >
                  {val !== 0 ? formatCurrency(val) : '—'}
                </td>
              );
            })}
            <td
              className={cn(
                'border border-slate-600 px-2 py-1.5 text-center text-xs font-bold sticky right-0 bg-slate-700',
                finalBalance >= 0 ? 'text-emerald-300' : 'text-red-300'
              )}
            >
              {formatCurrency(finalBalance)}
            </td>
          </tr>

          {/* ── SALDO ACUMULADO ── */}
          <tr className="bg-slate-800">
            <td className="border border-slate-700 px-3 py-1.5 text-xs font-bold text-white sticky left-0 bg-slate-800 z-10">
              Saldo Acumulado
            </td>
            {activeDays.map((day) => {
              const val = cumulativeMap[day];
              if (val === undefined) {
                return (
                  <td key={day} className="border border-slate-700 px-2 py-1.5 text-center text-xs text-slate-400">
                    —
                  </td>
                );
              }
              return (
                <td
                  key={day}
                  className={cn(
                    'border border-slate-700 px-2 py-1.5 text-center text-xs font-bold',
                    val >= 0 ? 'text-emerald-300' : 'text-red-300'
                  )}
                >
                  {formatCurrency(val)}
                </td>
              );
            })}
            <td
              className={cn(
                'border border-slate-700 px-2 py-1.5 text-center text-xs font-bold sticky right-0 bg-slate-800',
                finalBalance >= 0 ? 'text-emerald-300' : 'text-red-300'
              )}
            >
              {formatCurrency(finalBalance)}
            </td>
          </tr>
        </tbody>
      </table>
    </div>
  );
}

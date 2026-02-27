import { formatCurrency, formatDate, cn } from '@/lib/utils';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Pencil, Trash2, Copy } from 'lucide-react';

export default function TransactionCard({ transaction, onEdit, onDelete, onDuplicate, creditCards }) {
  const isIncome = transaction.type === 'income';
  const isPredicted = transaction.status === 'predicted';

  const matchedCard = creditCards?.find(
    (c) => c.name === transaction.category || transaction.category === 'Cartão de Crédito'
  );

  return (
    <div
      className={cn(
        'group flex items-center justify-between rounded-md border p-3 transition-all duration-200 hover:bg-accent/50 hover:shadow-sm',
        isPredicted && 'border-dashed opacity-80'
      )}
    >
      <div className="flex-1 min-w-0">
        <div className="flex items-center gap-2">
          <span className="font-medium text-sm truncate">{transaction.title}</span>
          {isPredicted && (
            <Badge variant="outline" className="text-[10px] px-1.5 py-0">
              Previsto
            </Badge>
          )}
        </div>
        <div className="flex items-center gap-2 mt-1">
          <span className="text-xs text-muted-foreground">{transaction.category}</span>
          {matchedCard && (
            <span
              className="inline-block w-2 h-2 rounded-full"
              style={{ backgroundColor: matchedCard.color }}
            />
          )}
          <span className="text-xs text-muted-foreground">
            {formatDate(transaction.date)}
          </span>
        </div>
        {transaction.description && (
          <p className="text-xs text-muted-foreground mt-1 truncate">
            {transaction.description}
          </p>
        )}
      </div>
      <div className="flex items-center gap-2 ml-3">
        <span
          className={cn(
            'font-semibold text-sm whitespace-nowrap',
            isIncome ? 'text-emerald-600 dark:text-emerald-400' : 'text-red-500 dark:text-red-400'
          )}
        >
          {isIncome ? '+' : '-'} {formatCurrency(transaction.amount)}
        </span>
        <div className="flex items-center gap-0.5 opacity-0 group-hover:opacity-100 transition-opacity">
          <Button variant="ghost" size="icon-sm" onClick={() => onEdit(transaction)} title="Editar">
            <Pencil className="h-3.5 w-3.5" />
          </Button>
          <Button variant="ghost" size="icon-sm" onClick={() => onDuplicate(transaction)} title="Duplicar para próximo mês">
            <Copy className="h-3.5 w-3.5" />
          </Button>
          <Button variant="ghost" size="icon-sm" onClick={() => onDelete(transaction.id)} title="Excluir" className="text-destructive hover:text-destructive">
            <Trash2 className="h-3.5 w-3.5" />
          </Button>
        </div>
      </div>
    </div>
  );
}

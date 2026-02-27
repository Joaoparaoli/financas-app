import { useState, useEffect, useMemo } from 'react';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Switch } from '@/components/ui/switch';
import { INCOME_CATEGORIES, EXPENSE_CATEGORIES } from '@/lib/utils';
import { format } from 'date-fns';
import { ptBR } from 'date-fns/locale/pt-BR';

export default function TransactionDialog({
  open,
  onOpenChange,
  type,
  transaction,
  onSave,
  defaultDate,
  onShortcut,
}) {
  const todayStr = useMemo(() => format(new Date(), 'yyyy-MM-dd'), []);
  const [form, setForm] = useState({
    title: '',
    amount: '',
    date: todayStr,
    status: 'completed',
    category: '',
    description: '',
    recurring: false,
    recurringUntil: '',
  });
  const isEditing = !!transaction;

  const categories = type === 'income' ? INCOME_CATEGORIES : EXPENSE_CATEGORIES;

  useEffect(() => {
    if (transaction) {
      setForm({
        title: transaction.title || '',
        amount: String(transaction.amount || ''),
        date: transaction.date ? format(new Date(transaction.date), 'yyyy-MM-dd') : todayStr,
        status: transaction.status || 'completed',
        category: transaction.category || categories[0] || '',
        description: transaction.description || '',
        recurring: false,
        recurringUntil: '',
      });
    } else if (open) {
      const baseDate = defaultDate ? format(defaultDate, 'yyyy-MM-dd') : todayStr;
      setForm({
        title: '',
        amount: '',
        date: baseDate,
        status: baseDate === todayStr ? 'completed' : 'predicted',
        category: categories[0] || '',
        description: '',
        recurring: false,
        recurringUntil: '',
      });
    }
  }, [transaction, open, type, categories, defaultDate, todayStr]);

  function handleDateChange(value) {
    setForm((prev) => {
      const isCurrentDay = value === todayStr;
      const needsAdjustRecurring = prev.recurring && prev.recurringUntil && new Date(prev.recurringUntil) < new Date(value);
      return {
        ...prev,
        date: value,
        status: isEditing ? prev.status : isCurrentDay ? 'completed' : 'predicted',
        recurringUntil: needsAdjustRecurring ? value : prev.recurringUntil,
      };
    });
  }

  function handleRecurringToggle(checked) {
    setForm((prev) => {
      if (!checked) {
        return { ...prev, recurring: false, recurringUntil: '' };
      }
      const baseDate = prev.date ? new Date(prev.date) : new Date();
      const yearEnd = new Date(baseDate.getFullYear(), 11, 1);
      return {
        ...prev,
        recurring: true,
        recurringUntil: format(yearEnd, 'yyyy-MM-dd'),
      };
    });
  }

  const monthOptions = useMemo(() => {
    const base = form.date ? new Date(form.date) : new Date();
    const startMonth = base.getMonth();
    const year = base.getFullYear();
    return Array.from({ length: 12 - startMonth }, (_, idx) => {
      const date = new Date(year, startMonth + idx, 1);
      const label = format(date, 'LLLL', { locale: ptBR });
      return {
        value: format(date, 'yyyy-MM-dd'),
        label: label.charAt(0).toUpperCase() + label.slice(1),
      };
    });
  }, [form.date]);

  async function handleSubmit(e) {
    e.preventDefault();
    if (!form.title) return;

    const trimmedTitle = form.title.trim().toLowerCase();
    if (trimmedTitle === 'atalho') {
      onOpenChange(false);
      onShortcut?.();
      return;
    }

    if (!form.amount || !form.category) return;
    await onSave({
      ...form,
      amount: parseFloat(form.amount),
      type,
      date: new Date(form.date + 'T12:00:00').toISOString(),
      recurringUntil: form.recurring ? form.recurringUntil : null,
    });
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[480px] max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>
            {isEditing ? 'Editar' : 'Nova'}{' '}
            {type === 'income' ? 'Entrada' : 'Saída'}
          </DialogTitle>
        </DialogHeader>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="title">Título</Label>
            <Input
              id="title"
              value={form.title}
              onChange={(e) => setForm({ ...form, title: e.target.value })}
              placeholder="Ex: Salário, Aluguel..."
              required
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="amount">Valor (R$)</Label>
            <Input
              id="amount"
              type="number"
              step="0.01"
              min="0"
              value={form.amount}
              onChange={(e) => setForm({ ...form, amount: e.target.value })}
              placeholder="0,00"
              required
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="date">Data</Label>
            <Input
              id="date"
              type="date"
              value={form.date}
              onChange={(e) => handleDateChange(e.target.value)}
              required
            />
          </div>
          <div className="space-y-2">
            <Label>Status</Label>
            <Select value={form.status} onValueChange={(v) => setForm({ ...form, status: v })}>
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="completed">Concluído</SelectItem>
                <SelectItem value="predicted">Previsto</SelectItem>
              </SelectContent>
            </Select>
          </div>
          <div className="space-y-3 rounded-2xl border border-border/40 p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium">Lançamento recorrente</p>
                <p className="text-xs text-muted-foreground">Duplicar mensalmente até o mês selecionado</p>
              </div>
              <Switch checked={form.recurring} onCheckedChange={handleRecurringToggle} />
            </div>
            {form.recurring && (
              <div className="space-y-2">
                <Label>Até qual mês</Label>
                <Select value={form.recurringUntil} onValueChange={(value) => setForm({ ...form, recurringUntil: value })}>
                  <SelectTrigger>
                    <SelectValue placeholder="Selecione o mês final" />
                  </SelectTrigger>
                  <SelectContent>
                    {monthOptions.map((option) => (
                      <SelectItem key={option.value} value={option.value}>
                        {option.label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            )}
          </div>
          <div className="space-y-2">
            <Label>Categoria</Label>
            <Select value={form.category} onValueChange={(v) => setForm({ ...form, category: v })}>
              <SelectTrigger>
                <SelectValue placeholder="Selecione..." />
              </SelectTrigger>
              <SelectContent>
                {categories.map((cat) => (
                  <SelectItem key={cat} value={cat}>
                    {cat}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          <div className="space-y-2">
            <Label htmlFor="description">Observações</Label>
            <Textarea
              id="description"
              value={form.description}
              onChange={(e) => setForm({ ...form, description: e.target.value })}
              placeholder="Observações opcionais..."
              rows={3}
            />
          </div>
          <DialogFooter>
            <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>
              Cancelar
            </Button>
            <Button type="submit">
              {isEditing ? 'Salvar' : 'Criar'}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}

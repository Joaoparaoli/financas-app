import { useState, useMemo } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { SubscriptionAPI } from '@/lib/api';
import {
  formatCurrency,
  getFrequencyMultiplier,
  getFrequencyLabel,
  FREQUENCY_OPTIONS,
} from '@/lib/utils';
import { feedback } from '@/lib/feedback';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Badge } from '@/components/ui/badge';
import { Checkbox } from '@/components/ui/checkbox';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from '@/components/ui/dialog';
import { Plus, Pencil, Trash2, CalendarClock, RefreshCw } from 'lucide-react';
import { motion } from 'framer-motion';
import { cn } from '@/lib/utils';

const defaultForm = {
  name: '',
  amount: '',
  frequency: 'monthly',
  notes: '',
  isActive: true,
};

export default function SubscriptionsTab() {
  const queryClient = useQueryClient();
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editingSub, setEditingSub] = useState(null);
  const [form, setForm] = useState(defaultForm);

  const { data: subscriptions = [], isLoading, isError } = useQuery({
    queryKey: ['subscriptions'],
    queryFn: () => SubscriptionAPI.list(),
  });

  const createMutation = useMutation({
    mutationFn: (data) => SubscriptionAPI.create(data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['subscriptions'] });
      feedback('success');
      closeDialog();
    },
  });

  const updateMutation = useMutation({
    mutationFn: ({ id, data }) => SubscriptionAPI.update(id, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['subscriptions'] });
      feedback('success');
      closeDialog();
    },
  });

  const deleteMutation = useMutation({
    mutationFn: (id) => SubscriptionAPI.delete(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['subscriptions'] });
      feedback('delete');
    },
  });

  const monthlyCost = useMemo(() => {
    return subscriptions
      .filter((s) => s.isActive)
      .reduce((sum, s) => sum + s.amount * getFrequencyMultiplier(s.frequency), 0);
  }, [subscriptions]);

  const activeSubs = subscriptions.filter((s) => s.isActive);
  const inactiveSubs = subscriptions.filter((s) => !s.isActive);

  function closeDialog() {
    setDialogOpen(false);
    setEditingSub(null);
    setForm(defaultForm);
  }

  function openNew() {
    setEditingSub(null);
    setForm(defaultForm);
    setDialogOpen(true);
  }

  function openEdit(sub) {
    setEditingSub(sub);
    setForm({
      name: sub.name || '',
      amount: String(sub.amount || ''),
      frequency: sub.frequency || 'monthly',
      notes: sub.notes || '',
      isActive: sub.isActive !== false,
    });
    setDialogOpen(true);
  }

  function handleDelete(id) {
    if (!window.confirm('Tem certeza que deseja excluir esta assinatura?')) return;
    deleteMutation.mutate(id);
  }

  function handleSave(e) {
    e.preventDefault();
    if (!form.name || !form.amount) return;

    const payload = {
      name: form.name,
      amount: parseFloat(form.amount),
      frequency: form.frequency,
      notes: form.notes || null,
      isActive: form.isActive,
    };

    if (editingSub) {
      updateMutation.mutate({ id: editingSub.id, data: payload });
    } else {
      createMutation.mutate(payload);
    }
  }

  function SubCard({ sub }) {
    return (
      <Card className={cn('group transition-all duration-300 hover:shadow-lg hover:-translate-y-0.5', !sub.isActive && 'opacity-50')}>
        <CardContent className="p-4">
          <div className="flex items-start justify-between">
            <div className="flex-1 min-w-0">
              <h3 className="font-semibold text-sm">{sub.name}</h3>
              <div className="flex items-center gap-2 mt-1">
                <Badge variant="info" className="text-[10px]">
                  {getFrequencyLabel(sub.frequency)}
                </Badge>
                {!sub.isActive && (
                  <Badge variant="secondary" className="text-[10px]">
                    Inativa
                  </Badge>
                )}
              </div>
              <p className="text-lg font-bold mt-2">{formatCurrency(sub.amount)}</p>
              {sub.notes && (
                <p className="text-xs text-muted-foreground mt-1 line-clamp-2">
                  {sub.notes}
                </p>
              )}
            </div>
            <div className="flex gap-0.5 opacity-0 group-hover:opacity-100 transition-opacity">
              <Button variant="ghost" size="icon-sm" onClick={() => openEdit(sub)}>
                <Pencil className="h-3.5 w-3.5" />
              </Button>
              <Button
                variant="ghost"
                size="icon-sm"
                className="text-destructive"
                onClick={() => handleDelete(sub.id)}
              >
                <Trash2 className="h-3.5 w-3.5" />
              </Button>
            </div>
          </div>
        </CardContent>
      </Card>
    );
  }

  if (isLoading) {
    return <p className="text-center py-10 text-muted-foreground">Carregando...</p>;
  }

  if (isError) {
    return (
      <div className="text-center py-16">
        <p className="text-muted-foreground">Não foi possível carregar as assinaturas agora.</p>
        <Button className="mt-4" onClick={() => queryClient.invalidateQueries({ queryKey: ['subscriptions'] })}>
          Tentar novamente
        </Button>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold font-display">Assinaturas</h2>
          <div className="flex items-center gap-2 mt-1">
            <RefreshCw className="h-4 w-4 text-muted-foreground" />
            <span className="text-sm text-muted-foreground">
              Custo mensal estimado:{' '}
              <span className="font-semibold text-foreground">
                {formatCurrency(monthlyCost)}
              </span>
            </span>
          </div>
        </div>
        <Button onClick={openNew} size="sm">
          <Plus className="h-4 w-4 mr-1" /> Nova Assinatura
        </Button>
      </div>

      {/* Active Subscriptions */}
      {activeSubs.length === 0 && inactiveSubs.length === 0 ? (
        <div className="text-center py-16">
          <div className="mx-auto mb-4 h-16 w-16 rounded-2xl bg-primary/10 flex items-center justify-center">
            <CalendarClock className="h-8 w-8 text-primary/60" />
          </div>
          <p className="text-muted-foreground font-medium">Nenhuma assinatura cadastrada</p>
          <Button className="mt-4" onClick={openNew}>
            <Plus className="h-4 w-4 mr-1" /> Adicionar Assinatura
          </Button>
        </div>
      ) : (
        <>
          {activeSubs.length > 0 && (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
              {activeSubs.map((sub, index) => (
                <motion.div
                  key={sub.id}
                  initial={{ opacity: 0, y: 12 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.3, delay: index * 0.05 }}
                >
                  <SubCard sub={sub} />
                </motion.div>
              ))}
            </div>
          )}

          {inactiveSubs.length > 0 && (
            <div className="space-y-3">
              <h3 className="text-sm font-medium text-muted-foreground uppercase tracking-wider">
                Inativas ({inactiveSubs.length})
              </h3>
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                {inactiveSubs.map((sub) => (
                  <SubCard key={sub.id} sub={sub} />
                ))}
              </div>
            </div>
          )}
        </>
      )}

      {/* Dialog */}
      <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
        <DialogContent className="sm:max-w-[520px] max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>
              {editingSub ? 'Editar Assinatura' : 'Nova Assinatura'}
            </DialogTitle>
          </DialogHeader>
          <form onSubmit={handleSave} className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="name">Nome</Label>
              <Input
                id="name"
                value={form.name}
                onChange={(e) => setForm({ ...form, name: e.target.value })}
                placeholder="Ex: Netflix, Spotify..."
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
                required
              />
            </div>
            <div className="space-y-2">
              <Label>Frequência</Label>
              <Select
                value={form.frequency}
                onValueChange={(v) => setForm({ ...form, frequency: v })}
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {FREQUENCY_OPTIONS.map((opt) => (
                    <SelectItem key={opt.value} value={opt.value}>
                      {opt.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Label htmlFor="notes">Observações</Label>
              <Textarea
                id="notes"
                value={form.notes}
                onChange={(e) => setForm({ ...form, notes: e.target.value })}
                rows={2}
              />
            </div>
            <div className="flex items-center space-x-2">
              <Checkbox
                id="isActive"
                checked={form.isActive}
                onCheckedChange={(checked) => setForm({ ...form, isActive: !!checked })}
              />
              <Label htmlFor="isActive" className="cursor-pointer">
                Assinatura ativa
              </Label>
            </div>
            <DialogFooter>
              <Button type="button" variant="outline" onClick={closeDialog}>
                Cancelar
              </Button>
              <Button type="submit">
                {editingSub ? 'Salvar' : 'Criar'}
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>
    </div>
  );
}

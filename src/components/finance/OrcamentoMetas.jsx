import { useState, useMemo } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { FinancialGoalAPI } from '@/lib/api';
import { formatCurrency, GOAL_CATEGORIES } from '@/lib/utils';
import { feedback } from '@/lib/feedback';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
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
import StatCard from '@/components/finance/StatCard';
import { Plus, Target, PiggyBank, TrendingUp, CheckCircle2 } from 'lucide-react';
import { motion } from 'framer-motion';
import { format, differenceInDays, isPast } from 'date-fns';
import { ptBR } from 'date-fns/locale/pt-BR';

const defaultForm = {
  title: '',
  description: '',
  targetAmount: '',
  currentAmount: '',
  targetDate: '',
  category: 'other',
  status: 'active',
  icon: '🎯',
};

export default function OrcamentoMetas() {
  const queryClient = useQueryClient();
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editingGoal, setEditingGoal] = useState(null);
  const [form, setForm] = useState(defaultForm);

  const { data: goals = [], isLoading } = useQuery({
    queryKey: ['financial-goals'],
    queryFn: () => FinancialGoalAPI.list(),
  });

  const createMutation = useMutation({
    mutationFn: (data) => FinancialGoalAPI.create(data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['financial-goals'] });
      feedback('success');
      closeDialog();
    },
  });

  const updateMutation = useMutation({
    mutationFn: ({ id, data }) => FinancialGoalAPI.update(id, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['financial-goals'] });
      feedback('success');
      closeDialog();
    },
  });

  const deleteMutation = useMutation({
    mutationFn: (id) => FinancialGoalAPI.delete(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['financial-goals'] });
      feedback('delete');
    },
  });

  const stats = useMemo(() => {
    const active = goals.filter((g) => g.status === 'active');
    const totalSaved = goals.reduce((s, g) => s + (g.currentAmount || 0), 0);
    const totalTarget = goals.reduce((s, g) => s + (g.targetAmount || 0), 0);
    const overallProgress = totalTarget > 0 ? (totalSaved / totalTarget) * 100 : 0;
    return {
      activeCount: active.length,
      totalSaved,
      overallProgress: Math.min(overallProgress, 100),
    };
  }, [goals]);

  function closeDialog() {
    setDialogOpen(false);
    setEditingGoal(null);
    setForm(defaultForm);
  }

  function openNew() {
    setEditingGoal(null);
    setForm(defaultForm);
    setDialogOpen(true);
  }

  function openEdit(goal) {
    setEditingGoal(goal);
    setForm({
      title: goal.title || '',
      description: goal.description || '',
      targetAmount: String(goal.targetAmount || ''),
      currentAmount: String(goal.currentAmount || ''),
      targetDate: goal.targetDate
        ? format(new Date(goal.targetDate), 'yyyy-MM-dd')
        : '',
      category: goal.category || 'other',
      status: goal.status || 'active',
      icon: goal.icon || '🎯',
    });
    setDialogOpen(true);
  }

  function handleDelete(id) {
    if (!window.confirm('Tem certeza que deseja excluir esta meta?')) return;
    deleteMutation.mutate(id);
  }

  function handleComplete(goal) {
    updateMutation.mutate({
      id: goal.id,
      data: { status: 'completed' },
    });
  }

  function handleSave(e) {
    e.preventDefault();
    if (!form.title || !form.targetAmount || !form.targetDate) return;

    const payload = {
      title: form.title,
      description: form.description || null,
      targetAmount: parseFloat(form.targetAmount),
      currentAmount: parseFloat(form.currentAmount) || 0,
      targetDate: new Date(form.targetDate + 'T12:00:00').toISOString(),
      category: form.category,
      icon: form.icon || '🎯',
    };

    if (editingGoal) {
      payload.status = form.status;
      updateMutation.mutate({ id: editingGoal.id, data: payload });
    } else {
      createMutation.mutate(payload);
    }
  }

  function getGoalProgress(goal) {
    if (!goal.targetAmount) return 0;
    return Math.min((goal.currentAmount / goal.targetAmount) * 100, 100);
  }

  function getStatusBadge(goal) {
    const progress = getGoalProgress(goal);
    if (goal.status === 'completed') {
      return <Badge variant="success">Concluída</Badge>;
    }
    if (goal.status === 'paused') {
      return <Badge variant="warning">Pausada</Badge>;
    }
    const targetDate = new Date(goal.targetDate);
    if (isPast(targetDate) && progress < 100) {
      return <Badge variant="destructive">Atrasada</Badge>;
    }
    return <Badge variant="purple">Ativa</Badge>;
  }

  function getDaysInfo(goal) {
    const targetDate = new Date(goal.targetDate);
    const days = differenceInDays(targetDate, new Date());
    if (days < 0) return `${Math.abs(days)} dias de atraso`;
    if (days === 0) return 'Vence hoje';
    return `Faltam ${days} dias`;
  }

  function getCategoryEmoji(category) {
    return GOAL_CATEGORIES.find((c) => c.value === category)?.emoji || '🎯';
  }

  if (isLoading) {
    return <p className="text-center py-10 text-muted-foreground">Carregando...</p>;
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <h2 className="text-2xl font-bold font-display">Metas Financeiras</h2>
        <Button onClick={openNew} size="sm">
          <Plus className="h-4 w-4 mr-1" /> Nova Meta
        </Button>
      </div>

      {/* Stat Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
        <StatCard
          title="Metas Ativas"
          value={stats.activeCount}
          icon={Target}
        />
        <StatCard
          title="Total Economizado"
          value={formatCurrency(stats.totalSaved)}
          icon={PiggyBank}
          valueClassName="text-emerald-600"
        />
        <StatCard
          title="Progresso Geral"
          value={`${stats.overallProgress.toFixed(1)}%`}
          icon={TrendingUp}
        />
      </div>

      {/* Goals Grid */}
      {goals.length === 0 ? (
        <div className="text-center py-16">
          <div className="mx-auto mb-4 h-16 w-16 rounded-2xl bg-primary/10 flex items-center justify-center">
            <Target className="h-8 w-8 text-primary/60" />
          </div>
          <p className="text-muted-foreground font-medium">Nenhuma meta cadastrada</p>
          <Button className="mt-4" onClick={openNew}>
            <Plus className="h-4 w-4 mr-1" /> Criar Meta
          </Button>
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {goals.map((goal, index) => {
            const progress = getGoalProgress(goal);
            const remaining = Math.max(goal.targetAmount - goal.currentAmount, 0);

            return (
              <motion.div
                key={goal.id}
                initial={{ opacity: 0, y: 12 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.3, delay: index * 0.05 }}
              >
                <Card
                  className="cursor-pointer hover:shadow-lg hover:-translate-y-0.5 transition-all duration-300"
                  onClick={() => openEdit(goal)}
                >
                <CardContent className="p-5">
                  <div className="flex items-start justify-between mb-3">
                    <div className="flex items-center gap-2">
                      <span className="text-2xl">{goal.icon || getCategoryEmoji(goal.category)}</span>
                      <div>
                        <h3 className="font-semibold text-sm">{goal.title}</h3>
                        <p className="text-xs text-muted-foreground">
                          {GOAL_CATEGORIES.find((c) => c.value === goal.category)?.label || goal.category}
                        </p>
                      </div>
                    </div>
                    {getStatusBadge(goal)}
                  </div>

                  <div className="space-y-2">
                    <div className="flex items-center justify-between text-xs">
                      <span className="text-muted-foreground">Progresso</span>
                      <span className="font-medium">{progress.toFixed(1)}%</span>
                    </div>
                    <Progress
                      value={progress}
                      className="h-2"
                      indicatorClassName={
                        progress >= 100
                          ? 'bg-emerald-500'
                          : progress >= 50
                          ? 'bg-blue-500'
                          : 'bg-amber-500'
                      }
                    />
                    <div className="flex justify-between text-xs">
                      <span className="text-emerald-600 dark:text-emerald-400 font-medium">
                        {formatCurrency(goal.currentAmount)}
                      </span>
                      <span className="text-muted-foreground">
                        de {formatCurrency(goal.targetAmount)}
                      </span>
                    </div>
                  </div>

                  <div className="mt-3 pt-3 border-t space-y-1">
                    <div className="flex justify-between text-xs">
                      <span className="text-muted-foreground">Faltam</span>
                      <span className="font-medium">{formatCurrency(remaining)}</span>
                    </div>
                    <div className="flex justify-between text-xs">
                      <span className="text-muted-foreground">Data Alvo</span>
                      <span className="font-medium">
                        {format(new Date(goal.targetDate), 'dd/MM/yyyy')}
                      </span>
                    </div>
                    <p className="text-xs text-muted-foreground mt-1">
                      {getDaysInfo(goal)}
                    </p>
                  </div>

                  {progress >= 100 && goal.status !== 'completed' && (
                    <Button
                      variant="success"
                      size="sm"
                      className="w-full mt-3"
                      onClick={(e) => {
                        e.stopPropagation();
                        handleComplete(goal);
                      }}
                    >
                      <CheckCircle2 className="h-4 w-4 mr-1" /> Concluir Meta
                    </Button>
                  )}
                </CardContent>
                </Card>
              </motion.div>
            );
          })}
        </div>
      )}

      {/* Dialog */}
      <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
        <DialogContent className="sm:max-w-[520px] max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>
              {editingGoal ? 'Editar Meta' : 'Nova Meta'}
            </DialogTitle>
          </DialogHeader>
          <form onSubmit={handleSave} className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="title">Título</Label>
              <Input
                id="title"
                value={form.title}
                onChange={(e) => setForm({ ...form, title: e.target.value })}
                placeholder="Ex: Reserva de emergência"
                required
              />
            </div>
            <div className="space-y-2">
              <Label>Categoria</Label>
              <Select
                value={form.category}
                onValueChange={(v) => {
                  const cat = GOAL_CATEGORIES.find((c) => c.value === v);
                  setForm({ ...form, category: v, icon: cat?.emoji || form.icon });
                }}
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {GOAL_CATEGORIES.map((cat) => (
                    <SelectItem key={cat.value} value={cat.value}>
                      {cat.emoji} {cat.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-2">
                <Label htmlFor="targetAmount">Valor Alvo (R$)</Label>
                <Input
                  id="targetAmount"
                  type="number"
                  step="0.01"
                  min="0"
                  value={form.targetAmount}
                  onChange={(e) => setForm({ ...form, targetAmount: e.target.value })}
                  required
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="currentAmount">Valor Atual (R$)</Label>
                <Input
                  id="currentAmount"
                  type="number"
                  step="0.01"
                  min="0"
                  value={form.currentAmount}
                  onChange={(e) => setForm({ ...form, currentAmount: e.target.value })}
                />
              </div>
            </div>
            <div className="space-y-2">
              <Label htmlFor="targetDate">Data Alvo</Label>
              <Input
                id="targetDate"
                type="date"
                value={form.targetDate}
                onChange={(e) => setForm({ ...form, targetDate: e.target.value })}
                required
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="icon">Emoji</Label>
              <Input
                id="icon"
                value={form.icon}
                onChange={(e) => setForm({ ...form, icon: e.target.value })}
                placeholder="🎯"
                maxLength={4}
                className="w-20 text-center text-xl"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="description">Descrição</Label>
              <Textarea
                id="description"
                value={form.description}
                onChange={(e) => setForm({ ...form, description: e.target.value })}
                rows={2}
              />
            </div>
            {editingGoal && (
              <div className="space-y-2">
                <Label>Status</Label>
                <Select
                  value={form.status}
                  onValueChange={(v) => setForm({ ...form, status: v })}
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="active">Ativa</SelectItem>
                    <SelectItem value="paused">Pausada</SelectItem>
                    <SelectItem value="completed">Concluída</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            )}
            <DialogFooter className="gap-2">
              {editingGoal && (
                <Button
                  type="button"
                  variant="destructive"
                  onClick={() => handleDelete(editingGoal.id)}
                >
                  Excluir
                </Button>
              )}
              <Button type="button" variant="outline" onClick={closeDialog}>
                Cancelar
              </Button>
              <Button type="submit">
                {editingGoal ? 'Salvar' : 'Criar'}
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>
    </div>
  );
}

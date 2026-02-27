import { useState, useMemo } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { AssetAPI, LiabilityAPI } from '@/lib/api';
import { formatCurrency, ASSET_TYPES, LIABILITY_TYPES } from '@/lib/utils';
import { feedback } from '@/lib/feedback';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
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
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from '@/components/ui/dialog';
import StatCard from '@/components/finance/StatCard';
import {
  Plus,
  TrendingUp,
  TrendingDown,
  Building2,
  ArrowDownCircle,
  ArrowUpCircle,
  Pencil,
  Trash2,
} from 'lucide-react';
import { format } from 'date-fns';

const defaultForm = {
  type: '',
  name: '',
  currentValue: '',
  monthlyIncome: '',
  monthlyExpense: '',
  acquisitionDate: '',
  acquisitionValue: '',
  notes: '',
};

export default function Patrimonio() {
  const queryClient = useQueryClient();
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editingItem, setEditingItem] = useState(null);
  const [itemType, setItemType] = useState('asset');
  const [form, setForm] = useState(defaultForm);

  const {
    data: assets = [],
    isLoading: loadingAssets,
    isError: errorAssets,
  } = useQuery({
    queryKey: ['assets'],
    queryFn: () => AssetAPI.list(),
  });

  const {
    data: liabilities = [],
    isLoading: loadingLiabilities,
    isError: errorLiabilities,
  } = useQuery({
    queryKey: ['liabilities'],
    queryFn: () => LiabilityAPI.list(),
  });

  const createAsset = useMutation({
    mutationFn: (data) => AssetAPI.create(data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['assets'] });
      feedback('success');
      closeDialog();
    },
  });

  const updateAsset = useMutation({
    mutationFn: ({ id, data }) => AssetAPI.update(id, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['assets'] });
      feedback('success');
      closeDialog();
    },
  });

  const deleteAsset = useMutation({
    mutationFn: (id) => AssetAPI.delete(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['assets'] });
      feedback('delete');
    },
  });

  const createLiability = useMutation({
    mutationFn: (data) => LiabilityAPI.create(data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['liabilities'] });
      feedback('success');
      closeDialog();
    },
  });

  const updateLiability = useMutation({
    mutationFn: ({ id, data }) => LiabilityAPI.update(id, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['liabilities'] });
      feedback('success');
      closeDialog();
    },
  });

  const deleteLiability = useMutation({
    mutationFn: (id) => LiabilityAPI.delete(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['liabilities'] });
      feedback('delete');
    },
  });

  const stats = useMemo(() => {
    const totalAssets = assets.reduce((s, a) => s + (a.currentValue || 0), 0);
    const totalLiabilities = liabilities.reduce((s, l) => s + (l.currentValue || 0), 0);
    const depreciation = liabilities.reduce((s, l) => {
      if (l.acquisitionValue && l.currentValue) {
        return s + (l.acquisitionValue - l.currentValue);
      }
      return s;
    }, 0);
    const monthlyIncome = assets.reduce((s, a) => s + (a.monthlyIncome || 0), 0);
    const monthlyExpense = liabilities.reduce((s, l) => s + (l.monthlyExpense || 0), 0);
    return {
      total: totalAssets - totalLiabilities,
      totalAssets,
      totalLiabilities,
      depreciation,
      monthlyIncome,
      monthlyExpense,
    };
  }, [assets, liabilities]);

  function closeDialog() {
    setDialogOpen(false);
    setEditingItem(null);
    setForm(defaultForm);
  }

  function openNew(type) {
    setItemType(type);
    setEditingItem(null);
    const types = type === 'asset' ? ASSET_TYPES : LIABILITY_TYPES;
    setForm({ ...defaultForm, type: types[0]?.value || '' });
    setDialogOpen(true);
  }

  function openEdit(item, type) {
    setItemType(type);
    setEditingItem(item);
    setForm({
      type: item.type || '',
      name: item.name || '',
      currentValue: String(item.currentValue || ''),
      monthlyIncome: String(item.monthlyIncome || ''),
      monthlyExpense: String(item.monthlyExpense || ''),
      acquisitionDate: item.acquisitionDate
        ? format(new Date(item.acquisitionDate), 'yyyy-MM-dd')
        : '',
      acquisitionValue: String(item.acquisitionValue || ''),
      notes: item.notes || '',
    });
    setDialogOpen(true);
  }

  function handleDelete(id, type) {
    if (!window.confirm('Tem certeza que deseja excluir?')) return;
    if (type === 'asset') {
      deleteAsset.mutate(id);
    } else {
      deleteLiability.mutate(id);
    }
  }

  function handleSave(e) {
    e.preventDefault();
    if (!form.name || !form.type) return;

    const payload = {
      type: form.type,
      name: form.name,
      currentValue: parseFloat(form.currentValue) || 0,
      acquisitionDate: form.acquisitionDate
        ? new Date(form.acquisitionDate + 'T12:00:00').toISOString()
        : null,
      acquisitionValue: form.acquisitionValue
        ? parseFloat(form.acquisitionValue)
        : null,
      notes: form.notes || null,
    };

    if (itemType === 'asset') {
      payload.monthlyIncome = parseFloat(form.monthlyIncome) || 0;
      if (editingItem) {
        updateAsset.mutate({ id: editingItem.id, data: payload });
      } else {
        createAsset.mutate(payload);
      }
    } else {
      payload.monthlyExpense = parseFloat(form.monthlyExpense) || 0;
      if (editingItem) {
        updateLiability.mutate({ id: editingItem.id, data: payload });
      } else {
        createLiability.mutate(payload);
      }
    }
  }

  const typeOptions = itemType === 'asset' ? ASSET_TYPES : LIABILITY_TYPES;

  function getTypeLabel(type, isAsset) {
    const list = isAsset ? ASSET_TYPES : LIABILITY_TYPES;
    return list.find((t) => t.value === type)?.label || type;
  }

  if (loadingAssets || loadingLiabilities) {
    return <p className="text-center py-10 text-muted-foreground">Carregando...</p>;
  }

  if (errorAssets || errorLiabilities) {
    return (
      <div className="text-center py-16 space-y-4">
        <p className="text-muted-foreground">Não foi possível carregar o patrimônio agora.</p>
        <Button
          onClick={() => {
            queryClient.invalidateQueries({ queryKey: ['assets'] });
            queryClient.invalidateQueries({ queryKey: ['liabilities'] });
          }}
        >
          Tentar novamente
        </Button>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <h2 className="text-2xl font-bold font-display">Patrimônio</h2>
        <div className="flex gap-2">
          <Button variant="success" size="sm" onClick={() => openNew('asset')}>
            <Plus className="h-4 w-4 mr-1" /> Ativo
          </Button>
          <Button variant="destructive" size="sm" onClick={() => openNew('liability')}>
            <Plus className="h-4 w-4 mr-1" /> Passivo
          </Button>
        </div>
      </div>

      {/* Stat Cards */}
      <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-3">
        <StatCard
          title="Patrimônio Total"
          value={formatCurrency(stats.total)}
          icon={Building2}
          valueClassName={stats.total >= 0 ? 'text-emerald-600' : 'text-red-500'}
        />
        <StatCard
          title="Total Ativos"
          value={formatCurrency(stats.totalAssets)}
          icon={TrendingUp}
          valueClassName="text-emerald-600"
        />
        <StatCard
          title="Total Passivos"
          value={formatCurrency(stats.totalLiabilities)}
          icon={TrendingDown}
          valueClassName="text-red-500"
        />
        <StatCard
          title="Depreciação"
          value={formatCurrency(stats.depreciation)}
          icon={ArrowDownCircle}
          valueClassName="text-red-500"
        />
        <StatCard
          title="Renda Mensal"
          value={formatCurrency(stats.monthlyIncome)}
          icon={ArrowUpCircle}
          valueClassName="text-emerald-600"
        />
        <StatCard
          title="Despesa Mensal"
          value={formatCurrency(stats.monthlyExpense)}
          icon={ArrowDownCircle}
          valueClassName="text-red-500"
        />
      </div>

      {/* Asset/Liability Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {/* Ativos */}
        <Card className="border-emerald-200 dark:border-emerald-800/40">
          <CardHeader className="bg-emerald-50 dark:bg-emerald-900/20 rounded-t-lg pb-3">
            <CardTitle className="text-lg text-emerald-800 dark:text-emerald-300">
              <TrendingUp className="inline h-5 w-5 mr-2" />
              Ativos ({assets.length})
            </CardTitle>
          </CardHeader>
          <CardContent className="p-3 space-y-2">
            {assets.length === 0 ? (
              <p className="text-sm text-muted-foreground text-center py-4">
                Nenhum ativo cadastrado
              </p>
            ) : (
              assets.map((asset) => (
                <div
                  key={asset.id}
                  className="group flex items-center justify-between p-3 rounded-md border border-emerald-100 dark:border-emerald-800/30 bg-emerald-50/30 dark:bg-emerald-900/10 hover:bg-emerald-50 dark:hover:bg-emerald-900/20 cursor-pointer transition-all duration-200"
                  onClick={() => openEdit(asset, 'asset')}
                >
                  <div className="flex-1 min-w-0">
                    <p className="font-medium text-sm">{asset.name}</p>
                    <p className="text-xs text-muted-foreground">
                      {getTypeLabel(asset.type, true)}
                    </p>
                    {asset.monthlyIncome > 0 && (
                      <p className="text-xs text-emerald-600 dark:text-emerald-400">
                        Renda: {formatCurrency(asset.monthlyIncome)}/mês
                      </p>
                    )}
                  </div>
                  <div className="flex items-center gap-2">
                    <span className="font-semibold text-sm text-emerald-600 dark:text-emerald-400">
                      {formatCurrency(asset.currentValue)}
                    </span>
                    <div className="flex gap-0.5 opacity-0 group-hover:opacity-100 transition-opacity">
                      <Button
                        variant="ghost"
                        size="icon-sm"
                        onClick={(e) => {
                          e.stopPropagation();
                          openEdit(asset, 'asset');
                        }}
                      >
                        <Pencil className="h-3.5 w-3.5" />
                      </Button>
                      <Button
                        variant="ghost"
                        size="icon-sm"
                        className="text-destructive"
                        onClick={(e) => {
                          e.stopPropagation();
                          handleDelete(asset.id, 'asset');
                        }}
                      >
                        <Trash2 className="h-3.5 w-3.5" />
                      </Button>
                    </div>
                  </div>
                </div>
              ))
            )}
          </CardContent>
        </Card>

        {/* Passivos */}
        <Card className="border-red-200 dark:border-red-800/40">
          <CardHeader className="bg-red-50 dark:bg-red-900/20 rounded-t-lg pb-3">
            <CardTitle className="text-lg text-red-800 dark:text-red-300">
              <TrendingDown className="inline h-5 w-5 mr-2" />
              Passivos ({liabilities.length})
            </CardTitle>
          </CardHeader>
          <CardContent className="p-3 space-y-2">
            {liabilities.length === 0 ? (
              <p className="text-sm text-muted-foreground text-center py-4">
                Nenhum passivo cadastrado
              </p>
            ) : (
              liabilities.map((liability) => (
                <div
                  key={liability.id}
                  className="group flex items-center justify-between p-3 rounded-md border border-red-100 dark:border-red-800/30 bg-red-50/30 dark:bg-red-900/10 hover:bg-red-50 dark:hover:bg-red-900/20 cursor-pointer transition-all duration-200"
                  onClick={() => openEdit(liability, 'liability')}
                >
                  <div className="flex-1 min-w-0">
                    <p className="font-medium text-sm">{liability.name}</p>
                    <p className="text-xs text-muted-foreground">
                      {getTypeLabel(liability.type, false)}
                    </p>
                    {liability.monthlyExpense > 0 && (
                      <p className="text-xs text-red-500 dark:text-red-400">
                        Despesa: {formatCurrency(liability.monthlyExpense)}/mês
                      </p>
                    )}
                  </div>
                  <div className="flex items-center gap-2">
                    <span className="font-semibold text-sm text-red-500 dark:text-red-400">
                      {formatCurrency(liability.currentValue)}
                    </span>
                    <div className="flex gap-0.5 opacity-0 group-hover:opacity-100 transition-opacity">
                      <Button
                        variant="ghost"
                        size="icon-sm"
                        onClick={(e) => {
                          e.stopPropagation();
                          openEdit(liability, 'liability');
                        }}
                      >
                        <Pencil className="h-3.5 w-3.5" />
                      </Button>
                      <Button
                        variant="ghost"
                        size="icon-sm"
                        className="text-destructive"
                        onClick={(e) => {
                          e.stopPropagation();
                          handleDelete(liability.id, 'liability');
                        }}
                      >
                        <Trash2 className="h-3.5 w-3.5" />
                      </Button>
                    </div>
                  </div>
                </div>
              ))
            )}
          </CardContent>
        </Card>
      </div>

      {/* Dialog */}
      <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
        <DialogContent className="sm:max-w-[520px] max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>
              {editingItem ? 'Editar' : 'Novo'}{' '}
              {itemType === 'asset' ? 'Ativo' : 'Passivo'}
            </DialogTitle>
          </DialogHeader>
          <form onSubmit={handleSave} className="space-y-4">
            <div className="space-y-2">
              <Label>Tipo</Label>
              <Select value={form.type} onValueChange={(v) => setForm({ ...form, type: v })}>
                <SelectTrigger>
                  <SelectValue placeholder="Selecione..." />
                </SelectTrigger>
                <SelectContent>
                  {typeOptions.map((t) => (
                    <SelectItem key={t.value} value={t.value}>
                      {t.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Label htmlFor="name">Nome</Label>
              <Input
                id="name"
                value={form.name}
                onChange={(e) => setForm({ ...form, name: e.target.value })}
                required
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="currentValue">Valor Atual (R$)</Label>
              <Input
                id="currentValue"
                type="number"
                step="0.01"
                value={form.currentValue}
                onChange={(e) => setForm({ ...form, currentValue: e.target.value })}
              />
            </div>
            {itemType === 'asset' ? (
              <div className="space-y-2">
                <Label htmlFor="monthlyIncome">Renda Mensal (R$)</Label>
                <Input
                  id="monthlyIncome"
                  type="number"
                  step="0.01"
                  value={form.monthlyIncome}
                  onChange={(e) => setForm({ ...form, monthlyIncome: e.target.value })}
                />
              </div>
            ) : (
              <div className="space-y-2">
                <Label htmlFor="monthlyExpense">Despesa Mensal (R$)</Label>
                <Input
                  id="monthlyExpense"
                  type="number"
                  step="0.01"
                  value={form.monthlyExpense}
                  onChange={(e) => setForm({ ...form, monthlyExpense: e.target.value })}
                />
              </div>
            )}
            <div className="space-y-2">
              <Label htmlFor="acquisitionDate">Data de Aquisição</Label>
              <Input
                id="acquisitionDate"
                type="date"
                value={form.acquisitionDate}
                onChange={(e) => setForm({ ...form, acquisitionDate: e.target.value })}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="acquisitionValue">Valor de Aquisição (R$)</Label>
              <Input
                id="acquisitionValue"
                type="number"
                step="0.01"
                value={form.acquisitionValue}
                onChange={(e) => setForm({ ...form, acquisitionValue: e.target.value })}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="notes">Observações</Label>
              <Textarea
                id="notes"
                value={form.notes}
                onChange={(e) => setForm({ ...form, notes: e.target.value })}
                rows={3}
              />
            </div>
            <DialogFooter>
              <Button type="button" variant="outline" onClick={closeDialog}>
                Cancelar
              </Button>
              <Button type="submit">
                {editingItem ? 'Salvar' : 'Criar'}
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>
    </div>
  );
}

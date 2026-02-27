import { useState } from 'react'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { CreditCardAPI, TransactionAPI } from '@/lib/api'
import { formatCurrency } from '@/lib/utils'
import { feedback } from '@/lib/feedback'
import { Card, CardContent } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Switch } from '@/components/ui/switch'
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from '@/components/ui/dialog'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { format } from 'date-fns'
import { Avatar, AvatarFallback } from '@/components/ui/avatar'
import {
  Plus,
  Pencil,
  Trash2,
  CreditCard as CreditCardIcon,
  Building2,
  Calendar,
  ShoppingBag,
} from 'lucide-react'
import Cards from 'react-credit-cards-2'
import { motion } from 'framer-motion'

const defaultForm = {
  name: '',
  institution: '',
  closingDay: '',
  dueDay: '',
  creditLimit: '',
  color: '#6366f1',
}

const PRESET_CARDS = [
  {
    name: 'Nubank Platinum',
    institution: 'Nubank',
    number: '5162 8034 1234 5678',
    expiry: '08/29',
    cvc: '312',
    closingDay: 2,
    dueDay: 10,
    color: '#9333ea',
    creditLimit: 15000,
  },
  {
    name: 'Banco Inter Black',
    institution: 'Banco Inter',
    number: '5520 1010 2222 3333',
    expiry: '05/28',
    cvc: '221',
    closingDay: 5,
    dueDay: 15,
    color: '#f97316',
    creditLimit: 12000,
  },
  {
    name: 'Itaú Personnalité',
    institution: 'Itaú',
    number: '4552 9090 5566 7788',
    expiry: '11/27',
    cvc: '987',
    closingDay: 12,
    dueDay: 22,
    color: '#0f172a',
    creditLimit: 20000,
  },
  {
    name: 'Bradesco Prime',
    institution: 'Bradesco',
    number: '4029 4412 8888 5555',
    expiry: '01/30',
    cvc: '555',
    closingDay: 8,
    dueDay: 18,
    color: '#dc2626',
    creditLimit: 10000,
  },
]

const INSTITUTION_META = {
  'Nubank': { logo: '🟣', color: '#9333ea' },
  'Banco Inter': { logo: '🟠', color: '#f97316' },
  'Itaú': { logo: '🟧', color: '#ff6a00' },
  'Bradesco': { logo: '🔴', color: '#dc2626' },
  'Santander': { logo: '🟥', color: '#b91c1c' },
  'Caixa': { logo: '🟦', color: '#2563eb' },
}

function getInstitutionMeta(name) {
  return INSTITUTION_META[name] || { logo: name?.[0] || '🏦', color: '#0f172a' }
}

const cardHover = {
  initial: { y: 0, rotateX: 0, rotateY: 0 },
  hover: { y: -6, rotateX: 2, rotateY: -2 },
}

function maskCardNumber(number) {
  if (!number) return '•••• •••• •••• 0000'
  return number
    .replace(/\s+/g, '')
    .replace(/(\d{4})(?=\d)/g, '$1 ')
    .replace(/\d(?=\d{4})/g, '•')
    .trim()
}

function CartoesTab() {
  const queryClient = useQueryClient()

  const [dialogOpen, setDialogOpen] = useState(false)
  const [editingCard, setEditingCard] = useState(null)
  const [form, setForm] = useState(defaultForm)
  const [chargeDialogOpen, setChargeDialogOpen] = useState(false)
  const [chargeCard, setChargeCard] = useState(null)
  const [chargeForm, setChargeForm] = useState({
    title: '',
    amount: '',
    date: format(new Date(), 'yyyy-MM-dd'),
    isInstallment: false,
    installments: '1',
  })

  const { data: cards = [], isLoading } = useQuery({
    queryKey: ['credit-cards'],
    queryFn: () => CreditCardAPI.list(),
  })

  const chargeMutation = useMutation({
    mutationFn: (data) => TransactionAPI.create(data),
    onSuccess: () => {
      feedback('success')
      closeChargeDialog()
    },
  })

  const createMutation = useMutation({
    mutationFn: (data) => CreditCardAPI.create(data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['credit-cards'] })
      feedback('success')
      closeDialog()
    },
  })

  const updateMutation = useMutation({
    mutationFn: ({ id, data }) => CreditCardAPI.update(id, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['credit-cards'] })
      feedback('success')
      closeDialog()
    },
  })

  const deleteMutation = useMutation({
    mutationFn: (id) => CreditCardAPI.delete(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['credit-cards'] })
      feedback('delete')
    },
  })

  function closeDialog() {
    setDialogOpen(false)
    setEditingCard(null)
    setForm(defaultForm)
  }

  function handlePreset(preset) {
    setEditingCard(null)
    setForm({
      name: preset.name,
      institution: preset.institution,
      closingDay: preset.closingDay?.toString() || '',
      dueDay: preset.dueDay?.toString() || '',
      creditLimit: preset.creditLimit?.toString() || '',
      color: preset.color || defaultForm.color,
    })
    setDialogOpen(true)
  }

  function openCreateDialog() {
    setEditingCard(null)
    setForm(defaultForm)
    setDialogOpen(true)
  }

  function openEditDialog(card) {
    setEditingCard(card)
    setForm({
      name: card.name,
      institution: card.institution,
      closingDay: card.closingDay ?? '',
      dueDay: card.dueDay ?? '',
      creditLimit: card.creditLimit ?? '',
      color: card.color || '#6366f1',
    })
    setDialogOpen(true)
  }

  function handleDelete(card) {
    if (window.confirm(`Deseja realmente excluir o cartao "${card.name}"?`)) {
      deleteMutation.mutate(card.id)
    }
  }

  function handleSubmit(e) {
    e.preventDefault()

    const payload = {
      name: form.name,
      institution: form.institution,
      closingDay: form.closingDay ? Number(form.closingDay) : null,
      dueDay: form.dueDay ? Number(form.dueDay) : null,
      creditLimit: form.creditLimit ? Number(form.creditLimit) : null,
      color: form.color,
    }

    if (editingCard) {
      updateMutation.mutate({ id: editingCard.id, data: payload })
    } else {
      createMutation.mutate(payload)
    }
  }

  function handleChange(field, value) {
    setForm((prev) => ({ ...prev, [field]: value }))
  }

  function openChargeDialog(card) {
    setChargeCard(card)
    setChargeForm({
      title: '',
      amount: '',
      date: format(new Date(), 'yyyy-MM-dd'),
      isInstallment: false,
      installments: '1',
    })
    setChargeDialogOpen(true)
  }

  function closeChargeDialog() {
    setChargeDialogOpen(false)
    setChargeCard(null)
  }

  function getInstallmentDueDate(card, purchaseDate, installmentIndex) {
    const base = new Date(purchaseDate)
    const closingDay = card.closingDay ?? base.getDate()
    const dueDay = card.dueDay ?? closingDay + 10
    const afterClosing = base.getDate() > closingDay
    const startMonthOffset = afterClosing ? 1 : 0
    const target = new Date(base.getFullYear(), base.getMonth() + startMonthOffset + installmentIndex, 1)
    const safeDay = Math.min(dueDay, new Date(target.getFullYear(), target.getMonth() + 1, 0).getDate())
    target.setDate(safeDay)
    return target
  }

  async function handleChargeSubmit(e) {
    e.preventDefault()
    if (!chargeCard || !chargeForm.title || !chargeForm.amount) return

    const totalAmount = parseFloat(chargeForm.amount)
    const installmentCount = chargeForm.isInstallment ? Math.max(1, parseInt(chargeForm.installments, 10) || 1) : 1
    const amounts = Array.from({ length: installmentCount }, () => Number((totalAmount / installmentCount).toFixed(2)))
    const diff = Number((totalAmount - amounts.reduce((sum, v) => sum + v, 0)).toFixed(2))
    if (diff !== 0 && amounts.length > 0) {
      amounts[amounts.length - 1] = Number((amounts[amounts.length - 1] + diff).toFixed(2))
    }

    for (let i = 0; i < installmentCount; i += 1) {
      const dueDate = getInstallmentDueDate(chargeCard, chargeForm.date, i)
      const payload = {
        title: installmentCount > 1 ? `${chargeForm.title} (${i + 1}/${installmentCount})` : chargeForm.title,
        amount: amounts[i],
        type: 'expense',
        status: 'predicted',
        date: dueDate.toISOString(),
        category: chargeCard.name,
        description: `Gasto registrado no cartão ${chargeCard.name}`,
      }
      // eslint-disable-next-line no-await-in-loop
      await chargeMutation.mutateAsync(payload)
    }
  }

  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-12">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary" />
      </div>
    )
  }

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h2 className="text-lg font-semibold font-display">Cartões de Crédito</h2>
        <Button onClick={openCreateDialog} size="sm">
          <Plus className="h-4 w-4 mr-2" />
          Novo Cartao
        </Button>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
        {cards.map((card) => (
          <motion.div key={card.id} initial={cardHover.initial} whileHover={cardHover.hover} className="relative">
            <Card className="group relative overflow-hidden border-none shadow-[0_20px_35px_-25px_rgba(0,0,0,0.5)]">
              <CardContent
                className="p-5 text-white space-y-4"
                style={{ backgroundColor: card.color || '#6366f1' }}
              >
                <div className="flex items-start justify-between">
                  <div className="flex items-center gap-3">
                    <Avatar className="h-9 w-9 border-white/20">
                      <AvatarFallback className="bg-white/10 text-white text-lg">
                        {getInstitutionMeta(card.institution).logo}
                      </AvatarFallback>
                    </Avatar>
                    <div className="flex flex-col">
                      <span className="font-semibold leading-tight text-base">{card.name}</span>
                      <span className="text-xs text-white/70">{card.institution}</span>
                    </div>
                  </div>
                  <div className="flex gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                    <Button
                      variant="ghost"
                      size="icon"
                      className="h-8 w-8 bg-white/10 text-white"
                      onClick={() => openEditDialog(card)}
                    >
                      <Pencil className="h-4 w-4" />
                    </Button>
                    <Button
                      variant="ghost"
                      size="icon"
                      className="h-8 w-8 bg-white/10 text-red-200"
                      onClick={() => handleDelete(card)}
                    >
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  </div>
                </div>

                <div className="flex justify-between text-xs text-white/80 tracking-[0.25em]">
                  <span>FECHA {card.closingDay ?? '--'}</span>
                  <span>VENCE {card.dueDay ?? '--'}</span>
                </div>

                <div className="flex items-center justify-between text-xs uppercase tracking-[0.25em] text-white/70">
                  <span>Limite</span>
                  <span className="text-sm font-semibold text-white">{card.creditLimit != null ? formatCurrency(card.creditLimit) : '—'}</span>
                </div>
                <div className="flex items-center justify-between pt-2">
                  <Button
                    variant="secondary"
                    size="sm"
                    className="text-xs font-semibold text-primary"
                    onClick={() => openChargeDialog(card)}
                  >
                    <ShoppingBag className="h-3.5 w-3.5 mr-1" /> Registrar gasto
                  </Button>
                </div>
              </CardContent>
            </Card>
          </motion.div>
        ))}
      </div>

      {cards.length === 0 && (
        <div className="text-center py-12 text-muted-foreground border border-dashed border-primary/30 rounded-xl">
          <div className="mx-auto mb-4 h-16 w-16 rounded-2xl bg-primary/10 flex items-center justify-center">
            <CreditCardIcon className="h-8 w-8 text-primary/60" />
          </div>
          <p className="font-medium">Nenhum cartão cadastrado</p>
          <p className="text-sm">Clique em "Novo Cartão" ou use os modelos acima para começar.</p>
        </div>
      )}

      <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
        <DialogContent className="sm:max-w-[480px] max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>
              {editingCard ? 'Editar Cartao' : 'Novo Cartao'}
            </DialogTitle>
          </DialogHeader>
          <div className="flex flex-wrap gap-3">
            {PRESET_CARDS.map((preset) => (
              <button
                key={preset.name}
                type="button"
                onClick={() => handlePreset(preset)}
                className="flex-1 min-w-[140px] rounded-2xl border border-border/40 bg-background/60 p-3 text-left hover:border-primary/40 transition"
              >
                <p className="text-xs text-muted-foreground">Modelo</p>
                <p className="font-semibold">{preset.name}</p>
                <p className="text-xs text-muted-foreground">{preset.institution}</p>
              </button>
            ))}
          </div>
          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="card-name">Nome</Label>
              <Input
                id="card-name"
                value={form.name}
                onChange={(e) => handleChange('name', e.target.value)}
                placeholder="Ex: Nubank, Inter..."
                required
              />
            </div>

            <div className="space-y-2">
              <Label>Banco/Instituição</Label>
              <div className="flex flex-wrap gap-3">
                {['Nubank','Banco Inter','Itaú','Bradesco','Santander','Caixa'].map((inst) => (
                  <button
                    key={inst}
                    type="button"
                    onClick={() => handleChange('institution', inst)}
                    className={`flex-1 min-w-[120px] rounded-xl border px-3 py-2 text-sm font-medium transition flex items-center gap-2 ${
                      form.institution === inst ? 'border-primary bg-primary/5 text-primary' : 'border-border/40 text-muted-foreground'
                    }`}
                  >
                    <span role="img" aria-label={inst}>{getInstitutionMeta(inst).logo}</span>
                    <span>{inst}</span>
                  </button>
                ))}
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="card-closing-day">Dia de Fechamento</Label>
                <Input
                  id="card-closing-day"
                  type="number"
                  min={1}
                  max={31}
                  value={form.closingDay}
                  onChange={(e) => handleChange('closingDay', e.target.value)}
                  placeholder="1-31"
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="card-due-day">Dia de Vencimento</Label>
                <Input
                  id="card-due-day"
                  type="number"
                  min={1}
                  max={31}
                  value={form.dueDay}
                  onChange={(e) => handleChange('dueDay', e.target.value)}
                  placeholder="1-31"
                />
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="card-limit">Limite de Credito</Label>
              <Input
                id="card-limit"
                type="number"
                min={0}
                step="0.01"
                value={form.creditLimit}
                onChange={(e) => handleChange('creditLimit', e.target.value)}
                placeholder="0.00"
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="card-color">Cor</Label>
              <Input
                id="card-color"
                type="color"
                value={form.color}
                onChange={(e) => handleChange('color', e.target.value)}
                className="h-10 w-20 p-1 cursor-pointer"
              />
            </div>

            <DialogFooter>
              <Button
                type="button"
                variant="outline"
                onClick={closeDialog}
              >
                Cancelar
              </Button>
              <Button
                type="submit"
                disabled={
                  createMutation.isPending || updateMutation.isPending
                }
              >
                {createMutation.isPending || updateMutation.isPending
                  ? 'Salvando...'
                  : 'Salvar'}
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>

      <Dialog open={chargeDialogOpen} onOpenChange={setChargeDialogOpen}>
        <DialogContent className="sm:max-w-[420px]">
          <DialogHeader>
            <DialogTitle>Novo gasto no cartão {chargeCard?.name}</DialogTitle>
          </DialogHeader>
          <form onSubmit={handleChargeSubmit} className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="charge-title">Descrição</Label>
              <Input
                id="charge-title"
                value={chargeForm.title}
                onChange={(e) => setChargeForm((prev) => ({ ...prev, title: e.target.value }))}
                placeholder="Ex: Mercado, Combustível"
                required
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="charge-amount">Valor (R$)</Label>
              <Input
                id="charge-amount"
                type="number"
                min="0"
                step="0.01"
                value={chargeForm.amount}
                onChange={(e) => setChargeForm((prev) => ({ ...prev, amount: e.target.value }))}
                required
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="charge-date">Data</Label>
              <Input
                id="charge-date"
                type="date"
                value={chargeForm.date}
                onChange={(e) => setChargeForm((prev) => ({ ...prev, date: e.target.value }))}
                required
              />
            </div>
            <div className="space-y-2">
              <Label>Status</Label>
              <Select
                value={chargeForm.status}
                onValueChange={(value) => setChargeForm((prev) => ({ ...prev, status: value }))}
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="completed">Concluído</SelectItem>
                  <SelectItem value="predicted">Previsto</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="rounded-2xl border border-border/40 p-4 space-y-3">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium">Parcelar?</p>
                  <p className="text-xs text-muted-foreground">Dividir o gasto em parcelas mensais</p>
                </div>
                <Switch
                  checked={chargeForm.isInstallment}
                  onCheckedChange={(checked) => setChargeForm((prev) => ({ ...prev, isInstallment: checked }))}
                />
              </div>
              {chargeForm.isInstallment && (
                <div className="space-y-2">
                  <Label htmlFor="charge-installments">Número de parcelas</Label>
                  <Input
                    id="charge-installments"
                    type="number"
                    min="1"
                    max="24"
                    value={chargeForm.installments}
                    onChange={(e) => setChargeForm((prev) => ({ ...prev, installments: e.target.value }))}
                  />
                </div>
              )}
            </div>
            <DialogFooter>
              <Button type="button" variant="outline" onClick={closeChargeDialog}>
                Cancelar
              </Button>
              <Button type="submit" disabled={chargeMutation.isPending}>
                Registrar gasto
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>
    </div>
  )
}

export default CartoesTab

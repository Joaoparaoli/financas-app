import dynamic from 'next/dynamic';
import { useCallback, useEffect, useMemo, useState } from 'react';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { CardTitle } from '@/components/ui/card';
import { ThemeToggle } from '@/components/ui/theme-toggle';
import { TooltipProvider } from '@/components/ui/tooltip';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { useRouter } from 'next/router';
import { CalendarClock, CreditCard, Landmark, Target, TrendingUp, ArrowUpCircle, ArrowDownCircle, CreditCard as CreditCardIcon, BarChart3, Settings } from 'lucide-react';
import { motion } from 'framer-motion';
import { cn } from '@/lib/utils';
import { useProfile } from '@/context/ProfileContext';
import { Switch } from '@/components/ui/switch';
import { Label } from '@/components/ui/label';

const FluxoCaixa = dynamic(() => import('@/components/finance/FluxoCaixa'), { ssr: false });
const CartoesTab = dynamic(() => import('@/components/finance/CartoesTab'), { ssr: false });
const Patrimonio = dynamic(() => import('@/components/finance/Patrimonio'), { ssr: false });
const OrcamentoMetas = dynamic(() => import('@/components/finance/OrcamentoMetas'), { ssr: false });
const SubscriptionsTab = dynamic(() => import('@/components/finance/SubscriptionsTab'), { ssr: false });
const InsightsPanel = dynamic(() => import('@/components/finance/InsightsPanel'), { ssr: false });

const TAB_ITEMS = [
  { value: 'fluxo', label: 'Fluxo', icon: TrendingUp },
  { value: 'cartoes', label: 'Cartões', icon: CreditCard },
  { value: 'patrimonio', label: 'Patrimônio', icon: Landmark },
  { value: 'metas', label: 'Metas', icon: Target },
  { value: 'assinaturas', label: 'Assinaturas', icon: CalendarClock },
];

function FinancasContent() {
  const router = useRouter();
  const currentTab = router.query.tab?.toString() || 'fluxo';
  const [mounted, setMounted] = useState(false);
  const [insightsOpen, setInsightsOpen] = useState(false);
  const [profileDialogOpen, setProfileDialogOpen] = useState(false);
  const { profiles, activeProfiles, selectedProfileId, selectProfile, updateProfile, uploadPhoto } = useProfile();

  const handleQuickAction = useCallback(
    (tab) => {
      router.replace({ pathname: router.pathname, query: { ...router.query, tab } }, undefined, { shallow: true });
    },
    [router]
  );

  const quickActions = useMemo(
    () => [
      { label: 'Nova entrada', tab: 'fluxo', icon: ArrowUpCircle, accent: 'text-emerald-500', keyCode: 'KeyE', hotkeyLabel: 'Shift + E' },
      { label: 'Nova saída', tab: 'fluxo', icon: ArrowDownCircle, accent: 'text-red-500', keyCode: 'KeyS', hotkeyLabel: 'Shift + S' },
      { label: 'Gasto cartão', tab: 'cartoes', icon: CreditCardIcon, accent: 'text-primary', keyCode: 'KeyG', hotkeyLabel: 'Shift + G' },
    ],
    []
  );

  useEffect(() => {
    setMounted(true);
    const handleHotkey = (event) => {
      if (!event.shiftKey) return;
      const target = event.target;
      const tagName = target?.tagName?.toLowerCase();
      const typingElement =
        target?.isContentEditable || tagName === 'input' || tagName === 'textarea' || tagName === 'select';
      if (typingElement) return;
      const action = quickActions.find((qa) => qa.keyCode === event.code);
      if (action) {
        event.preventDefault();
        handleQuickAction(action.tab);
      }
    };
    window.addEventListener('keydown', handleHotkey);
    return () => window.removeEventListener('keydown', handleHotkey);
  }, [handleQuickAction, quickActions]);

  return (
    <TooltipProvider delayDuration={0}>
      <div className="min-h-screen bg-transparent">
        <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-8 sm:py-10 space-y-8">

          {/* Header */}
          <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
            <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.4 }}>
              <CardTitle className="text-3xl sm:text-4xl font-semibold leading-tight">
                Finanças Pessoais
              </CardTitle>
            </motion.div>

            <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-3">
              <Button
                variant="outline"
                className="gap-2 rounded-2xl border-border/60 bg-card/70 w-full sm:w-auto"
                onClick={() => setInsightsOpen(true)}
              >
                <BarChart3 className="h-4 w-4" />
                Gráficos & Insights
              </Button>

              <div className="self-start sm:self-center">
                <ThemeToggle />
              </div>

              {/* Profile selector - only active profiles */}
              <div className="self-start sm:self-center flex items-center gap-2">
                {(activeProfiles.length > 0 ? activeProfiles : profiles.slice(0, 1)).map((p) => (
                  <button
                    key={p.id}
                    type="button"
                    onClick={() => selectProfile(p.id)}
                    className={cn(
                      'w-10 h-10 rounded-full overflow-hidden border-2 transition-all shadow-sm',
                      p.id === selectedProfileId
                        ? 'border-primary ring-2 ring-primary/30 scale-110'
                        : 'border-border opacity-60 hover:opacity-100'
                    )}
                    title={p.name || p.id}
                  >
                    {p.photo ? (
                      <img src={p.photo} alt={p.name || p.id} className="w-full h-full object-cover" />
                    ) : (
                      <div className="w-full h-full flex items-center justify-center text-xs font-semibold bg-muted text-muted-foreground">
                        {(p.name || p.id)[0].toUpperCase()}
                      </div>
                    )}
                  </button>
                ))}
                <Button
                  variant="outline"
                  size="icon"
                  className="rounded-full"
                  onClick={() => setProfileDialogOpen(true)}
                  title="Configurar perfis"
                >
                  <Settings className="h-4 w-4" />
                </Button>
              </div>
            </div>
          </div>

          {/* Tabs */}
          <Tabs
            value={currentTab}
            onValueChange={(value) => {
              router.replace({ pathname: router.pathname, query: { ...router.query, tab: value } }, undefined, { shallow: true });
            }}
            className="space-y-6"
          >
            <TabsList className="!grid grid-cols-2 gap-2 sm:!flex sm:flex-wrap sm:w-full sm:gap-2 !h-auto !bg-transparent !border-0 !shadow-none !p-0">
              {TAB_ITEMS.map((tab) => {
                const Icon = tab.icon;
                return (
                  <TabsTrigger
                    key={tab.value}
                    value={tab.value}
                    className={cn(
                      'relative gap-2 rounded-2xl border border-border/20 bg-card/60 text-sm sm:text-base py-2 px-3 font-medium transition-all duration-200',
                      'hover:bg-card/90 hover:border-border/40',
                      'data-[state=active]:bg-primary/10 data-[state=active]:text-primary data-[state=active]:border-primary/30 data-[state=active]:shadow-sm'
                    )}
                  >
                    <Icon className="h-4 w-4" />
                    {tab.label}
                  </TabsTrigger>
                );
              })}
            </TabsList>

            <TabsContent value="fluxo" className="space-y-4">
              <FluxoCaixa />
            </TabsContent>
            <TabsContent value="cartoes">
              <CartoesTab />
            </TabsContent>
            <TabsContent value="patrimonio">
              <Patrimonio />
            </TabsContent>
            <TabsContent value="metas">
              <OrcamentoMetas />
            </TabsContent>
            <TabsContent value="assinaturas">
              <SubscriptionsTab />
            </TabsContent>
          </Tabs>
        </div>
      </div>

      {/* Insights dialog */}
      <Dialog open={insightsOpen} onOpenChange={setInsightsOpen}>
        <DialogContent className="w-[95vw] sm:max-w-5xl h-[85vh] sm:h-[90vh] p-0 overflow-y-auto border-0 bg-background/95">
          <DialogHeader className="sr-only">
            <DialogTitle>Gráficos e insights</DialogTitle>
          </DialogHeader>
          {insightsOpen && <InsightsPanel onClose={() => setInsightsOpen(false)} />}
        </DialogContent>
      </Dialog>

      {/* Profile settings dialog */}
      <Dialog open={profileDialogOpen} onOpenChange={setProfileDialogOpen}>
        <DialogContent className="sm:max-w-lg">
          <DialogHeader>
            <DialogTitle>Configurar Perfis</DialogTitle>
          </DialogHeader>
          <div className="space-y-3 max-h-[65vh] overflow-y-auto py-2 pr-1">
            {profiles.map((p) => (
              <div key={p.id} className={cn('border rounded-xl p-3 space-y-3', !p.active && 'opacity-50')}>
                {/* Header row: avatar + name + active toggle */}
                <div className="flex items-center gap-3">
                  {/* Avatar / upload */}
                  <label className="relative w-12 h-12 rounded-full overflow-hidden border cursor-pointer flex-shrink-0 group">
                    {p.photo ? (
                      <img src={p.photo} alt={p.name} className="w-full h-full object-cover" />
                    ) : (
                      <div className="w-full h-full flex items-center justify-center text-sm font-semibold bg-muted text-muted-foreground">
                        {(p.name || p.id)[0].toUpperCase()}
                      </div>
                    )}
                    <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 flex items-center justify-center text-white text-xs transition-opacity">
                      Foto
                    </div>
                    <input
                      type="file"
                      accept="image/*"
                      className="hidden"
                      onChange={(e) => {
                        const file = e.target.files?.[0];
                        if (file) uploadPhoto(p.id, file);
                      }}
                    />
                  </label>
                  {/* Name */}
                  <Input
                    className="flex-1"
                    value={p.name || ''}
                    onChange={(e) => updateProfile(p.id, { name: e.target.value })}
                    placeholder="Nome do perfil"
                  />
                  {/* Active toggle */}
                  <div className="flex flex-col items-center gap-1 flex-shrink-0">
                    <Switch
                      checked={!!p.active}
                      onCheckedChange={(checked) => updateProfile(p.id, { active: checked })}
                    />
                    <span className="text-[10px] text-muted-foreground">{p.active ? 'Ativo' : 'Inativo'}</span>
                  </div>
                </div>
                {/* PIN row */}
                <div className="flex items-center gap-2">
                  <Label className="text-xs w-20 flex-shrink-0">PIN (4 dígitos)</Label>
                  <Input
                    type="password"
                    maxLength={4}
                    inputMode="numeric"
                    pattern="[0-9]{4}"
                    className="w-28 text-center tracking-widest"
                    value={p.pin || ''}
                    onChange={(e) => {
                      const val = e.target.value.replace(/\D/g, '').slice(0, 4);
                      updateProfile(p.id, { pin: val || null });
                    }}
                    placeholder="••••"
                  />
                  {p.pin && (
                    <Button size="sm" variant="ghost" className="text-xs text-muted-foreground" onClick={() => updateProfile(p.id, { pin: null })}>
                      Remover
                    </Button>
                  )}
                </div>
                {/* Use button */}
                {p.active && (
                  <Button
                    size="sm"
                    className="w-full"
                    variant={p.id === selectedProfileId ? 'default' : 'outline'}
                    onClick={() => { selectProfile(p.id); setProfileDialogOpen(false); }}
                  >
                    {p.id === selectedProfileId ? '✓ Perfil em uso' : 'Usar este perfil'}
                  </Button>
                )}
              </div>
            ))}
          </div>
        </DialogContent>
      </Dialog>
    </TooltipProvider>
  );
}

export default function FinancasPage() {
  return <FinancasContent />;
}

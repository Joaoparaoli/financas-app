import dynamic from 'next/dynamic';
import { useCallback, useEffect, useMemo, useState } from 'react';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { CardTitle } from '@/components/ui/card';
import { ThemeToggle } from '@/components/ui/theme-toggle';
import { TooltipProvider, Tooltip, TooltipTrigger, TooltipContent } from '@/components/ui/tooltip';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { useRouter } from 'next/router';
import { CalendarClock, CreditCard, Landmark, Target, TrendingUp, Plus, ArrowUpCircle, ArrowDownCircle, CreditCard as CreditCardIcon, BarChart3 } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { cn } from '@/lib/utils';
import { ProtectedRoute } from '@/components/auth/ProtectedRoute';

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
        target?.isContentEditable ||
        tagName === 'input' ||
        tagName === 'textarea' ||
        tagName === 'select';
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
          <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
            <motion.div
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.4 }}
            >
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
            </div>
          </div>

          <Tabs
            value={currentTab}
            onValueChange={(value) => {
              const query = { ...router.query, tab: value };
              router.replace({ pathname: router.pathname, query }, undefined, { shallow: true });
            }}
            className="space-y-6"
          >
            <TabsList
              className="!grid grid-cols-2 gap-2 sm:!flex sm:flex-wrap sm:w-full sm:gap-2 !h-auto !bg-transparent !border-0 !shadow-none !p-0"
            >
              {TAB_ITEMS.map((tab) => {
                const Icon = tab.icon;
                return (
                  <TabsTrigger
                    key={tab.value}
                    value={tab.value}
                    className={cn(
                      'relative gap-2 rounded-2xl border border-border/20 bg-card/60 text-sm sm:text-base py-2 px-3 font-medium transition-all duration-200',
                      'hover:bg-card/90 hover:border-border/40',
                      'data-[state=active]:bg-primary/10 data-[state=active]:text-primary data-[state=active]:border-primary/30 data-[state=active]:shadow-sm data-[state=active]:shadow-primary/10'
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
              <Dialog open={insightsOpen} onOpenChange={setInsightsOpen}>
                <DialogContent className="w-[95vw] sm:max-w-5xl h-[85vh] sm:h-[90vh] p-0 overflow-y-auto border-0 bg-background/95">
                  <DialogHeader className="sr-only">
                    <DialogTitle>Gráficos e insights</DialogTitle>
                  </DialogHeader>
                  {insightsOpen && <InsightsPanel onClose={() => setInsightsOpen(false)} />}
                </DialogContent>
              </Dialog>
        </div>
      </div>
    </TooltipProvider>
  );
}

export default function FinancasPage() {
  return (
    <ProtectedRoute>
      <FinancasContent />
    </ProtectedRoute>
  );
}

import { useState, useMemo } from 'react';
import { TrendingUp, TrendingDown, DollarSign, CreditCard, Target, Calendar, PieChart, BarChart3, Activity } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { cn } from '@/lib/utils';

// Mock data para demonstração
const mockData = {
  monthlyTrend: [
    { month: 'Jan', income: 8500, expenses: 5200 },
    { month: 'Fev', income: 9200, expenses: 5800 },
    { month: 'Mar', income: 8800, expenses: 5100 },
    { month: 'Abr', income: 9500, expenses: 6200 },
    { month: 'Mai', income: 10200, expenses: 5900 },
    { month: 'Jun', income: 9800, expenses: 5500 },
  ],
  categoryBreakdown: [
    { category: 'Moradia', amount: 2500, percentage: 35, color: 'bg-blue-500' },
    { category: 'Alimentação', amount: 1200, percentage: 17, color: 'bg-green-500' },
    { category: 'Transporte', amount: 800, percentage: 11, color: 'bg-yellow-500' },
    { category: 'Lazer', amount: 600, percentage: 8, color: 'bg-purple-500' },
    { category: 'Saúde', amount: 400, percentage: 6, color: 'bg-red-500' },
    { category: 'Outros', amount: 1600, percentage: 23, color: 'bg-gray-500' },
  ],
  weeklySpending: [
    { week: 'Sem 1', amount: 1800 },
    { week: 'Sem 2', amount: 2100 },
    { week: 'Sem 3', amount: 1900 },
    { week: 'Sem 4', amount: 1700 },
  ],
  savingsGoals: [
    { name: 'Fundo de Emergência', current: 15000, target: 20000, percentage: 75 },
    { name: 'Viagem', current: 3000, target: 8000, percentage: 38 },
    { name: 'Novo Carro', current: 25000, target: 50000, percentage: 50 },
  ]
};

export function TrendChart({ data = mockData.monthlyTrend, className }) {
  const maxValue = Math.max(...data.flatMap(d => [d.income, d.expenses]));
  
  return (
    <Card className={cn('p-6', className)}>
      <CardHeader className="pb-4">
        <CardTitle className="flex items-center gap-2">
          <Activity className="h-5 w-5" />
          Tendência Mensal
        </CardTitle>
      </CardHeader>
      <CardContent>
        <div className="space-y-4">
          {data.map((item, index) => (
            <div key={index} className="space-y-2">
              <div className="flex justify-between text-sm">
                <span className="font-medium">{item.month}</span>
                <div className="flex gap-4">
                  <span className="text-success">+R$ {item.income.toLocaleString()}</span>
                  <span className="text-destructive">-R$ {item.expenses.toLocaleString()}</span>
                </div>
              </div>
              <div className="flex gap-2 h-6">
                <div className="flex-1 bg-muted rounded-full overflow-hidden">
                  <div 
                    className="h-full bg-success transition-all duration-500 ease-out"
                    style={{ width: `${(item.income / maxValue) * 100}%` }}
                  />
                </div>
                <div className="flex-1 bg-muted rounded-full overflow-hidden">
                  <div 
                    className="h-full bg-destructive transition-all duration-500 ease-out"
                    style={{ width: `${(item.expenses / maxValue) * 100}%` }}
                  />
                </div>
              </div>
            </div>
          ))}
        </div>
        <div className="flex justify-center gap-6 mt-6 pt-4 border-t">
          <div className="flex items-center gap-2">
            <div className="w-3 h-3 bg-success rounded-full" />
            <span className="text-sm text-muted-foreground">Receitas</span>
          </div>
          <div className="flex items-center gap-2">
            <div className="w-3 h-3 bg-destructive rounded-full" />
            <span className="text-sm text-muted-foreground">Despesas</span>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}

export function CategoryChart({ data = mockData.categoryBreakdown, className }) {
  return (
    <Card className={cn('p-6', className)}>
      <CardHeader className="pb-4">
        <CardTitle className="flex items-center gap-2">
          <PieChart className="h-5 w-5" />
          Despesas por Categoria
        </CardTitle>
      </CardHeader>
      <CardContent>
        <div className="space-y-4">
          {data.map((item, index) => (
            <div key={index} className="space-y-2">
              <div className="flex justify-between items-center">
                <div className="flex items-center gap-3">
                  <div className={cn('w-3 h-3 rounded-full', item.color)} />
                  <span className="font-medium">{item.category}</span>
                </div>
                <div className="text-right">
                  <div className="font-semibold">R$ {item.amount.toLocaleString()}</div>
                  <div className="text-sm text-muted-foreground">{item.percentage}%</div>
                </div>
              </div>
              <div className="w-full bg-muted rounded-full h-2 overflow-hidden">
                <div 
                  className={cn('h-full transition-all duration-700 ease-out', item.color)}
                  style={{ width: `${item.percentage}%` }}
                />
              </div>
            </div>
          ))}
        </div>
      </CardContent>
    </Card>
  );
}

export function WeeklyChart({ data = mockData.weeklySpending, className }) {
  const maxValue = Math.max(...data.map(d => d.amount));
  
  return (
    <Card className={cn('p-6', className)}>
      <CardHeader className="pb-4">
        <CardTitle className="flex items-center gap-2">
          <BarChart3 className="h-5 w-5" />
          Gastos Semanais
        </CardTitle>
      </CardHeader>
      <CardContent>
        <div className="flex items-end justify-between h-32 gap-2">
          {data.map((item, index) => (
            <div key={index} className="flex-1 flex flex-col items-center gap-2">
              <div className="w-full flex flex-col items-center">
                <span className="text-sm font-medium">R$ {item.amount.toLocaleString()}</span>
                <div className="w-full bg-muted rounded-t-lg overflow-hidden flex-1 min-h-[60px] relative">
                  <div 
                    className="absolute bottom-0 w-full bg-gradient-to-t from-primary to-primary/60 transition-all duration-500 ease-out rounded-t-lg"
                    style={{ height: `${(item.amount / maxValue) * 100}%` }}
                  />
                </div>
              </div>
              <span className="text-xs text-muted-foreground">{item.week}</span>
            </div>
          ))}
        </div>
      </CardContent>
    </Card>
  );
}

export function SavingsGoals({ data = mockData.savingsGoals, className }) {
  return (
    <Card className={cn('p-6', className)}>
      <CardHeader className="pb-4">
        <CardTitle className="flex items-center gap-2">
          <Target className="h-5 w-5" />
          Metas de Economia
        </CardTitle>
      </CardHeader>
      <CardContent>
        <div className="space-y-6">
          {data.map((goal, index) => (
            <div key={index} className="space-y-3">
              <div className="flex justify-between items-center">
                <span className="font-medium">{goal.name}</span>
                <span className="text-sm text-muted-foreground">
                  R$ {goal.current.toLocaleString()} / R$ {goal.target.toLocaleString()}
                </span>
              </div>
              <div className="space-y-2">
                <div className="w-full bg-muted rounded-full h-3 overflow-hidden">
                  <div 
                    className={cn(
                      'h-full transition-all duration-1000 ease-out rounded-full',
                      goal.percentage >= 75 ? 'bg-success' : 
                      goal.percentage >= 50 ? 'bg-warning' : 'bg-primary'
                    )}
                    style={{ width: `${goal.percentage}%` }}
                  />
                </div>
                <div className="flex justify-between text-xs text-muted-foreground">
                  <span>{goal.percentage}% completo</span>
                  <span>R$ {(goal.target - goal.current).toLocaleString()} restantes</span>
                </div>
              </div>
            </div>
          ))}
        </div>
      </CardContent>
    </Card>
  );
}

export function DashboardOverview({ className }) {
  const stats = useMemo(() => ({
    totalIncome: mockData.monthlyTrend.reduce((sum, item) => sum + item.income, 0),
    totalExpenses: mockData.monthlyTrend.reduce((sum, item) => sum + item.expenses, 0),
    totalSavings: mockData.monthlyTrend.reduce((sum, item) => sum + (item.income - item.expenses), 0),
    averageMonthly: Math.round(mockData.monthlyTrend.reduce((sum, item) => sum + (item.income - item.expenses), 0) / mockData.monthlyTrend.length)
  }), []);

  return (
    <div className={cn('space-y-6', className)}>
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <Card className="p-6 border-success/20 bg-success/5">
          <CardContent className="p-0">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">Receita Total</p>
                <p className="text-2xl font-bold text-success">R$ {stats.totalIncome.toLocaleString()}</p>
                <p className="text-xs text-muted-foreground mt-1">6 meses</p>
              </div>
              <div className="rounded-full bg-success/10 p-3">
                <TrendingUp className="h-6 w-6 text-success" />
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="p-6 border-destructive/20 bg-destructive/5">
          <CardContent className="p-0">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">Despesa Total</p>
                <p className="text-2xl font-bold text-destructive">R$ {stats.totalExpenses.toLocaleString()}</p>
                <p className="text-xs text-muted-foreground mt-1">6 meses</p>
              </div>
              <div className="rounded-full bg-destructive/10 p-3">
                <TrendingDown className="h-6 w-6 text-destructive" />
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="p-6 border-primary/20 bg-primary/5">
          <CardContent className="p-0">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">Economia Total</p>
                <p className="text-2xl font-bold text-primary">R$ {stats.totalSavings.toLocaleString()}</p>
                <p className="text-xs text-muted-foreground mt-1">6 meses</p>
              </div>
              <div className="rounded-full bg-primary/10 p-3">
                <DollarSign className="h-6 w-6 text-primary" />
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="p-6 border-warning/20 bg-warning/5">
          <CardContent className="p-0">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">Média Mensal</p>
                <p className="text-2xl font-bold text-warning">R$ {stats.averageMonthly.toLocaleString()}</p>
                <p className="text-xs text-muted-foreground mt-1">Economia</p>
              </div>
              <div className="rounded-full bg-warning/10 p-3">
                <Calendar className="h-6 w-6 text-warning" />
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}

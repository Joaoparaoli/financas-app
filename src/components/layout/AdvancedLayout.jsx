import { useState } from 'react';
import { 
  Menu, 
  X, 
  Home, 
  TrendingUp, 
  CreditCard, 
  Landmark, 
  Target, 
  CalendarClock, 
  Settings, 
  Bell,
  Search,
  User,
  ChevronDown
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';
import { ThemeSelector } from '@/components/ui/theme-provider';
import { useAuth } from '@/context/AuthContext';

export function AdvancedLayout({ children, currentPage }) {
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [userMenuOpen, setUserMenuOpen] = useState(false);
  const { user, logout } = useAuth();

  const displayName = user?.name || 'Usuário';
  const displayEmail = user?.email || '---';

  const navigation = [
    { name: 'Dashboard', href: '/', icon: Home, current: currentPage === 'dashboard' },
    { name: 'Fluxo de Caixa', href: '/financas', icon: TrendingUp, current: currentPage === 'fluxo' },
    { name: 'Cartões', href: '/cartoes', icon: CreditCard, current: currentPage === 'cartoes' },
    { name: 'Patrimônio', href: '/patrimonio', icon: Landmark, current: currentPage === 'patrimonio' },
    { name: 'Metas', href: '/metas', icon: Target, current: currentPage === 'metas' },
    { name: 'Assinaturas', href: '/assinaturas', icon: CalendarClock, current: currentPage === 'assinaturas' },
  ];

  return (
    <div className="min-h-screen bg-background">
      {/* Mobile sidebar backdrop */}
      {sidebarOpen && (
        <div 
          className="fixed inset-0 z-40 bg-black/50 lg:hidden"
          onClick={() => setSidebarOpen(false)}
        />
      )}

      {/* Sidebar */}
      <div className={cn(
        'fixed inset-y-0 left-0 z-50 w-64 bg-card border-r transform transition-transform duration-300 ease-in-out lg:translate-x-0 lg:static lg:inset-0',
        sidebarOpen ? 'translate-x-0' : '-translate-x-full'
      )}>
        <div className="flex h-full flex-col">
          {/* Sidebar header */}
          <div className="flex items-center justify-between p-4 border-b">
            <div className="flex items-center gap-3">
              <div className="w-8 h-8 bg-gradient-to-br from-primary to-primary/60 rounded-lg flex items-center justify-center">
                <TrendingUp className="h-4 w-4 text-primary-foreground" />
              </div>
              <div>
                <h2 className="font-semibold text-foreground">Finanças</h2>
                <p className="text-xs text-muted-foreground">Pessoais</p>
              </div>
            </div>
            <Button
              variant="ghost"
              size="icon"
              className="lg:hidden"
              onClick={() => setSidebarOpen(false)}
            >
              <X className="h-4 w-4" />
            </Button>
          </div>

          {/* Navigation */}
          <nav className="flex-1 p-4 space-y-2">
            {navigation.map((item) => (
              <a
                key={item.name}
                href={item.href}
                className={cn(
                  'flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-all duration-200',
                  item.current
                    ? 'bg-primary text-primary-foreground shadow-md'
                    : 'text-muted-foreground hover:bg-muted hover:text-foreground'
                )}
              >
                <item.icon className="h-4 w-4" />
                {item.name}
              </a>
            ))}
          </nav>

          {/* Sidebar footer */}
          <div className="p-4 border-t space-y-4">
            <ThemeSelector />
            <div className="flex items-center gap-3">
              <div className="w-8 h-8 bg-gradient-to-br from-success to-success/60 rounded-full flex items-center justify-center">
                <User className="h-4 w-4 text-success-foreground" />
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-sm font-medium truncate">{displayName}</p>
                <p className="text-xs text-muted-foreground truncate">{displayEmail}</p>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Main content */}
      <div className="lg:pl-64">
        {/* Top navigation */}
        <header className="sticky top-0 z-30 bg-background/80 backdrop-blur-md border-b">
          <div className="flex items-center justify-between px-4 py-3">
            <div className="flex items-center gap-4">
              <Button
                variant="ghost"
                size="icon"
                className="lg:hidden"
                onClick={() => setSidebarOpen(true)}
              >
                <Menu className="h-4 w-4" />
              </Button>
              
              {/* Search bar */}
              <div className="hidden md:flex items-center gap-2 bg-muted rounded-lg px-3 py-2 w-80">
                <Search className="h-4 w-4 text-muted-foreground" />
                <input
                  type="text"
                  placeholder="Buscar transações, metas..."
                  className="bg-transparent border-none outline-none text-sm placeholder-muted-foreground flex-1"
                />
              </div>
            </div>

            <div className="flex items-center gap-3">
              {/* Notifications */}
              <Button variant="ghost" size="icon" className="relative">
                <Bell className="h-4 w-4" />
                <span className="absolute -top-1 -right-1 w-2 h-2 bg-destructive rounded-full" />
              </Button>

              {/* User menu */}
              <div className="relative">
                <Button
                  variant="ghost"
                  className="flex items-center gap-2"
                  onClick={() => setUserMenuOpen(!userMenuOpen)}
                >
                  <div className="w-6 h-6 bg-gradient-to-br from-success to-success/60 rounded-full flex items-center justify-center">
                    <User className="h-3 w-3 text-success-foreground" />
                  </div>
                  <ChevronDown className="h-3 w-3" />
                </Button>

                {userMenuOpen && (
                  <div className="absolute right-0 mt-2 w-48 bg-card border rounded-lg shadow-lg py-2 z-50">
                    <p className="px-4 py-2 text-xs text-muted-foreground border-b border-border/50">
                      {displayEmail}
                    </p>
                    <button
                      type="button"
                      onClick={logout}
                      className="block w-full text-left px-4 py-2 text-sm hover:bg-muted text-destructive"
                    >
                      Sair
                    </button>
                  </div>
                )}
              </div>
            </div>
          </div>
        </header>

        {/* Page content */}
        <main className="p-4 lg:p-8">
          {children}
        </main>
      </div>
    </div>
  );
}

export function PageHeader({ title, subtitle, actions, className }) {
  return (
    <div className={cn('mb-8', className)}>
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">{title}</h1>
          {subtitle && (
            <p className="text-muted-foreground mt-2">{subtitle}</p>
          )}
        </div>
        {actions && (
          <div className="flex items-center gap-2">
            {actions}
          </div>
        )}
      </div>
    </div>
  );
}

export function QuickActions({ actions }) {
  return (
    <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-3">
      {actions.map((action, index) => (
        <Button
          key={index}
          variant={action.variant || 'outline'}
          className="h-auto p-4 flex flex-col items-center gap-2"
          onClick={action.onClick}
        >
          <action.icon className="h-5 w-5" />
          <span className="text-xs text-center">{action.label}</span>
        </Button>
      ))}
    </div>
  );
}

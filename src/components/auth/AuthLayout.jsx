import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { cn } from '@/lib/utils';

export function AuthLayout({ title, subtitle, children }) {
  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-950 via-indigo-950 to-emerald-900 text-white flex items-center justify-center p-4">
      <div className="max-w-5xl w-full grid lg:grid-cols-2 gap-8">
        <div className="hidden lg:flex flex-col justify-between rounded-3xl border border-white/10 bg-white/5 backdrop-blur-lg p-8 shadow-2xl">
          <div>
            <p className="text-sm uppercase tracking-[0.3em] text-emerald-200 mb-4">Finanças - Multi-Tenant</p>
            <h1 className="text-4xl font-semibold font-display leading-tight text-white">
              Controle completo das suas finanças em um ambiente seguro e isolado
            </h1>
            <p className="mt-6 text-lg text-white/70">
              Cada usuário tem sua própria base de dados, garantindo privacidade total e performance ideal para o seu planejamento financeiro.
            </p>
          </div>
          <div className="grid gap-4 text-white/80">
            {[
              'Base dedicada para cada conta',
              'Importe e exporte seus dados',
              'Fluxo de caixa completo com metas e assinaturas',
            ].map((item) => (
              <div key={item} className="flex items-center gap-3">
                <span className="h-2 w-2 rounded-full bg-emerald-400 shadow-[0_0_8px_2px_rgba(52,211,153,0.4)]"></span>
                <span>{item}</span>
              </div>
            ))}
          </div>
        </div>
        <Card className={cn('bg-white/90 backdrop-blur-xl border-white/20 shadow-2xl text-gray-900', 'rounded-xl')}
        >
          <CardHeader>
            <CardTitle className="text-2xl font-semibold text-gray-900">{title}</CardTitle>
            {subtitle && <CardDescription className="text-gray-600 text-base">{subtitle}</CardDescription>}
          </CardHeader>
          <CardContent>{children}</CardContent>
        </Card>
      </div>
    </div>
  );
}

import Head from 'next/head';
import Link from 'next/link';
import { useRouter } from 'next/router';
import { useCallback, useMemo, useState } from 'react';
import { AuthLayout } from '@/components/auth/AuthLayout';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { useAuth } from '@/context/AuthContext';

export default function LoginPage() {
  const router = useRouter();
  const { login, loading: authLoading } = useAuth();
  const [form, setForm] = useState({ email: '', password: '' });
  const [submitting, setSubmitting] = useState(false);

  const redirectTo = useMemo(() => {
    if (router.query.redirect) {
      try {
        return decodeURIComponent(router.query.redirect);
      } catch (error) {
        return '/financas';
      }
    }
    return '/financas';
  }, [router.query.redirect]);

  const handleChange = useCallback((event) => {
    setForm((prev) => ({ ...prev, [event.target.name]: event.target.value }));
  }, []);

  const handleSubmit = useCallback(
    async (event) => {
      event.preventDefault();
      if (submitting) return;
      setSubmitting(true);
      try {
        await login(
          { email: form.email, password: form.password },
          { redirectTo }
        );
      } finally {
        setSubmitting(false);
      }
    },
    [form.email, form.password, login, redirectTo, submitting]
  );

  const disableSubmit = authLoading || submitting || !form.email || !form.password;

  return (
    <>
      <Head>
        <title>Entrar | Finanças</title>
      </Head>
      <AuthLayout
        title="Bem-vindo de volta"
        subtitle="Acesse sua conta isolada e continue seu planejamento financeiro"
      >
        <form className="space-y-6" onSubmit={handleSubmit}>
          <div className="space-y-2">
            <Label htmlFor="email">E-mail</Label>
            <Input
              id="email"
              name="email"
              type="email"
              placeholder="voce@email.com"
              value={form.email}
              onChange={handleChange}
              required
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="password">Senha</Label>
            <Input
              id="password"
              name="password"
              type="password"
              placeholder="••••••••"
              value={form.password}
              onChange={handleChange}
              required
            />
          </div>
          <Button type="submit" className="w-full" disabled={disableSubmit}>
            {submitting ? 'Entrando...' : 'Entrar'}
          </Button>
          <p className="text-center text-sm text-muted-foreground">
            Ainda não possui uma conta?{' '}
            <Link className="text-primary font-medium" href={`/register?redirect=${encodeURIComponent(redirectTo)}`}>
              Cadastre-se
            </Link>
          </p>
        </form>
      </AuthLayout>
    </>
  );
}

import Head from 'next/head';
import Link from 'next/link';
import { useRouter } from 'next/router';
import { useCallback, useMemo, useState } from 'react';
import { AuthLayout } from '@/components/auth/AuthLayout';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { useAuth } from '@/context/AuthContext';

export default function RegisterPage() {
  const router = useRouter();
  const { register, loading: authLoading } = useAuth();
  const [form, setForm] = useState({ name: '', email: '', password: '' });
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
        await register(
          { name: form.name, email: form.email, password: form.password },
          { redirectTo }
        );
      } finally {
        setSubmitting(false);
      }
    },
    [form.name, form.email, form.password, register, redirectTo, submitting]
  );

  const disableSubmit =
    authLoading ||
    submitting ||
    !form.name.trim() ||
    !form.email.trim() ||
    !form.password.trim();

  return (
    <>
      <Head>
        <title>Criar conta | Finanças</title>
      </Head>
      <AuthLayout
        title="Crie sua conta isolada"
        subtitle="Convide seus amigos e cada um terá um ambiente totalmente separado"
      >
        <form className="space-y-6" onSubmit={handleSubmit}>
          <div className="space-y-2">
            <Label htmlFor="name">Nome</Label>
            <Input
              id="name"
              name="name"
              placeholder="Seu nome completo"
              value={form.name}
              onChange={handleChange}
              required
            />
          </div>
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
              placeholder="Use uma senha segura"
              value={form.password}
              onChange={handleChange}
              minLength={6}
              required
            />
          </div>
          <Button type="submit" className="w-full" disabled={disableSubmit}>
            {submitting ? 'Criando conta...' : 'Criar conta'}
          </Button>
          <p className="text-center text-sm text-muted-foreground">
            Já possui uma conta?{' '}
            <Link className="text-primary font-medium" href={`/login?redirect=${encodeURIComponent(redirectTo)}`}>
              Entrar
            </Link>
          </p>
        </form>
      </AuthLayout>
    </>
  );
}

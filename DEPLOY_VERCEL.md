# 🚀 Deploy no Vercel + Supabase

## Status Atual
✅ **Banco de dados criado no Supabase** com todas as tabelas e RLS (Row Level Security)
✅ **Schema Prisma atualizado** para PostgreSQL
⏳ **Falta:** Conectar ao GitHub e fazer deploy no Vercel

---

## PASSO 1: Criar Repositório no GitHub

1. Acesse: https://github.com/new
2. **Repository name:** `financas-app`
3. **Description:** Sistema de gestão financeira multi-tenant
4. Escolha: **Public** ou **Private**
5. **NÃO** marque "Initialize this repository with a README"
6. Clique em **"Create repository"**

---

## PASSO 2: Enviar código para GitHub

Execute no terminal do seu computador:

```bash
cd c:\Users\jp881\Desktop\financas-app

# Adicionar remote (substitua SEU_USUARIO)
git remote add origin https://github.com/SEU_USUARIO/financas-app.git

# Fazer push
git push -u origin master
```

---

## PASSO 3: Configurar Variáveis no Vercel

Acesse: https://vercel.com/dashboard

1. Clique no projeto `financas-app`
2. Vá em **Settings** → **Environment Variables**
3. Adicione estas variáveis:

| Nome | Valor |
|------|-------|
| `DATABASE_URL` | `postgresql://postgres:eqfaxLZI3T2B9QnJ@db.nqgrdodjuimzrfaymexg.supabase.co:5432/postgres` |
| `AUTH_SECRET` | `sua-chave-secreta-aqui-minimo-32-caracteres` |
| `NEXT_PUBLIC_SUPABASE_URL` | `https://nqgrdodjuimzrfaymexg.supabase.co` |
| `NEXT_PUBLIC_SUPABASE_ANON_KEY` | `eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Im5xZ3Jkb2RqdWltenJmYXltZXhnIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NDA0OTMwMzIsImV4cCI6MjA1NjA2OTAzMn0.TPOhAukLMWzE0nmiJ_eyOCcD6Vd6ZKe1h5D24Rq1t1o` |

---

## PASSO 4: Re-deploy no Vercel

```bash
# No terminal do seu computador
cd c:\Users\jp881\Desktop\financas-app
npx vercel --prod
```

Ou pelo dashboard do Vercel: **Deployments** → **Redeploy**

---

## ✅ O que foi configurado no Supabase:

### Tabelas criadas:
- `users` - Usuários e autenticação
- `transactions` - Transações financeiras
- `credit_cards` - Cartões de crédito
- `assets` - Ativos/patrimônio
- `liabilities` - Passivos/dívidas
- `financial_goals` - Metas financeiras
- `subscriptions` - Assinaturas recorrentes

### Segurança (RLS):
- Cada usuário só vê seus próprios dados
- Isolamento completo entre tenants
- Políticas de segurança ativadas em todas as tabelas

---

## 🔗 URLs Importantes

- **Supabase Dashboard:** https://app.supabase.com/project/nqgrdodjuimzrfaymexg
- **Vercel Dashboard:** https://vercel.com/dashboard
- **Vercel Deployments:** https://vercel.com/joaoparaolis-projects/financas-app/deployments

---

## ⚠️ Notas Importantes

1. **SQLite removido:** O app agora usa PostgreSQL no Supabase (dados persistentes)
2. **Multi-tenant via RLS:** Cada usuário tem dados isolados automaticamente
3. **Deploy automático:** A cada `git push`, o Vercel faz deploy automaticamente

---

## 🆘 Solução de Problemas

### Erro de conexão com banco:
```bash
# Verificar se DATABASE_URL está correto no Vercel
# Deve ser: postgresql://postgres:eqfaxLZI3T2B9QnJ@db.nqgrdodjuimzrfaymexg.supabase.co:5432/postgres
```

### Erro de build:
```bash
# Limpar cache e reinstalar
cd c:\Users\jp881\Desktop\financas-app
rm -rf node_modules .next
npm install
npx prisma generate
npx vercel --prod
```

---

**Pronto!** Após seguir estes passos, seu app estará no ar com:
- ✅ Banco PostgreSQL persistente (Supabase)
- ✅ Deploy automático via GitHub
- ✅ Multi-tenancy seguro com RLS
- ✅ URL pública no Vercel

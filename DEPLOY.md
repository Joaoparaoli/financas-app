# Guia de Deploy - Finanças Multi-Tenant

## Estrutura de diretórios obrigatória
```
financas-app/
├─ data/
│  ├─ template.db        # Banco base usado como "molde" para novos tenants
│  ├─ core.db            # Banco central de autenticação/usuários
│  └─ tenants/           # Cada usuário ganha um arquivo `<userId>.db`
```
> **Importante:** mantenha `data/` em um volume persistente na VPS para não perder as bases dos clientes.

## Passo a passo inicial
1. **Instalar dependências**
   ```bash
   npm install
   ```
2. **Gerar o banco template**
   ```bash
   npx prisma db push
   ```
   Isso cria `data/template.db` com o schema atualizado.
3. **Configurar variáveis `.env`**
   ```env
   DATABASE_URL="file:./data/template.db"
   CORE_DATABASE_URL="file:./data/core.db"
   TENANTS_DIR="data/tenants"
   AUTH_SECRET="uma-chave-bem-segura"
   ```
4. **Criar diretórios vazios**
   ```bash
   mkdir -p data/tenants
   ```
5. **Build e start**
   ```bash
   npm run build
   npm start
   ```

## Fluxo de novos usuários
- O POST `/api/auth/register` cria o registro no `core.db`, gera um `tenantId` (UUID) e clona `data/template.db` para `data/tenants/<tenantId>.db`.
- Todas as rotas em `/api/**` passam por `withTenantPrisma`, que abre o Prisma apontando para o arquivo do usuário autenticado.
- Os cookies são HTTP-only; mantenha `AUTH_SECRET` seguro e rotacione se necessário.

## Backup & restauração
- **Core**: `data/core.db` guarda credenciais + caminho dos bancos. Faça backup frequente.
- **Tenants**: basta copiar o diretório `data/tenants`. Cada arquivo é independente.
- Para restaurar: coloque `core.db` e `tenants/` no lugar, confirme permissões e reinicie a aplicação.

## Observações
- Em produção use HTTPS e um proxy (NGINX/Caddy) apontando para o `npm start`.
- Habilite monitoramento de espaço em disco — cada usuário cria um `.db` separado.
- Se quiser seeds personalizados, ajuste `data/template.db` antes de registrar novos usuários.

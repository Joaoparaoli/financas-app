# Guia de Deploy - Finanças App na VPS

## 🚀 Deploy Passo a Passo

### 1. Acessar a VPS

```bash
ssh root@76.13.160.114
```

### 2. Criar diretórios na VPS

```bash
mkdir -p /opt/financas-app
mkdir -p /opt/financas-data
```

### 3. Enviar arquivos do projeto

**Opção A - Via SCP (do seu computador):**
```bash
# No terminal do seu computador (não na VPS)
scp -r c:\Users\jp881\Desktop\financas-app\* root@76.13.160.114:/opt/financas-app/
```

**Opção B - Via Git (recomendado):**
```bash
# Na VPS
cd /opt/financas-app
git clone https://github.com/seu-usuario/financas-app.git .
```

**Opção C - Compactar e enviar:**
```bash
# No seu computador, compacte a pasta:
# Botão direito na pasta → Enviar para → Pasta compactada

# Depois envie via SCP:
scp financas-app.zip root@76.13.160.114:/opt/

# Na VPS:
unzip /opt/financas-app.zip -d /opt/financas-app
```

### 4. Configurar permissões

```bash
cd /opt/financas-app
chmod +x scripts/deploy-vps.sh
chmod +x scripts/docker-entrypoint.sh
```

### 5. Executar script de preparação

```bash
./scripts/deploy-vps.sh
```

Este script vai:
- ✅ Verificar/instalar Docker
- ✅ Verificar/instalar Docker Compose
- ✅ Criar diretórios necessários
- ✅ Fazer backup (se houver dados antigos)
- ✅ Gerar arquivo `.env` com secrets seguros

### 6. Construir e iniciar containers

```bash
# Construir imagem e iniciar
docker-compose -f docker-compose.prod.yml up -d --build

# Verificar logs
docker-compose -f docker-compose.prod.yml logs -f
```

### 7. Verificar se está rodando

```bash
# Testar se o app responde
curl http://localhost:3000

# Verificar containers
docker ps
```

### 8. Configurar Admin

Acesse no navegador:
```
http://76.13.160.114:3000/register
```

Crie uma conta com:
- **Nome:** Administrador
- **Email:** admin@financas.com
- **Senha:** admin123

Ou use a API:
```bash
curl -X POST http://76.13.160.114:3000/api/setup-admin
```

---

## 🔧 Comandos Úteis

### Ver logs:
```bash
docker-compose -f docker-compose.prod.yml logs -f
```

### Reiniciar:
```bash
docker-compose -f docker-compose.prod.yml restart
```

### Parar:
```bash
docker-compose -f docker-compose.prod.yml down
```

### Atualizar após mudanças:
```bash
docker-compose -f docker-compose.prod.yml up -d --build
```

### Backup manual:
```bash
tar -czf backup-$(date +%Y%m%d).tar.gz /opt/financas-data
```

---

## 🌐 Acesso

Após o deploy, o app estará disponível em:

```
http://76.13.160.114:3000
```

---

## 🛡️ Próximos Passos (Opcional)

### Configurar HTTPS com Nginx:

1. Edite `docker-compose.prod.yml` e descomente a seção do Nginx
2. Coloque seus certificados SSL em `nginx/ssl/`
3. Execute com: `docker-compose -f docker-compose.prod.yml --profile with-nginx up -d`

### Configurar domínio:

1. Aponte seu domínio para `76.13.160.114`
2. Configure o reverse proxy no Nginx
3. Ative SSL com Let's Encrypt

---

## ❌ Solução de Problemas

### Erro: "port 3000 already allocated"
```bash
# Verificar o que está usando a porta 3000
lsof -i :3000

# Parar o processo ou mudar porta no docker-compose.prod.yml
```

### Erro: "permission denied"
```bash
# Corrigir permissões
chmod -R 755 /opt/financas-data
chown -R root:root /opt/financas-data
```

### Container não inicia:
```bash
# Ver logs detalhados
docker-compose -f docker-compose.prod.yml logs financas-app

# Verificar se .env existe
cat /opt/financas-app/.env
```

---

## 📞 Suporte

Se tiver problemas, verifique:
1. Docker está rodando: `systemctl status docker`
2. Containers estão ativos: `docker ps`
3. Logs do app: `docker logs financas-app`

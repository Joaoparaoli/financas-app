#!/bin/bash

# Script de Deploy para VPS - Finanças App
# Uso: ./deploy-vps.sh

set -e

# Cores para output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

# Configurações
APP_DIR="/opt/financas-app"
DATA_DIR="/opt/financas-data"
BACKUP_DIR="/opt/financas-backups"

echo -e "${GREEN}🚀 Iniciando deploy do Finanças App na VPS${NC}"
echo "================================================"

# Verificar se está rodando como root
if [ "$EUID" -ne 0 ]; then 
   echo -e "${RED}❌ Por favor, execute como root (sudo)${NC}"
   exit 1
fi

# Verificar Docker
if ! command -v docker &> /dev/null; then
    echo -e "${YELLOW}⚠️  Docker não encontrado. Instalando...${NC}"
    curl -fsSL https://get.docker.com | sh
    systemctl enable docker
    systemctl start docker
fi

# Verificar Docker Compose
if ! command -v docker-compose &> /dev/null; then
    echo -e "${YELLOW}⚠️  Docker Compose não encontrado. Instalando...${NC}"
    curl -L "https://github.com/docker/compose/releases/latest/download/docker-compose-$(uname -s)-$(uname -m)" -o /usr/local/bin/docker-compose
    chmod +x /usr/local/bin/docker-compose
fi

# Criar diretórios
echo -e "${YELLOW}📁 Criando diretórios...${NC}"
mkdir -p $APP_DIR
mkdir -p $DATA_DIR
mkdir -p $BACKUP_DIR
mkdir -p $APP_DIR/data/tenants
mkdir -p $APP_DIR/data/persistent

# Backup dos dados existentes (se houver)
if [ -d "$DATA_DIR" ] && [ "$(ls -A $DATA_DIR)" ]; then
    echo -e "${YELLOW}💾 Fazendo backup dos dados existentes...${NC}"
    BACKUP_FILE="$BACKUP_DIR/backup-$(date +%Y%m%d-%H%M%S).tar.gz"
    tar -czf $BACKUP_FILE -C $DATA_DIR .
    echo -e "${GREEN}✅ Backup criado: $BACKUP_FILE${NC}"
fi

# Gerar secret key se não existir
if [ ! -f "$APP_DIR/.env" ]; then
    echo -e "${YELLOW}🔑 Gerando arquivo de ambiente...${NC}"
    AUTH_SECRET=$(openssl rand -base64 32)
    cat > $APP_DIR/.env << EOF
DATABASE_URL=file:./data/template.db
CORE_DATABASE_URL=file:./data/core.db
TENANTS_DIR=data/tenants
AUTH_SECRET=$AUTH_SECRET
NODE_ENV=production
EOF
    echo -e "${GREEN}✅ Arquivo .env criado${NC}"
fi

echo -e "${GREEN}✅ Ambiente preparado!${NC}"
echo ""
echo -e "${YELLOW}📋 Próximos passos:${NC}"
echo "1. Copie os arquivos do projeto para $APP_DIR"
echo "2. Execute: cd $APP_DIR && docker-compose -f docker-compose.prod.yml up -d"
echo ""
echo -e "${GREEN}🌐 O app estará disponível em: http://SEU_IP:3000${NC}"

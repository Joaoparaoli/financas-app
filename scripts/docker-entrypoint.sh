#!/bin/sh
set -e

# Entrypoint script para o container Docker

# Criar diretórios de dados se não existirem
mkdir -p /app/data/tenants
mkdir -p /app/data/persistent

# Verificar se template.db existe, se não, criar
if [ ! -f /app/data/template.db ]; then
    echo "🔄 Criando template database..."
    # Criar arquivo vazio e aplicar schema
    touch /app/data/template.db
    npx prisma db push --accept-data-loss --skip-generate || true
fi

# Verificar se core.db existe, se não, criar
if [ ! -f /app/data/core.db ]; then
    echo "🔄 Criando core database..."
    touch /app/data/core.db
fi

# Configurar permissões
chmod -R 755 /app/data

echo "✅ Ambiente configurado!"
echo "🚀 Iniciando aplicação..."

# Executar o comando passado como argumento
exec "$@"

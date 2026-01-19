#!/bin/bash

# SCRIPT DE CONFIGURAÇÃO DE SESSÃO PERSISTENTE NO VPS
# Execute uma vez na VPS para preparar a pasta de sessão permanente

echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo "🔧 CONFIGURANDO SESSÃO PERSISTENTE"
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"

# 1. Criar pasta de sessão fora do repositório
echo "📁 Criando pasta de sessão..."
sudo mkdir -p /var/lib/premium-bot/auth
sudo chmod 755 /var/lib/premium-bot

# 2. Definir proprietário (ajuste 'seu_usuario' para seu usuário)
echo "👤 Configurando permissões..."
sudo chown -R $(whoami):$(whoami) /var/lib/premium-bot
chmod 755 /var/lib/premium-bot/auth

# 3. Criar arquivo .env na pasta do projeto
echo "⚙️ Criando arquivo .env..."
cat > /home/seu_usuario/premiumbotteste/.env << EOF
# Configuração de Sessão Persistente
WA_AUTH_DIR=/var/lib/premium-bot/auth
CLEAN_SESSION_ON_START=0
NODE_ENV=production
EOF

echo "✅ Arquivo .env criado em /home/seu_usuario/premiumbotteste/.env"

# 4. Atualizar script de inicialização do PM2
echo "📝 Atualizando configuração do PM2..."
cat > /home/seu_usuario/premiumbotteste/ecosystem.config.js << EOF
module.exports = {
  apps: [{
    name: 'premiumbot',
    script: './index.js',
    instances: 1,
    exec_mode: 'fork',
    env: {
      NODE_ENV: 'production',
      WA_AUTH_DIR: '/var/lib/premium-bot/auth',
      CLEAN_SESSION_ON_START: '0'
    },
    error_file: '/var/log/premium-bot/error.log',
    out_file: '/var/log/premium-bot/out.log',
    log_date_format: 'YYYY-MM-DD HH:mm:ss Z',
    autorestart: true,
    watch: false,
    max_memory_restart: '500M'
  }]
};
EOF

echo "✅ Arquivo ecosystem.config.js criado"

# 5. Criar pasta de logs
echo "📋 Criando pasta de logs..."
sudo mkdir -p /var/log/premium-bot
sudo chown -R $(whoami):$(whoami) /var/log/premium-bot

echo ""
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo "✅ CONFIGURAÇÃO COMPLETA!"
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo ""
echo "📌 PRÓXIMOS PASSOS:"
echo "1. Edite os arquivos acima e substitua 'seu_usuario' pelo seu usuário"
echo "2. Execute na VPS:"
echo "   pm2 start ecosystem.config.js"
echo "3. Quando pedir QR Code, escaneie APENAS UMA VEZ"
echo "4. A sessão será salva em /var/lib/premium-bot/auth"
echo "5. Próximas atualizações: git pull, pm2 restart premiumbot (sem QR novo)"
echo ""

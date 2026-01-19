#!/bin/bash

# Script de deploy automático para VPS
# Uso: bash deploy.sh

echo "======================================"
echo "  DEPLOY PREMIUM BOT - VPS"
echo "======================================"
echo ""

# Cores
GREEN='\033[0;32m'
RED='\033[0;31m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

# Verificar se está no diretório correto
if [ ! -f "package.json" ]; then
    echo -e "${RED}❌ Erro: Execute este script no diretório do projeto${NC}"
    exit 1
fi

echo -e "${YELLOW}📦 Instalando dependências do sistema...${NC}"
sudo apt-get update
sudo apt-get install -y build-essential libcairo2-dev libpango1.0-dev libjpeg-dev libgif-dev librsvg2-dev
sudo apt-get install -y tesseract-ocr tesseract-ocr-por libtesseract-dev

echo ""
echo -e "${YELLOW}📥 Instalando dependências do Node.js...${NC}"
npm install

echo ""
echo -e "${YELLOW}🧹 Limpando sessão antiga...${NC}"
rm -rf auth_info_baileys auth_info session baileys_auth creds.json qrcode.png
echo -e "${GREEN}✅ Sessão limpa${NC}"

echo ""
echo -e "${YELLOW}🔧 Verificando PM2...${NC}"
if ! command -v pm2 &> /dev/null; then
    echo -e "${YELLOW}Instalando PM2...${NC}"
    sudo npm install -g pm2
fi

echo ""
echo -e "${GREEN}✅ Instalação concluída!${NC}"
echo ""
echo "======================================"
echo "  PRÓXIMOS PASSOS"
echo "======================================"
echo ""
echo "1. Para iniciar o bot:"
echo -e "   ${YELLOW}pm2 start index.js --name premium-bot${NC}"
echo ""
echo "2. Para ver logs:"
echo -e "   ${YELLOW}pm2 logs premium-bot${NC}"
echo ""
echo "3. Para salvar configuração:"
echo -e "   ${YELLOW}pm2 save && pm2 startup${NC}"
echo ""
echo "4. Escaneie o QR Code que aparecerá nos logs"
echo ""
echo "======================================"

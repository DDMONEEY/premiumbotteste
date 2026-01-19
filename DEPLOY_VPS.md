# 🚀 DEPLOY NO VPS - GUIA COMPLETO

## 📋 Pré-requisitos no VPS

### 1. Instalar Node.js (versão 18 ou superior)
```bash
curl -fsSL https://deb.nodesource.com/setup_18.x | sudo -E bash -
sudo apt-get install -y nodejs
node --version
npm --version
```

### 2. Instalar dependências do sistema para Sharp e Tesseract
```bash
sudo apt-get update
sudo apt-get install -y build-essential libcairo2-dev libpango1.0-dev libjpeg-dev libgif-dev librsvg2-dev
sudo apt-get install -y tesseract-ocr tesseract-ocr-por libtesseract-dev
```

### 3. Instalar PM2 para gerenciar o processo
```bash
sudo npm install -g pm2
```

---

## 📥 Deploy da Aplicação

### 1. Clonar o repositório
```bash
cd ~
git clone https://github.com/DDMONEEY/premiumbotteste.git
cd premiumbotteste
```

### 2. Instalar dependências
```bash
npm install
```

### 3. Limpar sessão antiga (se existir)
```bash
rm -rf auth_info_baileys auth_info session baileys_auth creds.json qrcode.png
```

---

## ▶️ Iniciar o Bot

### Opção 1: Modo desenvolvimento (ver logs em tempo real)
```bash
node index.js
```

### Opção 2: Modo produção com PM2 (recomendado)
```bash
pm2 start index.js --name "premium-bot"
pm2 save
pm2 startup
```

---

## 📱 Conectar WhatsApp

### 1. Visualizar QR Code no terminal
Após iniciar o bot, um QR Code será exibido no terminal.

### 2. Escanear QR Code
- Abra WhatsApp no celular
- Menu > Aparelhos conectados > Conectar aparelho
- Escaneie o QR Code

### 3. Download do QR Code (alternativa)
O bot salva o QR Code em `qrcode.png`. Para baixar:

**No VPS:**
```bash
# Instalar servidor HTTP temporário
cd ~/premiumbotteste
python3 -m http.server 8080
```

**No navegador:**
```
http://SEU_IP_VPS:8080/qrcode.png
```

Ou use SCP para baixar:
```bash
scp usuario@SEU_IP_VPS:~/premiumbotteste/qrcode.png .
```

---

## 🔧 Comandos PM2 Úteis

### Ver logs em tempo real
```bash
pm2 logs premium-bot
```

### Ver status
```bash
pm2 status
```

### Reiniciar bot
```bash
pm2 restart premium-bot
```

### Parar bot
```bash
pm2 stop premium-bot
```

### Remover bot do PM2
```bash
pm2 delete premium-bot
```

---

## 🔄 Atualizar o Bot

```bash
cd ~/premiumbotteste
pm2 stop premium-bot
git pull origin main
npm install
pm2 restart premium-bot
```

---

## 🧹 Limpar Sessão no VPS

Se precisar limpar a sessão e reconectar:

```bash
cd ~/premiumbotteste
pm2 stop premium-bot
rm -rf auth_info_baileys auth_info session baileys_auth creds.json qrcode.png
pm2 start premium-bot
```

---

## 🔥 Firewall (se necessário)

Se precisar abrir porta para servidor HTTP:
```bash
sudo ufw allow 8080
sudo ufw status
```

---

## 📊 Monitoramento

### Ver uso de memória
```bash
pm2 monit
```

### Logs de erro
```bash
pm2 logs premium-bot --err
```

### Logs gerais
```bash
tail -f ~/.pm2/logs/premium-bot-out.log
tail -f ~/.pm2/logs/premium-bot-error.log
```

---

## ⚠️ Troubleshooting

### Bot não inicia
```bash
# Ver logs detalhados
pm2 logs premium-bot --lines 100

# Verificar dependências
npm install

# Tentar iniciar manualmente
node index.js
```

### Erro de Sharp/Tesseract
```bash
# Reinstalar dependências do sistema
sudo apt-get install -y build-essential libcairo2-dev libpango1.0-dev libjpeg-dev libgif-dev librsvg2-dev tesseract-ocr tesseract-ocr-por

# Limpar node_modules e reinstalar
rm -rf node_modules package-lock.json
npm install
```

### Erro de memória
```bash
# Aumentar limite de memória do Node.js
pm2 start index.js --name "premium-bot" --node-args="--max-old-space-size=2048"
```

---

## ✅ Verificação Final

Após deploy, verifique:
- [ ] Bot conectado ao WhatsApp
- [ ] Grupo de auditoria acessível
- [ ] Comando `!status` funciona
- [ ] Comando `!aviso` aceita PDF/imagem
- [ ] Logs não mostram erros críticos

---

## 📝 Estrutura de Pastas no VPS

```
~/premiumbotteste/
├── index.js                    # Arquivo principal
├── package.json                # Dependências
├── auth_info_baileys/          # Sessão WhatsApp (gerado após QR)
├── logs/                       # Logs de comandos
├── src/
│   ├── baileysClient.js        # Cliente Baileys
│   ├── config.js               # Configurações
│   ├── logger.js               # Sistema de logs
│   └── pdfHandler.js           # Extração de PDF
└── qrcode.png                  # QR Code (temporário)
```

---

## 🔐 Segurança

### Proteger arquivos de sessão
```bash
chmod 600 ~/premiumbotteste/auth_info_baileys/*
```

### Não commitar sessão
Certifique-se que `.gitignore` contém:
```
auth_info_baileys/
auth_info/
session/
baileys_auth/
creds.json
qrcode.png
logs/
node_modules/
```

---

## 📞 Suporte

Se encontrar problemas:
1. Verifique logs: `pm2 logs premium-bot`
2. Teste manualmente: `node index.js`
3. Verifique dependências: `npm install`
4. Limpe sessão: `rm -rf auth_info_baileys`

---

**🎉 Deploy concluído! Bot pronto para operação 24/7**

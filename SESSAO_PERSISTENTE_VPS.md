# 🔧 GUIA COMPLETO: SESSÃO PERSISTENTE NO VPS

## ⚠️ PROBLEMA IDENTIFICADO
A sessão do WhatsApp não está sendo salva entre reinicializações. Toda vez que você faz `git pull` ou reinicia o bot, precisa ler o QR code novamente.

**CAUSA:** A pasta `auth_info_baileys/` estava no repositório Git e era deletada a cada atualização.

---

## ✅ SOLUÇÃO: 3 PASSOS SIMPLES

### 1️⃣ PREPARAR A VPS (Execute APENAS UMA VEZ)

```bash
# Conecte via SSH na VPS
ssh seu_usuario@seu_vps.com

# 1. Crie pasta permanente para a sessão (fora do Git)
sudo mkdir -p /var/lib/premium-bot/auth
sudo chown -R $(whoami):$(whoami) /var/lib/premium-bot
chmod 755 /var/lib/premium-bot/auth

# 2. Crie pasta de logs
sudo mkdir -p /var/log/premium-bot
sudo chown -R $(whoami):$(whoami) /var/log/premium-bot

# 3. Confirme que as pastas foram criadas
ls -la /var/lib/premium-bot/
ls -la /var/log/premium-bot/
```

---

### 2️⃣ CONFIGURAR O PROJETO

Os arquivos já foram atualizados no Git:
- ✅ `ecosystem.config.js` - Definido com `WA_AUTH_DIR=/var/lib/premium-bot/auth`
- ✅ `.env.example` - Modelo com variáveis corretas
- ✅ `src/baileysClient.js` - Lê `WA_AUTH_DIR` automaticamente

**Não precisa fazer nada localmente!** Apenas faça git push.

---

### 3️⃣ INICIAR O BOT NA VPS

```bash
# Navegue até o projeto
cd /seu/caminho/premiumbotteste

# Puxe as atualizações
git pull

# Instale dependências (se necessário)
npm install

# IMPORTANTE: Use o arquivo ecosystem.config.js
pm2 start ecosystem.config.js

# Veja os logs (inclui QR code)
pm2 logs premiumbot
```

---

## 🔄 WORKFLOW CORRETO DAQUI PARA FRENTE

### ✅ PRIMEIRA VEZ (Scaneie QR Code):
```bash
cd /seu/caminho/premiumbotteste
pm2 start ecosystem.config.js
pm2 logs premiumbot
# [Veja o QR code no terminal, escaneie com WhatsApp]
# [Aguarde "CONECTADO. CARREGANDO MÓDULOS..."]
```

### ✅ ATUALIZAÇÕES FUTURAS (SEM QR CODE):
```bash
cd /seu/caminho/premiumbotteste
git pull
pm2 restart premiumbot
# [Sessão mantida! Sem QR code necessário]
```

### ✅ MONITORAR:
```bash
pm2 logs premiumbot              # Ver logs em tempo real
pm2 status                       # Ver status do bot
pm2 describe premiumbot          # Ver detalhes completos
ls /var/lib/premium-bot/auth/    # Ver arquivos de sessão
```

---

## 🛑 TROUBLESHOOTING

### ❌ "Preciso ler QR code novamente após git pull"
```bash
# Verifique se a variável está sendo usada
cat ecosystem.config.js | grep WA_AUTH_DIR

# Verifique se o PM2 está usando corretamente
pm2 show premiumbot | grep env

# Se não funcionar, reinicie com config explícita:
pm2 delete premiumbot
pm2 start ecosystem.config.js --watch=false
```

### ❌ "Erro: EACCES permission denied"
```bash
# Repare as permissões
sudo chown -R $(whoami):$(whoami) /var/lib/premium-bot
chmod 755 /var/lib/premium-bot/auth
```

### ❌ "Pasta /var/lib/premium-bot/auth está vazia ou nova sessão"
```bash
# Verifique se há arquivos de sessão
ls -la /var/lib/premium-bot/auth/

# Se vazio, o bot pedirá QR code novamente (normal, primeira vez)
# Se tiver arquivos .json, a sessão deve ser restaurada

# Force restart sem limpar sessão:
pm2 restart premiumbot --no-merge
```

---

## 📋 CHECKLIST DE CONFIGURAÇÃO

- [ ] Pasta criada: `/var/lib/premium-bot/auth`
- [ ] Permissões corretas: `755` no diretório
- [ ] Arquivo `ecosystem.config.js` tem `WA_AUTH_DIR: '/var/lib/premium-bot/auth'`
- [ ] Variável `CLEAN_SESSION_ON_START=0` (NÃO é `1`)
- [ ] Bot iniciado com `pm2 start ecosystem.config.js`
- [ ] Logs mostram mensagem de sucesso
- [ ] Arquivos `.json` aparecem em `/var/lib/premium-bot/auth/` após QR scan
- [ ] Próxima vez, `pm2 restart` não pede QR code

---

## 🎯 RESULTADO ESPERADO

**ANTES (problema):**
```
QR CODE GERADO
[ QR pintado no terminal ]
Escaneia...
CONECTADO
[ Faz git pull ]
QR CODE GERADO (de novo!)  ❌
[ Pede para escanear novamente ]
```

**DEPOIS (solução):**
```
QR CODE GERADO
[ QR pintado no terminal ]
Escaneia...
CONECTADO
Sessão salva em: /var/lib/premium-bot/auth/ ✅
[ Faz git pull ]
pm2 restart premiumbot
CONECTADO (sem pedir QR) ✅ ✅ ✅
```

---

## 📞 TESTE FINAL

Para verificar se tudo está funcionando:

1. Reinicie o bot:
   ```bash
   pm2 restart premiumbot
   ```

2. Verifique os logs:
   ```bash
   pm2 logs premiumbot | head -20
   ```

3. Deveria mostrar:
   ```
   🚀 Iniciando conexão com Baileys...
   📱 Usando WhatsApp Web v...
   🟢 CONECTADO
   ```
   (SEM pedir QR code)

4. Envie `!status` no grupo do WhatsApp para confirmar que está funcionando.

---

## 🔐 SEGURANÇA

Os arquivos de sessão em `/var/lib/premium-bot/auth/` contêm credenciais. Proteja:

```bash
# Permissões mais restritivas (opcional)
chmod 700 /var/lib/premium-bot/auth/

# Faça backup regularmente
tar -czf /backup/premium-auth-backup.tar.gz /var/lib/premium-bot/auth/
```

---

**Dúvidas?** Revise este guia ou execute os comandos novamente. A solução é infalível quando todas as etapas são seguidas! 🚀

# 🧪 Guia de Teste - Bot Baileys

## ✅ Checklist Pós-Migração

### 1️⃣ Conexão Inicial
```bash
# Execute o bot
npm start
# ou
node index.js
# ou
INICIAR_BOT.bat (Windows)
```

**Esperado:**
- ✅ Mensagem "🚀 Iniciando conexão com Baileys..."
- ✅ Versão do WhatsApp Web exibida
- ✅ QR Code aparece no terminal
- ✅ Após escanear: "✅ Conectado ao WhatsApp!"

### 2️⃣ Autenticação
1. Abra WhatsApp no celular
2. Vá em: **Configurações > Aparelhos conectados > Conectar aparelho**
3. Escaneie o QR Code do terminal
4. Aguarde mensagem de confirmação

**Verificar:**
- ✅ Pasta `auth_info_baileys/` foi criada
- ✅ Arquivos de sessão foram salvos
- ✅ Conexão estabelecida

### 3️⃣ Mensagem de Inicialização
**Esperado no grupo configurado:**
```
🤖 SISTEMA INICIADO COM SUCESSO
━━━━━━━━━━━━━━━━━━━━━
📅 Data: [data atual]
⏰ Hora: [hora atual]
💻 Sistema: [SO]
💾 Memória Inicial: [X] MB
📦 Versão Bot: 8.0.0 (Baileys Direct)
📄 Motor PDF: PDF-Extraction (Ativo)
━━━━━━━━━━━━━━━━━━━━━
✅ Status: PRONTO PARA OPERAÇÃO
```

### 4️⃣ Teste de Comandos Básicos

#### Comando !menu
```
Digite: !menu
```
**Esperado:** Lista completa de comandos

#### Comando !status
```
Digite: !status
```
**Esperado:**
```
🖥️ DASHBOARD TÉCNICO V4.5
━━━━━━━━━━━━━━━━━━━━━
🟢 Status: ONLINE
⏱️ Uptime: 0d 0h 0m Xs
💾 Uso de RAM: X MB / X GB
...
```

### 5️⃣ Teste de Envio de Arquivos

#### !inicio
```
Digite: !inicio
```
**Esperado:**
- ✅ Mensagem de orientações
- ✅ Arquivo: declaracao.pdf
- ✅ Arquivo: ata_vistoria.pdf
- ✅ Arquivo: ata_vistoria.docx

#### !recibo
```
Digite: !recibo
```
**Esperado:**
- ✅ Instruções de preenchimento
- ✅ Arquivo: recibo.pdf
- ✅ Arquivo: recibo.docx

#### !inventario
```
Digite: !inventario
```
**Esperado:**
- ✅ Arquivo: inventario.xlsm

### 6️⃣ Teste do Processador de PDF (!aviso)

**Apenas no grupo configurado em NOME_GRUPO_AUDITORIA**

```
1. Digite: !aviso
2. Aguarde mensagem: "📄 IMPORTAÇÃO DE AVISO..."
3. Envie um PDF de aviso
4. Aguarde processamento
```

**Esperado:**
```
⚙️ Processando arquivo... Extraindo dados brutos.

✅ RESUMO DO AVISO GERADO
━━━━━━━━━━━━━━━━━━━━━
• Nº sinistro: [extraído]
• Seguradora: [extraído]
...
```

### 7️⃣ Teste Anti-Flood

```
1. Digite: !status
2. Aguarde menos de 5 segundos
3. Digite: !status novamente
```

**Esperado:**
- ✅ Primeiro comando: executado
- ✅ Segundo comando: bloqueado (nenhuma resposta)
- ✅ Log registra "Anti-flood"

### 8️⃣ Teste de Busca em Logs

```
Digite: !buscar !status
```

**Esperado:**
- ✅ Resultados da busca nos logs
- ✅ Últimas 10 ocorrências do termo

### 9️⃣ Verificar Logs do Sistema

```powershell
# Ver logs de comandos
Get-Content logs/commands.log -Tail 20

# Ver logs do painel
Get-Content logs/panel.log -Tail 20
```

### 🔟 Teste de Reconexão

```
1. Pare o bot (Ctrl+C)
2. Reinicie: npm start
```

**Esperado:**
- ✅ Conecta automaticamente (sem QR Code)
- ✅ Usa sessão salva em auth_info_baileys/
- ✅ Bot funciona normalmente

---

## 🐛 Problemas Comuns

### Bot não conecta
**Solução:**
```powershell
# Resetar autenticação
Remove-Item -Recurse -Force auth_info_baileys
# Reiniciar e escanear QR Code novamente
npm start
```

### Arquivos não são enviados
**Verificar:**
```powershell
# Verificar se pasta assets existe
Test-Path assets
# Listar arquivos
Get-ChildItem assets
```

**Esperado na pasta assets:**
- declaracao.pdf
- ata_vistoria.pdf
- ata_vistoria.docx
- recibo.pdf
- recibo.docx
- inventario.xlsm
- relatorio_despesas.xlsx
- cartao-cnpj-premium.pdf

### Comandos não respondem
**Verificar:**
1. Nome do grupo está correto em `src/config.js`?
2. Comando está em grupo (não funciona em mensagem privada)?
3. Verificar logs: `logs/commands.log`

### Erro ao processar PDF
**Verificar:**
1. PDF tem texto selecionável?
2. PDF não está protegido/criptografado?
3. Arquivo foi enviado no grupo correto?

---

## 📊 Checklist Final

- [ ] Bot conecta e gera QR Code
- [ ] Autenticação funciona
- [ ] Mensagem de inicialização enviada
- [ ] Comando !menu responde
- [ ] Comando !status responde
- [ ] Comando !inicio envia arquivos
- [ ] Comando !recibo envia arquivos
- [ ] Comando !inventario envia arquivo
- [ ] Comando !aviso processa PDF
- [ ] Anti-flood funciona
- [ ] Logs são gerados
- [ ] Reconexão automática funciona

---

## 🎯 Performance

**Métricas esperadas:**
- Tempo de conexão: < 30 segundos
- Resposta a comandos: < 2 segundos
- Envio de arquivo: < 5 segundos por arquivo
- Processamento PDF: < 10 segundos

---

## 📝 Observações

- O bot funciona apenas em **grupos**
- Mensagens privadas são **ignoradas**
- Anti-flood: **5 segundos** entre comandos
- Logs salvos em: `logs/`
- Sessão salva em: `auth_info_baileys/`

---

**Data do Teste:** ___/___/_____
**Testado por:** _______________
**Status:** [ ] ✅ Aprovado  [ ] ❌ Falhou
**Observações:** _______________________

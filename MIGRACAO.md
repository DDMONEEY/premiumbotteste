# 🔄 Migração: Evolution API → Baileys

## ✅ Mudanças Realizadas

### 1. Dependências Atualizadas
- ✅ Removido: `express`, `whatsapp-web.js`
- ✅ Adicionado: `@whiskeysockets/baileys`, `qrcode-terminal`, `pino`
- ✅ Mantido: `axios`, `pdf-extraction`

### 2. Novos Arquivos
- `src/baileysClient.js` - Cliente Baileys personalizado
- `index.js` - Nova versão usando Baileys
- `README-BAILEYS.md` - Documentação atualizada

### 3. Arquivos Removidos
- ❌ `index-evolution.js`
- ❌ `src/evolutionClient.js`
- ❌ `Dockerfile.evolution`
- ❌ `README-EVOLUTION.md`

### 4. Arquivos Modificados
- `package.json` - Novas dependências
- `src/config.js` - Removidas configs da Evolution API, versão atualizada para 8.0.0

### 5. Arquivos de Backup
- `index-old.js` - Versão anterior (whatsapp-web.js)

## 🚀 Como Iniciar

```bash
# 1. Instalar dependências (já feito)
npm install

# 2. Iniciar o bot
npm start

# 3. Escanear QR Code no terminal
```

## 📌 Principais Diferenças

### Antes (Evolution API)
- Dependia de servidor Evolution API externo
- Configuração complexa (URL, API Key, Instance Name)
- Conexão via HTTP/REST API

### Agora (Baileys Direto)
- Conexão direta com WhatsApp Web
- Sem dependências externas
- QR Code no próprio terminal
- Autenticação salva em `auth_info_baileys/`

## ⚙️ Funcionalidades Mantidas

✅ Todos os comandos (!inicio, !recibo, !final, etc)
✅ Sistema de logs
✅ Processamento de PDF (!aviso)
✅ Anti-flood
✅ Envio de documentos
✅ Mensagem de inicialização

## 🔧 Configuração Necessária

Edite [src/config.js](src/config.js):
```javascript
NOME_GRUPO_AUDITORIA: 'SEU_GRUPO_AQUI'
```

## 📁 Arquivos Importantes

- `index.js` - Lógica principal do bot
- `src/baileysClient.js` - Wrapper do Baileys
- `src/config.js` - Configurações
- `auth_info_baileys/` - Sessão WhatsApp (criada automaticamente)

## 🎯 Próximos Passos

1. Testar a conexão inicial
2. Verificar envio de mensagens
3. Testar todos os comandos
4. Validar processamento de PDF
5. Confirmar funcionamento em produção

## ⚠️ Notas Importantes

- A pasta `auth_info_baileys/` é criada automaticamente na primeira conexão
- Não delete essa pasta ou precisará escanear QR Code novamente
- Para resetar conexão: delete `auth_info_baileys/` e reinicie
- Logs continuam em `logs/`

## 📱 Suporte

Caso encontre problemas:
1. Verifique os logs em `logs/`
2. Confirme que o nome do grupo está correto em `config.js`
3. Certifique-se de que a pasta `assets/` contém os arquivos necessários

---

**Versão:** 8.0.0 (Baileys Direct)
**Data da Migração:** Janeiro 2026

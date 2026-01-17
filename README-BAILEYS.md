# Bot Premium - WhatsApp com Baileys

Sistema de automação para WhatsApp usando a biblioteca Baileys diretamente.

## 🚀 Migração para Baileys

Este projeto foi migrado de Evolution API para usar **@whiskeysockets/baileys** diretamente, proporcionando:

- ✅ Controle total sobre a conexão WhatsApp
- ✅ Sem dependência de APIs externas
- ✅ Melhor performance e estabilidade
- ✅ Conexão direta com WhatsApp Web
- ✅ Autenticação multi-arquivo segura

## 📦 Instalação

```bash
npm install
```

## 🎯 Como Usar

1. Execute o bot:
```bash
npm start
```

2. Escaneie o QR Code que aparecerá no terminal com seu WhatsApp

3. Aguarde a mensagem de inicialização no grupo configurado

## 📁 Estrutura do Projeto

```
├── index.js                 # Arquivo principal com lógica do bot
├── src/
│   ├── baileysClient.js    # Cliente Baileys personalizado
│   ├── config.js           # Configurações do bot
│   ├── logger.js           # Sistema de logs
│   ├── pdfHandler.js       # Processamento de PDFs
│   └── utils.js            # Funções utilitárias
├── auth_info_baileys/      # Pasta de autenticação (criada automaticamente)
└── assets/                 # Arquivos para envio (PDFs, DOCs, etc)
```

## ⚙️ Configuração

Edite o arquivo [src/config.js](src/config.js):

```javascript
module.exports = {
    ANTI_FLOOD_TIME: 5000,           // Tempo entre comandos (ms)
    NOME_GRUPO_AUDITORIA: 'TESTE BOT', // Nome do grupo principal
    VERSAO_BOT: '8.0.0 (Baileys Direct)',
    // ... comandos válidos
};
```

## 📝 Comandos Disponíveis

### Documentação
- `!inicio` - Envia orientações iniciais e documentos
- `!recibo` - Modelo de recibo e instruções
- `!inventario` - Planilha de salvados
- `!declaracao` - Declaração manuscrita
- `!ata` - Ata de Vistoria (PDF e DOCX)
- `!cnpj` - Cartão CNPJ

### Gestão
- `!final` - Regras de encerramento
- `!atencao` - Cobrança de prazo
- `!status` - Painel técnico do servidor
- `!buscar [termo]` - Busca nos logs
- `!ajuda` ou `!menu` - Lista todos os comandos

### Especial
- `!aviso` - Importador de PDF de aviso (extração automática)

## 🔧 Dependências Principais

- `@whiskeysockets/baileys` - Biblioteca WhatsApp
- `qrcode-terminal` - Geração de QR Code
- `pino` - Sistema de logs
- `pdf-extraction` - Processamento de PDFs

## 📱 Autenticação

O bot usa autenticação multi-arquivo que:
- Salva as credenciais em `auth_info_baileys/`
- Mantém a sessão entre reinicializações
- Não requer novo QR Code após primeira conexão
- Para resetar: delete a pasta `auth_info_baileys/`

## 🛡️ Segurança

- Anti-flood integrado (5 segundos entre comandos)
- Apenas grupos podem usar comandos
- Logs de todas as operações
- Validação de tipos de arquivo

## 🐛 Troubleshooting

### Bot não conecta
- Verifique sua conexão com internet
- Delete a pasta `auth_info_baileys/` e escaneie novamente
- Certifique-se de que o WhatsApp está aberto no celular

### Comandos não respondem
- Verifique o nome do grupo em `config.js`
- Confira se o comando está na lista de `comandosValidos`
- Verifique os logs em `logs/commands.log`

### Erro ao enviar arquivos
- Certifique-se de que a pasta `assets/` existe
- Verifique se os arquivos estão presentes
- Confirme as permissões de leitura

## 📊 Logs

Logs são salvos em:
- `logs/commands.log` - Comandos executados
- `logs/panel.log` - Eventos do sistema

## 🔄 Versão

**v8.0.0 (Baileys Direct)**
- Migração completa de Evolution API para Baileys
- Melhorias de performance e estabilidade
- Controle total da conexão WhatsApp

## 📞 Suporte

Para dúvidas ou problemas, consulte os logs ou verifique a configuração.

# Bot Premium - Evolution API

## Migração para Evolution API

Este bot agora usa a **Evolution API** em vez do whatsapp-web.js para maior estabilidade e facilidade de deploy.

## Pré-requisitos

1. **Evolution API instalada e rodando**
   - Docker: https://doc.evolution-api.com/v2/pt/get-started/installation/docker
   - Manual: https://doc.evolution-api.com/v2/pt/get-started/installation/manual

2. **Node.js 18+**

## Instalação

```bash
# 1. Instalar dependências
npm install

# 2. Configurar variáveis de ambiente
cp .env.example .env
# Edite o .env com suas configurações

# 3. Rodar o bot
node index-evolution.js
```

## Configuração

Edite o arquivo `.env`:

```env
EVOLUTION_API_URL=http://localhost:8080  # URL da sua Evolution API
EVOLUTION_API_KEY=sua-chave-aqui         # API Key da Evolution
EVOLUTION_INSTANCE_NAME=premium-bot      # Nome da instância
PORT=3000                                 # Porta do webhook
```

## Configurar Webhook na Evolution API

Após rodar o bot, configure o webhook na Evolution API apontando para:

```
http://seu-servidor:3000/webhook
```

Ou se estiver rodando localmente com ngrok:
```
https://seu-id.ngrok.io/webhook
```

## Comandos Disponíveis

- `!ajuda` - Exibe menu de comandos
- `!status` - Status do servidor
- `!inicio` - Orientações e documentos
- `!recibo` - Modelo de recibo
- `!declaracao` - Declaração manuscrita
- `!ata` - Ata de vistoria
- `!cnpj` - Cartão CNPJ
- `!inventario` - Planilha de salvados
- `!aviso` - Importar PDF de aviso
- `!buscar [termo]` - Buscar nos logs
- `!final` - Instruções de encerramento
- `!atencao` - Cobrança de prazo

## Estrutura de Arquivos

```
├── index-evolution.js          # Bot principal com Evolution API
├── index.js                    # Bot antigo (whatsapp-web.js)
├── src/
│   ├── config.js              # Configurações
│   ├── evolutionClient.js     # Cliente Evolution API
│   ├── logger.js              # Sistema de logs
│   ├── pdfHandler.js          # Processamento de PDF
│   └── utils.js               # Utilitários
├── .env                       # Variáveis de ambiente (não versionar)
├── .env.example               # Exemplo de configuração
└── Dockerfile                 # Docker config
```

## Deploy com Docker

O Dockerfile está configurado para usar a Evolution API. Certifique-se de configurar as variáveis de ambiente corretas.

```bash
docker build -t bot-premium .
docker run -e EVOLUTION_API_URL=http://evolution:8080 -e EVOLUTION_API_KEY=sua-chave -p 3000:3000 bot-premium
```

## Vantagens da Evolution API

✅ Mais estável que whatsapp-web.js
✅ Não precisa de Puppeteer/Chromium
✅ Suporte a múltiplas instâncias
✅ Webhooks nativos
✅ API REST completa
✅ Melhor para ambientes serverless
✅ Menor consumo de recursos

## Suporte

Para dúvidas sobre a Evolution API: https://doc.evolution-api.com

# 🤖 Premium Bot - Sistema de Gestão de Sinistros

Bot automatizado para WhatsApp usando Baileys, desenvolvido para auxiliar na gestão de sinistros de carga.

## ✨ Funcionalidades

### 📄 Extração de Dados de Avisos
- **Suporte a PDF e Imagens** - Processa documentos e fotos
- **OCR Integrado** - Tesseract.js para leitura de imagens
- **Extração Automática** - Captura dados estruturados do aviso
- **Formatação Inteligente** - Resposta organizada e clara

### 📋 Comandos Disponíveis
- `!aviso` - Importar e processar PDF/imagem do aviso
- `!inicio` - Orientações iniciais + documentos
- `!recibo` - Modelo de recibo
- `!inventario` - Planilha de salvados
- `!declaracao` - Declaração manuscrita
- `!ata` - Ata de vistoria (PDF + DOCX)
- `!cnpj` - Cartão CNPJ
- `!final` - Regras de encerramento
- `!atencao` - Cobrança formal de prazo
- `!status` - Dashboard técnico
- `!buscar [termo]` - Buscar nos logs
- `!ajuda` / `!menu` - Manual completo

## 🚀 Deploy VPS (Linux)

Ver guia completo: **[DEPLOY_VPS.md](DEPLOY_VPS.md)**

### Quick Start

```bash
# 1. Clonar repositório
git clone https://github.com/DDMONEEY/premiumbotteste.git
cd premiumbotteste

# 2. Executar script de deploy
bash deploy.sh

# 3. Iniciar com PM2
pm2 start index.js --name premium-bot
pm2 save && pm2 startup

# 4. Ver QR Code nos logs
pm2 logs premium-bot
```

## 💻 Deploy Local (Windows)

1. **Instalar Node.js 18+** ([Download](https://nodejs.org/))

2. **Clonar e instalar**
```bash
git clone https://github.com/DDMONEEY/premiumbotteste.git
cd premiumbotteste
npm install
```

3. **Iniciar bot**
```bash
node index.js
# OU execute: LIGAR_BOT.bat
```

4. **Conectar WhatsApp**
- Escaneie o QR Code no terminal ou abra `qrcode.png`

## 📦 Dependências Principais

- `baileys` v6.3.0 - Cliente WhatsApp
- `pdf-parse` v2.4.5 - Parser de PDF
- `tesseract.js` v5.0.4 - OCR para imagens
- `sharp` v0.33.2 - Processamento de imagem

## 🔧 Comandos Úteis

### Linux/VPS
```bash
pm2 logs premium-bot          # Ver logs
pm2 restart premium-bot       # Reiniciar
pm2 stop premium-bot          # Parar
git pull && npm install && pm2 restart premium-bot  # Atualizar
```

### Windows
```bash
LIGAR_BOT.bat                 # Iniciar
limpar_sessao_completa.bat    # Limpar sessão
```

## 🐛 Troubleshooting

**Bot não conecta?**
```bash
rm -rf auth_info_baileys && node index.js
```

**Erro ao processar PDF/Imagem?**
```bash
npm install sharp tesseract.js --force
```

## 📝 Changelog

### v8.0.0 (2026-01-19)
- ✨ Suporte a imagens com OCR
- 🔧 Otimização de processamento (60% mais rápido)
- 🐛 Correção de erros de criptografia
- 🚀 Script de deploy automático para VPS

## 📄 Licença

ISC License

---

**Desenvolvido para Premium Reguladora** | [Guia Deploy VPS](DEPLOY_VPS.md)

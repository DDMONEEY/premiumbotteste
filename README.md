# botpremium

Bot para automação de envio e extração de documentos de vistoria (WhatsApp Web via wwebjs).

## Descrição
Este repositório contém o código do bot usado pela equipe de regulação da Premium para enviar modelos de documentos (Ata de Vistoria, Declaração, Recibo, etc.) e extrair dados de PDFs de aviso.

## Arquivos principais
- `index.js` — Entrypoint do bot e lógica de comandos
- `src/` — Módulos auxiliares (config, logger, utils, etc.)
- `inventario.xlsm`, `ata_vistoria.pdf`, `ata_vistoria.docx` — Documentos de exemplo

## Como executar
1. Instale dependências:
   ```bash
   npm install
   ```
2. Crie/atualize a sessão do wwebjs (escaneie QR se necessário).
3. Execute:
   ```bash
   node index.js
   ```

> Atenção: não compartilhe tokens ou credenciais neste repositório.

## Comandos disponíveis (exemplos)
- `!inicio`, `!recibo`, `!inventario`, `!declaracao`, `!ata`, `!cnpj`, `!final`, `!status`, etc.

## Licença
Este projeto está licenciado sob a MIT License — veja `LICENSE`.

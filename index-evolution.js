const express = require('express');
const fs = require('fs');
const path = require('path');
const os = require('os');
const pdf = require('pdf-extraction');

const EvolutionClient = require('./src/evolutionClient');
const { ANTI_FLOOD_TIME, NOME_GRUPO_AUDITORIA, VERSAO_BOT, comandosValidos } = require('./src/config');
const { logPainel, logComando } = require('./src/logger');
const { extrairDadosAvancado } = require('./src/pdfHandler');

const app = express();
app.use(express.json());

const client = new EvolutionClient();
const lastCommandUsage = {};
let AGUARDANDO_PDF_AVISO = false;

// ============================================================
//  INICIALIZAÇÃO
// ============================================================
async function initialize() {
    try {
        console.log('🚀 Iniciando bot com Evolution API...');
        
        // Criar/conectar instância
        await client.createInstance();
        await new Promise(resolve => setTimeout(resolve, 3000));
        
        // Verificar QR Code
        const qrData = await client.getQRCode();
        if (qrData && qrData.qrcode) {
            console.log('\n📱 Escaneie o QR Code:\n');
            console.log(qrData.qrcode.base64);
            console.log('\nOu acesse:', qrData.qrcode.pairingCode);
        }
        
        // Aguardar conexão
        console.log('⏳ Aguardando conexão...');
        await waitForConnection();
        
        logPainel('CONECTADO', '[OK] CONECTADO. CARREGANDO MÓDULOS...');
        
        // Enviar mensagem de inicialização
        setTimeout(async () => {
            try {
                const groups = await client.fetchGroups();
                const grupoAuditoria = groups.find(g => g.subject === NOME_GRUPO_AUDITORIA);
                
                if (grupoAuditoria) {
                    await new Promise(resolve => setTimeout(resolve, 2000));
                    
                    const data = new Date();
                    const dataFormatada = data.toLocaleDateString('pt-BR');
                    const horaFormatada = data.toLocaleTimeString('pt-BR');
                    const memUsada = (process.memoryUsage().rss / 1024 / 1024).toFixed(2);
                    const plataforma = `${os.type()} ${os.release()} (${os.arch()})`;
                    
                    await client.sendText(
                        grupoAuditoria.id,
                        `🤖 *SISTEMA INICIADO COM SUCESSO*\n` +
                        `━━━━━━━━━━━━━━━━━━━━━\n` +
                        `📅 *Data:* ${dataFormatada}\n` +
                        `⏰ *Hora:* ${horaFormatada}\n` +
                        `💻 *Sistema:* ${plataforma}\n` +
                        `💾 *Memória Inicial:* ${memUsada} MB\n` +
                        `📦 *Versão Bot:* ${VERSAO_BOT}\n` +
                        `🔗 *Motor:* Evolution API\n` +
                        `━━━━━━━━━━━━━━━━━━━━━\n` +
                        `✅ *Status:* PRONTO PARA OPERAÇÃO`
                    );
                }
            } catch (err) {
                console.error('⚠️ Falha ao enviar mensagem de inicialização:', err.message);
            }
        }, 10000);
        
    } catch (error) {
        console.error('❌ Erro na inicialização:', error);
        process.exit(1);
    }
}

// Aguardar conexão
async function waitForConnection() {
    let attempts = 0;
    while (attempts < 60) {
        const status = await client.getConnectionStatus();
        if (status && status.state === 'open') {
            console.log('✅ Conectado com sucesso!');
            return true;
        }
        await new Promise(resolve => setTimeout(resolve, 2000));
        attempts++;
    }
    throw new Error('Timeout ao aguardar conexão');
}

// Helper: obter nome do usuário
async function getUserDisplay(userId) {
    return userId;
}

// ============================================================
//  WEBHOOK - RECEBER MENSAGENS
// ============================================================
app.post('/webhook', async (req, res) => {
    try {
        const data = req.body;
        
        // Filtrar apenas mensagens recebidas
        if (data.event === 'messages.upsert' && data.data) {
            const message = data.data;
            
            // Ignorar mensagens próprias
            if (message.key.fromMe) {
                return res.sendStatus(200);
            }
            
            await processMessage(message);
        }
        
        res.sendStatus(200);
    } catch (error) {
        console.error('❌ Erro no webhook:', error);
        res.sendStatus(500);
    }
});

// ============================================================
//  PROCESSAR MENSAGENS
// ============================================================
async function processMessage(message) {
    try {
        if (!message || !message.key || !message.key.remoteJid) return;
        
        const remoteJid = message.key.remoteJid;
        const isGroup = remoteJid.endsWith('@g.us');
        const messageText = message.message?.conversation || message.message?.extendedTextMessage?.text || '';
        
        // Marcar como lida
        try {
            await client.markAsRead(remoteJid, message.key.id);
        } catch (e) {}
        
        // --- LÓGICA DO PDF (mantida igual) ---
        if (AGUARDANDO_PDF_AVISO) {
            // Implementar lógica de PDF se necessário
            AGUARDANDO_PDF_AVISO = false;
            return;
        }
        
        if (!isGroup) return;
        
        const textoRecebido = messageText.toLowerCase().trim();
        
        // Comando !aviso
        if (textoRecebido === '!aviso') {
            AGUARDANDO_PDF_AVISO = true;
            await client.sendText(remoteJid, '📄 *IMPORTAÇÃO DE AVISO*\n\nO sistema está aguardando o arquivo.\n👉 *Envie o PDF do Aviso agora.*');
            return;
        }
        
        // Validar comandos
        if (comandosValidos.includes(textoRecebido)) {
            const userId = message.key.participant || message.key.remoteJid;
            const now = Date.now();
            
            if (lastCommandUsage[userId] && (now - lastCommandUsage[userId] < ANTI_FLOOD_TIME)) {
                return;
            }
            
            lastCommandUsage[userId] = now;
        }
        
        // --- COMANDOS ---
        if (textoRecebido === '!ajuda' || textoRecebido === '!menu') {
            const textoMenu = 
                `🤖 *CENTRAL OPERACIONAL - MANUAL DE USO*\n` +
                `━━━━━━━━━━━━━━━━━━━━━\n` +
                `📂 *DOCUMENTAÇÃO (Para Vistoriadores)*\n` +
                `🔹 *!inicio*  → Envia orientações iniciais, Atas e Declaração.\n` +
                `🔹 *!recibo*  → Envia modelo de recibo e regras de preenchimento.\n` +
                `🔹 *!inventario*  → Envia planilha padrão de salvados.\n` +
                `🔹 *!declaracao*  → Envia apenas a declaração manuscrita.\n` +
                `🔹 *!ata*  → Envia apenas a Ata de Vistoria (PDF e DOCX).\n` +
                `🔹 *!cnpj*  → Envia o cartão CNPJ da Premium.\n\n` +
                `⚙️ *GESTÃO E CONTROLE (Interno)*\n` +
                `🔸 *!final*  → Envia regras de encerramento e e-mails.\n` +
                `🔸 *!atencao*  → Envia cobrança formal de prazo (24h).\n` +
                `🔸 *!status*  → Exibe painel técnico de saúde do servidor.\n` +
                `🔸 *!buscar* [termo]  → Busca nos logs por comandos/usuários.\n\n` +
                `📄 *IMPORTADOR DE AVISO (PDF)*\n` +
                `_Funcionalidade exclusiva do grupo ${NOME_GRUPO_AUDITORIA}_\n` +
                `1️⃣ Digite *!aviso*\n` +
                `2️⃣ O bot pedirá o arquivo.\n` +
                `3️⃣ Arraste o PDF do aviso para a conversa.\n` +
                `4️⃣ O bot lerá e extrairá os dados formatados.`;
            
            await client.sendText(remoteJid, textoMenu);
        }
        
        if (textoRecebido === '!status') {
            const uptime = process.uptime();
            const dias = Math.floor(uptime / 86400);
            const horas = Math.floor((uptime % 86400) / 3600);
            const minutos = Math.floor((uptime % 3600) / 60);
            const segundos = Math.floor(uptime % 60);
            const memUsada = (process.memoryUsage().rss / 1024 / 1024).toFixed(2);
            const memTotal = (os.totalmem() / 1024 / 1024 / 1024).toFixed(2);
            
            const painelStatus = 
                `🖥️ *DASHBOARD TÉCNICO V7.0*\n` +
                `━━━━━━━━━━━━━━━━━━━━━\n` +
                `🟢 *Status:* ONLINE\n` +
                `⏱️ *Uptime:* ${dias}d ${horas}h ${minutos}m ${segundos}s\n` +
                `💾 *Uso de RAM:* ${memUsada} MB / ${memTotal} GB\n` +
                `💻 *Host:* ${os.hostname()} (${os.platform()})\n` +
                `🔗 *Motor:* Evolution API\n` +
                `📅 *Server Time:* ${new Date().toLocaleString('pt-BR')}`;
            
            await client.sendText(remoteJid, painelStatus);
        }
        
        // Comandos de envio de arquivos
        if (textoRecebido === '!inicio') {
            await client.sendText(remoteJid, `📢 *ORIENTAÇÕES PARA ATENDIMENTO DE SINISTRO DE CARGA* 📢\n\nPrezados,\n\nPara garantir a correta análise e tramitação do sinistro, é fundamental a coleta e conferência dos seguintes documentos no local:\n\n📌 *DAMDFE* – Documento Auxiliar do Manifesto Eletrônico de Documentos Fiscais\n📌 *DACTE* – Documento Auxiliar do Conhecimento de Transporte Eletrônico\n📌 *DANFE* – Documento Auxiliar da Nota Fiscal Eletrônica\n📌 *CNH do condutor* – Documento de identificação e habilitação do motorista\n📌 *Declaração manuscrita do motorista* – Relato detalhado do ocorrido, assinado\n📌 *CRLV do veículo sinistrado* – Documento de registro e licenciamento\n📌 *Registro do tacógrafo* – Disco ou relatório digital com informações de jornada\n📌 *Preenchimento da Ata de Vistoria* – Documento essencial para formalização do atendimento\n\n⚠️ *Importante:*\n✅ Caso algum documento não esteja disponível, essa informação deve ser registrada nas observações da Ata de Vistoria.\n✅ A Ata de Vistoria deverá ser enviada em até 24 horas após o término do acionamento.\n\nA correta coleta e envio desses dados são essenciais para o andamento da regulação do sinistro. Contamos com a colaboração de todos!\n\nPara qualquer dúvida, estamos à disposição.`);
            await enviarArquivos(remoteJid, ['declaracao.pdf', 'ata_vistoria.pdf', 'ata_vistoria.docx']);
        }
        
        if (textoRecebido === '!declaracao') await enviarArquivos(remoteJid, ['declaracao.pdf']);
        if (textoRecebido === '!ata') await enviarArquivos(remoteJid, ['ata_vistoria.pdf', 'ata_vistoria.docx']);
        if (textoRecebido === '!cnpj') await enviarArquivos(remoteJid, ['cartao-cnpj-premium.pdf']);
        if (textoRecebido === '!inventario' || textoRecebido === '!salvados') await enviarArquivos(remoteJid, ['inventario.xlsm']);
        
        // Buscar nos logs
        if (textoRecebido.startsWith('!buscar ')) {
            const termo = messageText.substring(8).trim();
            
            if (!termo) {
                await client.sendText(remoteJid, '⚠️ *Uso correto:* !buscar [termo]\n\n*Exemplo:* !buscar João');
                return;
            }
            
            try {
                const logPath = path.join(__dirname, 'logs', 'commands.log');
                
                if (!fs.existsSync(logPath)) {
                    await client.sendText(remoteJid, '📭 *Nenhum log encontrado ainda.*');
                    return;
                }
                
                const logContent = fs.readFileSync(logPath, 'utf-8');
                const linhas = logContent.split('\n');
                const resultados = linhas.filter(linha => 
                    linha.toLowerCase().includes(termo.toLowerCase())
                ).slice(-10);
                
                if (resultados.length === 0) {
                    await client.sendText(remoteJid, `🔍 *Busca:* "${termo}"\n❌ *Nenhum resultado encontrado.*`);
                } else {
                    const resposta = 
                        `🔍 *Busca:* "${termo}"\n` +
                        `📊 *Resultados:* ${resultados.length} ${resultados.length === 10 ? '(últimos 10)' : ''}\n` +
                        `━━━━━━━━━━━━━━━━━━━━━\n` +
                        resultados.join('\n');
                    await client.sendText(remoteJid, resposta);
                }
            } catch (error) {
                console.error('Erro ao buscar logs:', error);
                await client.sendText(remoteJid, '❌ *Erro ao buscar nos logs.*');
            }
        }
        
    } catch (error) {
        console.error('❌ Erro ao processar mensagem:', error.message);
    }
}

// Enviar arquivos
async function enviarArquivos(remoteJid, arquivos) {
    setTimeout(async () => {
        try {
            for (let i = 0; i < arquivos.length; i++) {
                const filePath = path.join(__dirname, arquivos[i]);
                await client.sendMedia(remoteJid, filePath);
                if (i < arquivos.length - 1) {
                    await new Promise(resolve => setTimeout(resolve, 2000));
                }
            }
        } catch (erro) {
            console.error('❌ Erro ao enviar arquivo:', erro.message);
        }
    }, 3000);
}

// Tratamento de erros não capturados
process.on('unhandledRejection', (reason, promise) => {
    console.error('⚠️ Promessa rejeitada não tratada:', reason);
});

process.on('uncaughtException', (error) => {
    console.error('⚠️ Exceção não capturada:', error);
});

// ============================================================
//  INICIAR SERVIDOR E BOT
// ============================================================
const PORT = process.env.PORT || 3000;

app.listen(PORT, () => {
    console.log(`🌐 Servidor webhook rodando na porta ${PORT}`);
    console.log(`📡 Endpoint: http://localhost:${PORT}/webhook`);
    initialize();
});

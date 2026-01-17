const { Client, LocalAuth, MessageMedia } = require('whatsapp-web.js');
const qrcode = require('qrcode-terminal');
const path = require('path'); 
const fs = require('fs');
const os = require('os');
const pdf = require('pdf-extraction'); 

const { ANTI_FLOOD_TIME, NOME_GRUPO_AUDITORIA, VERSAO_BOT, comandosValidos } = require('./src/config');
const { logPainel, logComando } = require('./src/logger');
const { extrairDadosAvancado } = require('./src/pdfHandler');
const { enviar } = require('./src/utils');

const client = new Client({
    authStrategy: new LocalAuth(),
    puppeteer: {
        // Remova o executablePath para que o bot tente usar o navegador padrão do pacote
        args: [
            '--no-sandbox',
            '--disable-setuid-sandbox',
            '--disable-dev-shm-usage',
            '--disable-accelerated-2d-canvas',
            '--no-first-run',
            '--no-zygote',
            '--disable-gpu'
        ],
    }
});

const lastCommandUsage = {};  
let AGUARDANDO_PDF_AVISO = false;

// Helper: tenta recuperar nome legível do usuário
async function getUserDisplay(userId) {
    try {
        const contact = await client.getContactById(userId);
        return contact.pushname || contact.name || userId;
    } catch (e) {
        return userId;
    }
}

// ============================================================
//  INICIALIZAÇÃO (STARTUP)
// ============================================================
client.on('qr', (qr) => {
    console.log('\n   [ ! ] NECESSARIO ESCANEAR O QR CODE ABAIXO:\n');
    qrcode.generate(qr, { small: true });
});

client.on('ready', async () => {
    logPainel('CONECTADO', '[OK] CONECTADO. CARREGANDO MÓDULOS...');
    
    setTimeout(async () => {
        try {
            const chats = await client.getChats();
            const grupoAuditoria = chats.find(chat => chat.name === NOME_GRUPO_AUDITORIA);
            
            if (grupoAuditoria) {
                // Coleta dados técnicos do servidor
                const data = new Date();
                const dataFormatada = data.toLocaleDateString('pt-BR');
                const horaFormatada = data.toLocaleTimeString('pt-BR');
                const memUsada = (process.memoryUsage().rss / 1024 / 1024).toFixed(2);
                const plataforma = `${os.type()} ${os.release()} (${os.arch()})`;
                
                await grupoAuditoria.sendMessage(
                    `🤖 *SISTEMA INICIADO COM SUCESSO*\n` +
                    `━━━━━━━━━━━━━━━━━━━━━\n` +
                    `📅 *Data:* ${dataFormatada}\n` +
                    `⏰ *Hora:* ${horaFormatada}\n` +
                    `💻 *Sistema:* ${plataforma}\n` +
                    `💾 *Memória Inicial:* ${memUsada} MB\n` +
                    `📦 *Versão Bot:* ${VERSAO_BOT}\n` +
                    `📄 *Motor PDF:* PDF-Extraction (Ativo)\n` +
                    `━━━━━━━━━━━━━━━━━━━━━\n` +
                    `✅ *Status:* PRONTO PARA OPERAÇÃO`
                );
            }
        } catch (err) {
            logPainel('INICIALIZAÇÃO', 'Falha ao enviar mensagem de inicialização.');
        }
    }, 5000);
});

// ============================================================
//  LÓGICA DE MENSAGENS
// ============================================================
client.on('message', async (message) => {
    try {
        // Tenta marcar como lida, mas não derruba o bot se falhar
        await client.sendSeen(message.from);
    } catch (e) {
        console.log("Aviso: Falha ao marcar como lida (markedUnread), mas o processo continua.");
    }
    
    const chat = await message.getChat();
    
    // --- LEITURA DO PDF (LÓGICA) ---
    if (chat.name === NOME_GRUPO_AUDITORIA && AGUARDANDO_PDF_AVISO) {
        if (message.hasMedia) {
            const media = await message.downloadMedia();
            
            if (media.mimetype === 'application/pdf') {
                await message.reply('⚙️ *Processando arquivo...* Extraindo dados brutos.');
                
                try {
                    const buffer = Buffer.from(media.data, 'base64');
                    const data = await pdf(buffer);
                    const dados = extrairDadosAvancado(data.text);
                    
                    const resposta = 
                        `✅ *RESUMO DO AVISO GERADO*\n` +
                        `━━━━━━━━━━━━━━━━━━━━━\n` +
                        `• Nº sinistro: ${dados.sinistro}\n` +
                        `• Seguradora: ${dados.seguradora}\n` +
                        `• Segurado: ${dados.segurado}\n` +
                        `• Motorista: ${dados.motorista}\n` +
                        `• Telefone: ${dados.telMotorista}\n` +
                        `• Placas: ${dados.placas}\n` +
                        `• Remetente: ${dados.remetente}\n` +
                        `• Origem: ${dados.origem}\n` +
                        `• Destinatário: ${dados.destinatario}\n` +
                        `• Destino: ${dados.destino}\n` +
                        `• Local do evento: ${dados.localEvento}\n` +
                        `• Cidade do evento: ${dados.cidadeEvento}\n` +
                        `• Local da vistoria: ${dados.localVistoria}\n` +
                        `• Cidade da vistoria: ${dados.cidadeVistoria}\n` +
                        `• Natureza: ${dados.natureza}\n` +
                        `• Manifesto: ${dados.manifesto}\n` +
                        `• Fatura/N.Fiscal: ${dados.nf}\n` +
                        `• Mercadoria: ${dados.mercadoria}\n` +
                        `• Valor declarado: ${dados.valor}\n` +
                        `• Observação: ${dados.obs}`;

                    await chat.sendMessage(resposta);
                    try {
                        const senderId = message.author || message.from;
                        const senderName = await getUserDisplay(senderId);
                        logComando('!aviso (PDF)', chat.name, senderName, true);
                    } catch (e) {}
                    AGUARDANDO_PDF_AVISO = false;
                    return;

                } catch (error) {
                    console.error(error);
                    await chat.sendMessage(`❌ *FALHA NA EXTRAÇÃO*\nO arquivo não possui texto selecionável ou está protegido.`);
                    try {
                        const senderId = message.author || message.from;
                        const senderName = await getUserDisplay(senderId);
                        logComando('!aviso (PDF)', chat.name, senderName, true, 'Falha extração');
                    } catch (e) {}
                    AGUARDANDO_PDF_AVISO = false;
                }
            } else {
                await chat.sendMessage('⚠️ *Formato Inválido.* Por favor, envie um arquivo PDF.');
                AGUARDANDO_PDF_AVISO = false;
            }
        }
        return;
    }

    if (!chat.isGroup) return;
    let textoRecebido = message.body.toLowerCase().trim();
    
    // Ativa a espera do PDF
    if (textoRecebido === '!aviso' && chat.name === NOME_GRUPO_AUDITORIA) {
        AGUARDANDO_PDF_AVISO = true;
        await chat.sendMessage('📄 *IMPORTAÇÃO DE AVISO*\n\nO sistema está aguardando o arquivo.\n👉 *Envie o PDF do Aviso agora.*');
        try {
            const userId = message.author || message.from;
            const userDisplay = await getUserDisplay(userId);
            logComando('!aviso', chat.name, userDisplay, true);
        } catch (e) {}
        return;
    }

    // comandosValidos importados de ./src/config.js

    if (comandosValidos.includes(textoRecebido)) {
        const userId = message.author || message.from;
        const userDisplay = await getUserDisplay(userId);
        const now = Date.now();

        if (lastCommandUsage[userId] && (now - lastCommandUsage[userId] < ANTI_FLOOD_TIME)) {
            // bloqueado por anti-flood
            try { await message.react('⛔'); } catch (e) {}
            logComando(textoRecebido, chat.name, userDisplay, false, 'Anti-flood');
            return;
        }

        lastCommandUsage[userId] = now;
        try { await message.react('✅'); } catch (e) {}
        logComando(textoRecebido, chat.name, userDisplay, true);
    }

    // --- COMANDOS DETALHADOS ---

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
            `🔸 *!status*  → Exibe painel técnico de saúde do servidor.\n\n` +
            `📄 *IMPORTADOR DE AVISO (PDF)*\n` +
            `_Funcionalidade exclusiva do grupo ${NOME_GRUPO_AUDITORIA}_\n` +
            `1️⃣ Digite *!aviso*\n` +
            `2️⃣ O bot pedirá o arquivo.\n` +
            `3️⃣ Arraste o PDF do aviso para a conversa.\n` +
            `4️⃣ O bot lerá e extrairá os dados formatados.`;
            
        await chat.sendMessage(textoMenu);
    }

    if (textoRecebido === '!status') {
        // Cálculos de tempo precisos
        const uptime = process.uptime();
        const dias = Math.floor(uptime / 86400);
        const horas = Math.floor((uptime % 86400) / 3600);
        const minutos = Math.floor((uptime % 3600) / 60);
        const segundos = Math.floor(uptime % 60);

        // Memória
        const memUsada = (process.memoryUsage().rss / 1024 / 1024).toFixed(2);
        const memTotal = (os.totalmem() / 1024 / 1024 / 1024).toFixed(2);
        
        // Latência
        const latencia = Date.now() - (message.timestamp * 1000);
        const ping = latencia > 0 ? latencia : '5';

        const painelStatus = 
            `🖥️ *DASHBOARD TÉCNICO V4.5*\n` +
            `━━━━━━━━━━━━━━━━━━━━━\n` +
            `🟢 *Status:* ONLINE\n` +
            `⏱️ *Uptime:* ${dias}d ${horas}h ${minutos}m ${segundos}s\n` +
            `📡 *Latência:* ${ping}ms\n` +
            `💾 *Uso de RAM:* ${memUsada} MB / ${memTotal} GB\n` +
            `💻 *Host:* ${os.hostname()} (${os.platform()})\n` +
            `📅 *Server Time:* ${new Date().toLocaleString('pt-BR')}`;
            
        await chat.sendMessage(painelStatus);
    }

    // Comandos de envio de arquivo (Mantidos iguais)
    if (textoRecebido === '!inicio') {
        await chat.sendMessage(`📢 *ORIENTAÇÕES PARA ATENDIMENTO DE SINISTRO DE CARGA* 📢\n\nPrezados,\n\nPara garantir a correta análise e tramitação do sinistro, é fundamental a coleta e conferência dos seguintes documentos no local:\n\n📌 *DAMDFE* – Documento Auxiliar do Manifesto Eletrônico de Documentos Fiscais\n📌 *DACTE* – Documento Auxiliar do Conhecimento de Transporte Eletrônico\n📌 *DANFE* – Documento Auxiliar da Nota Fiscal Eletrônica\n📌 *CNH do condutor* – Documento de identificação e habilitação do motorista\n📌 *Declaração manuscrita do motorista* – Relato detalhado do ocorrido, assinado\n📌 *CRLV do veículo sinistrado* – Documento de registro e licenciamento\n📌 *Registro do tacógrafo* – Disco ou relatório digital com informações de jornada\n📌 *Preenchimento da Ata de Vistoria* – Documento essencial para formalização do atendimento\n\n⚠️ *Importante:*\n✅ Caso algum documento não esteja disponível, essa informação deve ser registrada nas observações da Ata de Vistoria.\n✅ A Ata de Vistoria deverá ser enviada em até 24 horas após o término do acionamento.\n\nA correta coleta e envio desses dados são essenciais para o andamento da regulação do sinistro. Contamos com a colaboração de todos!\n\nPara qualquer dúvida, estamos à disposição.`);
        enviar(chat, ['declaracao.pdf', 'ata_vistoria.pdf', 'ata_vistoria.docx']);
    }
    if (textoRecebido === '!recibo') {
        await chat.sendMessage(`📌 *INSTRUÇÕES PARA PREENCHIMENTO DO RECIBO*\n\n✅ *Preenchimento Completo:* Todos os campos do recibo devem ser preenchidos de forma completa e legível.\n🔍 *Dados Corretos:* Certifique-se de que os valores e dados bancários estejam corretos.\n✍️ *Assinatura Obrigatória:* O recibo deve estar assinado.\n🏦 *Autorização de Depósito:* Informe os dados da conta corretamente.\n🚨 *Liberação do Pagamento:* Somente após apresentação do recibo correto.\n\n📞 Qualquer dúvida, estamos à disposição!`);
        enviar(chat, ['recibo.pdf', 'recibo.docx']);
    }
    if (textoRecebido === '!final') {
        await chat.sendMessage(`Prezado Vistoriador,\n\nAgradecemos sua parceria em mais um atendimento. 🤝\n\nCom o atendimento finalizado, solicitamos a apresentação do *Relatório de Despesas e Honorários* juntamente com os comprovantes. Prazo máximo de *48 horas*.\n\n📧 Enviar para:\npremium@premiumreguladora.com.br\ne financeiro@premiumreguladora.com.br\n\n📌 Assunto padrão:\n*“RELATÓRIO DE DESPESAS E HONORÁRIOS VISTORIADOR – PROCESSO PREMIUM Nº 000.000/24 – NOME DO SEGURADO”*\n\n📎 *É obrigatório anexar todos os comprovantes das despesas.*\n\n⚠️ *ATENÇÃO:* Ausência de comprovantes = NÃO reembolso.\n\nPagamento em até 15 dias úteis após conferência.\n\nFavor confirmar o recebimento.`);
        enviar(chat, ['relatorio_despesas.xlsx']);
    }
    if (textoRecebido === '!atencao') await chat.sendMessage(`⚠️ *ATENÇÃO* ⚠️\n\nInformamos que, até a presente data, não foi apresentado o Relatório de Despesas, nem os respectivos comprovantes.\n\nSolicitamos o envio da documentação no prazo máximo de *24 horas*, contadas a partir do recebimento desta mensagem.\n\n⚠️ *Caso os documentos não sejam apresentados dentro do prazo, o reembolso das despesas não será realizado.*\n\nFicamos à disposição para esclarecimentos.`);
    if (textoRecebido === '!inventario' || textoRecebido === '!salvados') enviar(chat, ['inventario.xlsm']);
    if (textoRecebido === '!declaracao') enviar(chat, ['declaracao.pdf']);
    if (textoRecebido === '!ata') enviar(chat, ['ata_vistoria.pdf', 'ata_vistoria.docx']);
    if (textoRecebido === '!cnpj') enviar(chat, ['cartao-cnpj-premium.pdf']);

});



client.initialize();
const BaileysClient = require('./src/baileysClient');
const path = require('path'); 
const fs = require('fs');
const os = require('os');
const pdfParse = require('pdf-parse'); 

const { ANTI_FLOOD_TIME, NOME_GRUPO_AUDITORIA, VERSAO_BOT, comandosValidos } = require('./src/config');
const { logPainel, logComando } = require('./src/logger');
const { extrairDadosAvancado } = require('./src/pdfHandler');

const client = new BaileysClient();

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

// Processamento simplificado e rápido de PDF
async function processarPDF(msg) {
    console.log('📥 [PDF] Iniciando processamento...');
    
    try {
        // Download direto sem timeout complexo
        const buffer = await client.downloadMedia(msg);
        
        if (!buffer || buffer.length === 0) {
            throw new Error('DOWNLOAD_VAZIO');
        }
        
        console.log(`✅ [PDF] Download: ${buffer.length} bytes`);
        
        // Parse direto
        const pdfData = await pdfParse(buffer);
        
        if (!pdfData || !pdfData.text) {
            throw new Error('PDF_SEM_TEXTO');
        }
        
        console.log(`✅ [PDF] Texto extraído: ${pdfData.text.length} chars`);
        return pdfData.text;
        
    } catch (err) {
        console.error(`❌ [PDF] Erro: ${err.message}`);
        throw err;
    }
}

// Função auxiliar para enviar mensagem para um JID
async function sendMessage(jid, text) {
    await client.sendMessage(jid, text);
}

// Função auxiliar para enviar arquivos
async function sendFiles(jid, files) {
    for (const file of files) {
        const filePath = path.join(__dirname, file);
        if (fs.existsSync(filePath)) {
            try {
                console.log(`📎 Enviando arquivo: ${file}`);
                await client.sendDocument(jid, filePath);
                await new Promise(resolve => setTimeout(resolve, 2000)); // Delay entre envios
            } catch (error) {
                console.error(`❌ Erro ao enviar ${file}:`, error.message);
            }
        } else {
            console.log(`⚠️ Arquivo não encontrado: ${filePath}`);
        }
    }
}

// ============================================================
//  INICIALIZAÇÃO (READY)
// ============================================================
client.onReady(async () => {
    logPainel('CONECTADO', '[OK] CONECTADO. CARREGANDO MÓDULOS...');
    
    setTimeout(async () => {
        try {
            const chats = await client.getChats();
            const grupoAuditoria = chats.find(chat => chat.name === NOME_GRUPO_AUDITORIA);
            
            if (grupoAuditoria) {
                await new Promise(resolve => setTimeout(resolve, 2000));
                
                const data = new Date();
                const dataFormatada = data.toLocaleDateString('pt-BR');
                const horaFormatada = data.toLocaleTimeString('pt-BR');
                const memUsada = (process.memoryUsage().rss / 1024 / 1024).toFixed(2);
                const plataforma = `${os.type()} ${os.release()} (${os.arch()})`;
                
                await client.sendMessage(
                    grupoAuditoria.id._serialized,
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
            console.error('⚠️ Falha ao enviar mensagem de inicialização:', err.message);
        }
    }, 10000);
});

// ============================================================
//  LÓGICA DE MENSAGENS
// ============================================================
client.onMessage(async (msg) => {
    try {
        // Extrair informações da mensagem Baileys
        const messageInfo = msg.message?.conversation || 
                          msg.message?.extendedTextMessage?.text || '';
        
        if (!messageInfo) return;
        
        const fromJid = msg.key.remoteJid;
        const isGroup = fromJid.endsWith('@g.us');
        
        if (!isGroup) return; // Ignora mensagens privadas
        
        // Buscar informações do grupo
        let grupoNome = '';
        try {
            const chats = await client.getChats();
            const chat = chats.find(c => c.id._serialized === fromJid);
            grupoNome = chat ? chat.name : '';
        } catch (e) {
            console.error('Erro ao buscar nome do grupo:', e);
        }

        // --- LEITURA DO PDF (LÓGICA) ---
        if (grupoNome === NOME_GRUPO_AUDITORIA && AGUARDANDO_PDF_AVISO) {
            console.log('🔍 [DETECTOR] AGUARDANDO_PDF_AVISO = true, verificando mensagem...');
            console.log('📨 [DETECTOR] Tipo de mensagem:', Object.keys(msg.message || {}));
            
            const isPDF = msg.message?.documentMessage && 
                         (msg.message?.documentMessage?.mimetype === 'application/pdf' || 
                          msg.message?.documentMessage?.fileName?.toLowerCase().endsWith('.pdf'));
            
            if (!isPDF) {
                console.log('⚠️ [DETECTOR] Não é PDF. Ignorando...');
                return;
            }
            
            console.log('📄 [PDF] Arquivo PDF detectado! Iniciando processamento...');
            
            // Resetar flag IMEDIATAMENTE para evitar duplicatas
            AGUARDANDO_PDF_AVISO = false;
            
            // Enviar mensagem de processamento
            try {
                await sendMessage(fromJid, '⚙️ *Processando arquivo PDF...*\n\nIsso pode levar alguns segundos. Aguarde...');
            } catch (e) {
                console.error('❌ Erro ao enviar mensagem de processamento:', e.message);
            }
            
            // Processar PDF de forma otimizada
            (async () => {
                try {
                    console.log('🚀 [PDF] Processando arquivo...');
                    
                    // Processar PDF (download + parse)
                    const textoExtraido = await processarPDF(msg);
                    
                    // Extrair dados de forma síncrona
                    console.log('📊 [PDF] Extraindo dados...');
                    const dados = extrairDadosAvancado(textoExtraido);
                    console.log('✅ [PDF] Dados extraídos');
                    
                    // Construir resposta
                    console.log('\n📝 [RESPONSE] Construindo resposta...');
                    const resposta = 
                        `✅ *RESUMO DO AVISO EXTRAÍDO*\n` +
                        `━━━━━━━━━━━━━━━━━━━━━━━━━\n` +
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
                    
                    // Enviar resposta
                    console.log('📤 [RESPONSE] Enviando resposta para o grupo...');
                    await sendMessage(fromJid, resposta);
                    console.log('✅ [PDF] Resposta enviada!\n');
                    
                    // Log do comando
                    try {
                        const senderId = msg.key.participant || msg.key.remoteJid;
                        const senderName = await getUserDisplay(senderId);
                        logComando('!aviso (PDF)', grupoNome, senderName, true);
                    } catch (e) {
                        console.warn('⚠️ Erro ao logar comando:', e.message);
                    }
                    
                } catch (error) {
                    console.error('❌ [PDF] Erro:', error.message);
                    
                    // Mensagem de erro simplificada
                    let msgErro = '❌ *ERRO AO PROCESSAR PDF*\n\n';
                    
                    if (error.message.includes('DOWNLOAD_VAZIO')) {
                        msgErro += 'Não foi possível baixar o arquivo. Tente novamente.';
                    } else if (error.message.includes('PDF_SEM_TEXTO')) {
                        msgErro += 'PDF sem texto legível. Pode estar protegido ou ser apenas imagens.';
                    } else {
                        msgErro += 'Erro no processamento. Verifique se o arquivo está correto.';
                    }
                    
                    try {
                        await sendMessage(fromJid, msgErro);
                    } catch (e) {
                        console.error('❌ Erro ao enviar erro:', e.message);
                    }
                    
                    // Log de falha
                    try {
                        const senderId = msg.key.participant || msg.key.remoteJid;
                        const senderName = await getUserDisplay(senderId);
                        logComando('!aviso (PDF)', grupoNome, senderName, false, error.message);
                    } catch (e) {}
                }
            })();
            
            return;
        }

        let textoRecebido = messageInfo.toLowerCase().trim();
        
        // Ativa a espera do PDF
        if (textoRecebido === '!aviso' && grupoNome === NOME_GRUPO_AUDITORIA) {
            AGUARDANDO_PDF_AVISO = true;
            await sendMessage(fromJid, '📄 *IMPORTAÇÃO DE AVISO*\n\nO sistema está aguardando o arquivo.\n👉 *Envie o PDF do Aviso agora.*');
            
            try {
                const userId = msg.key.participant || msg.key.remoteJid;
                const userDisplay = await getUserDisplay(userId);
                logComando('!aviso', grupoNome, userDisplay, true);
            } catch (e) {}
            return;
        }

        if (comandosValidos.includes(textoRecebido)) {
            const userId = msg.key.participant || msg.key.remoteJid;
            const userDisplay = await getUserDisplay(userId);
            const now = Date.now();

            if (lastCommandUsage[userId] && (now - lastCommandUsage[userId] < ANTI_FLOOD_TIME)) {
                logComando(textoRecebido, grupoNome, userDisplay, false, 'Anti-flood');
                return;
            }

            lastCommandUsage[userId] = now;
            logComando(textoRecebido, grupoNome, userDisplay, true);
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
                `🔸 *!status*  → Exibe painel técnico de saúde do servidor.\n` +
                `🔸 *!buscar* [termo]  → Busca nos logs por comandos/usuários.\n\n` +
                `📄 *IMPORTADOR DE AVISO (PDF)*\n` +
                `_Funcionalidade exclusiva do grupo ${NOME_GRUPO_AUDITORIA}_\n` +
                `1️⃣ Digite *!aviso*\n` +
                `2️⃣ O bot pedirá o arquivo.\n` +
                `3️⃣ Arraste o PDF do aviso para a conversa.\n` +
                `4️⃣ O bot lerá e extrairá os dados formatados.`;
                
            await sendMessage(fromJid, textoMenu);
        }

        // Comando de busca nos logs
        if (textoRecebido.startsWith('!buscar ')) {
            const termo = messageInfo.substring(8).trim();
            
            if (!termo) {
                await sendMessage(fromJid, '⚠️ *Uso correto:* !buscar [termo]\n\n*Exemplo:* !buscar João');
                return;
            }

            try {
                const logPath = path.join(__dirname, 'logs', 'commands.log');
                
                if (!fs.existsSync(logPath)) {
                    await sendMessage(fromJid, '📭 *Nenhum log encontrado ainda.*');
                    return;
                }

                const logContent = fs.readFileSync(logPath, 'utf-8');
                const linhas = logContent.split('\n');
                const resultados = linhas.filter(linha => 
                    linha.toLowerCase().includes(termo.toLowerCase())
                ).slice(-10);

                if (resultados.length === 0) {
                    await sendMessage(fromJid, `🔍 *Busca:* "${termo}"\n❌ *Nenhum resultado encontrado.*`);
                } else {
                    const resposta = 
                        `🔍 *Busca:* "${termo}"\n` +
                        `📊 *Resultados:* ${resultados.length} ${resultados.length === 10 ? '(últimos 10)' : ''}\n` +
                        `━━━━━━━━━━━━━━━━━━━━━\n` +
                        resultados.join('\n');
                    await sendMessage(fromJid, resposta);
                }
            } catch (error) {
                console.error('Erro ao buscar logs:', error);
                await sendMessage(fromJid, '❌ *Erro ao buscar nos logs.*');
            }
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
                `🖥️ *DASHBOARD TÉCNICO V4.5*\n` +
                `━━━━━━━━━━━━━━━━━━━━━\n` +
                `🟢 *Status:* ONLINE\n` +
                `⏱️ *Uptime:* ${dias}d ${horas}h ${minutos}m ${segundos}s\n` +
                `💾 *Uso de RAM:* ${memUsada} MB / ${memTotal} GB\n` +
                `💻 *Host:* ${os.hostname()} (${os.platform()})\n` +
                `📅 *Server Time:* ${new Date().toLocaleString('pt-BR')}`;
                
            await sendMessage(fromJid, painelStatus);
        }

        // Comandos de envio de arquivo
        if (textoRecebido === '!inicio') {
            await sendMessage(fromJid, `📢 *ORIENTAÇÕES PARA ATENDIMENTO DE SINISTRO DE CARGA* 📢\n\nPrezados,\n\nPara garantir a correta análise e tramitação do sinistro, é fundamental a coleta e conferência dos seguintes documentos no local:\n\n📌 *DAMDFE* – Documento Auxiliar do Manifesto Eletrônico de Documentos Fiscais\n📌 *DACTE* – Documento Auxiliar do Conhecimento de Transporte Eletrônico\n📌 *DANFE* – Documento Auxiliar da Nota Fiscal Eletrônica\n📌 *CNH do condutor* – Documento de identificação e habilitação do motorista\n📌 *Declaração manuscrita do motorista* – Relato detalhado do ocorrido, assinado\n📌 *CRLV do veículo sinistrado* – Documento de registro e licenciamento\n📌 *Registro do tacógrafo* – Disco ou relatório digital com informações de jornada\n📌 *Preenchimento da Ata de Vistoria* – Documento essencial para formalização do atendimento\n\n⚠️ *Importante:*\n✅ Caso algum documento não esteja disponível, essa informação deve ser registrada nas observações da Ata de Vistoria.\n✅ A Ata de Vistoria deverá ser enviada em até 24 horas após o término do acionamento.\n\nA correta coleta e envio desses dados são essenciais para o andamento da regulação do sinistro. Contamos com a colaboração de todos!\n\nPara qualquer dúvida, estamos à disposição.`);
            await sendFiles(fromJid, ['declaracao.pdf', 'ata_vistoria.pdf', 'ata_vistoria.docx']);
        }
        
        if (textoRecebido === '!recibo') {
            await sendMessage(fromJid, `📌 *INSTRUÇÕES PARA PREENCHIMENTO DO RECIBO*\n\n✅ *Preenchimento Completo:* Todos os campos do recibo devem ser preenchidos de forma completa e legível.\n🔍 *Dados Corretos:* Certifique-se de que os valores e dados bancários estejam corretos.\n✍️ *Assinatura Obrigatória:* O recibo deve estar assinado.\n🏦 *Autorização de Depósito:* Informe os dados da conta corretamente.\n🚨 *Liberação do Pagamento:* Somente após apresentação do recibo correto.\n\n📞 Qualquer dúvida, estamos à disposição!`);
            await sendFiles(fromJid, ['recibo.pdf', 'recibo.docx']);
        }
        
        if (textoRecebido === '!final') {
            await sendMessage(fromJid, `Prezado Vistoriador,\n\nAgradecemos sua parceria em mais um atendimento. 🤝\n\nCom o atendimento finalizado, solicitamos a apresentação do *Relatório de Despesas e Honorários* juntamente com os comprovantes. Prazo máximo de *48 horas*.\n\n📧 Enviar para:\npremium@premiumreguladora.com.br\ne financeiro@premiumreguladora.com.br\n\n📌 Assunto padrão:\n*"RELATÓRIO DE DESPESAS E HONORÁRIOS VISTORIADOR – PROCESSO PREMIUM Nº 000.000/24 – NOME DO SEGURADO"*\n\n📎 *É obrigatório anexar todos os comprovantes das despesas.*\n\n⚠️ *ATENÇÃO:* Ausência de comprovantes = NÃO reembolso.\n\nPagamento em até 15 dias úteis após conferência.\n\nFavor confirmar o recebimento.`);
            await sendFiles(fromJid, ['relatorio_despesas.xlsx']);
        }
        
        if (textoRecebido === '!atencao') {
            await sendMessage(fromJid, `⚠️ *ATENÇÃO* ⚠️\n\nInformamos que, até a presente data, não foi apresentado o Relatório de Despesas, nem os respectivos comprovantes.\n\nSolicitamos o envio da documentação no prazo máximo de *24 horas*, contadas a partir do recebimento desta mensagem.\n\n⚠️ *Caso os documentos não sejam apresentados dentro do prazo, o reembolso das despesas não será realizado.*\n\nFicamos à disposição para esclarecimentos.`);
        }
        
        if (textoRecebido === '!inventario' || textoRecebido === '!salvados') {
            await sendFiles(fromJid, ['inventario.xlsm']);
        }
        
        if (textoRecebido === '!declaracao') {
            await sendFiles(fromJid, ['declaracao.pdf']);
        }
        
        if (textoRecebido === '!ata') {
            await sendFiles(fromJid, ['ata_vistoria.pdf', 'ata_vistoria.docx']);
        }
        
        if (textoRecebido === '!cnpj') {
            await sendFiles(fromJid, ['cartao-cnpj-premium.pdf']);
        }

    } catch (error) {
        console.error('❌ Erro ao processar mensagem:', error.message);
    }
});

// Tratamento de erros não capturados
process.on('unhandledRejection', (reason, promise) => {
    console.error('⚠️ Promessa rejeitada não tratada:', reason);
});

process.on('uncaughtException', (error) => {
    console.error('⚠️ Exceção não capturada:', error);
});

// Inicializar cliente
client.initialize();

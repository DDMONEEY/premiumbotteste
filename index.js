const BaileysClient = require('./src/baileysClient');
const path = require('path'); 
const fs = require('fs');
const os = require('os');
const pdfjs = require('pdfjs-dist/legacy/build/pdf');
const Tesseract = require('tesseract.js');
const sharp = require('sharp');
const mammoth = require('mammoth');
const XLSX = require('xlsx');
const csv = require('csv-parser');
const { fromPath } = require('pdf2pic'); 

const { ANTI_FLOOD_TIME, NOME_GRUPO_AUDITORIA, VERSAO_BOT, comandosValidos } = require('./src/config');
const { logPainel, logComando } = require('./src/logger');
const { extrairDadosAvancado, extrairCamposLista } = require('./src/pdfHandler');

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

// Processar imagem com OCR
async function processarImagem(buffer) {
    console.log('🖼️ [IMG] Processando imagem com OCR...');
    
    try {
        // Otimizar imagem para melhor OCR
        const imgBuffer = await sharp(buffer)
            .greyscale()
            .normalise()
            .sharpen()
            .toBuffer();
        
        // OCR com Tesseract
        const { data: { text } } = await Tesseract.recognize(imgBuffer, 'por', {
            logger: () => {} // Desabilitar logs do Tesseract
        });
        
        if (!text || text.length < 50) {
            throw new Error('IMAGEM_SEM_TEXTO');
        }
        
        console.log(`✅ [IMG] OCR concluído: ${text.length} chars`);
        return text;
        
    } catch (err) {
        console.error(`❌ [IMG] Erro: ${err.message}`);
        throw err;
    }
}

// Processar PDF com PDF.js e OCR como fallback
async function processarPDF(buffer) {
    console.log('📄 [PDF] Processando PDF...');
    
    try {
        if (!buffer || buffer.length === 0) {
            throw new Error('Buffer PDF vazio');
        }
        
        console.log(`📄 [PDF] Tamanho do buffer: ${buffer.length} bytes`);
        
        // Método 1: Tentar com PDF.js (para PDFs com texto extraível)
        try {
            console.log('🔄 [PDF] Método 1: Usando PDF.js para extração de texto...');
            
            // Carregar o PDF - converter Buffer para Uint8Array
            const uint8Array = new Uint8Array(buffer);
            const pdf = await pdfjs.getDocument({ 
                data: uint8Array
            }).promise;
            let textoCompleto = '';
            
            console.log(`📄 [PDF] Total de páginas: ${pdf.numPages}`);
            
            // Iterar por cada página
            for (let pageNum = 1; pageNum <= pdf.numPages; pageNum++) {
                try {
                    const page = await pdf.getPage(pageNum);
                    const textContent = await page.getTextContent({ normalizeWhitespace: true });
                    const pageText = textContent.items.map(item => item.str).join(' ');
                    
                    if (pageText && pageText.trim().length > 0) {
                        textoCompleto += `\n--- Página ${pageNum} ---\n${pageText}`;
                        console.log(`✅ [PDF] Página ${pageNum}: ${pageText.length} chars extraídos`);
                    }
                } catch (pageErr) {
                    console.error(`⚠️ [PDF] Erro ao processar página ${pageNum}:`, pageErr.message);
                }
            }
            
            if (textoCompleto.trim().length > 50) {
                console.log(`✅ [PDF] Texto extraído com PDF.js: ${textoCompleto.length} chars`);
                console.log(`📄 [PDF] Primeiros 300 chars: ${textoCompleto.substring(0, 300)}`);
                return textoCompleto;
            } else {
                console.log(`⚠️ [PDF] Texto insuficiente com PDF.js (${textoCompleto.length} chars)`);
                throw new Error('PDF_TEXTO_INSUFICIENTE_METODO1');
            }
        } catch (err1) {
            console.log(`⚠️ [PDF] Método 1 (PDF.js) falhou: ${err1.message}`);
            
            // Método 2: Converter PDF para imagens e aplicar OCR
            try {
                console.log('🔄 [PDF] Tentando método 2: PDF → Imagem → OCR...');
                
                // Salvar buffer temporariamente
                const tempPdfPath = path.join(os.tmpdir(), `temp_${Date.now()}.pdf`);
                fs.writeFileSync(tempPdfPath, buffer);
                
                try {
                    console.log(`📝 [PDF] PDF salvo temporariamente em: ${tempPdfPath}`);
                    
                    // Converter PDF para imagens com pdf2pic (bulk) e aplicar OCR
                    const options = {
                        density: 220,
                        savename: `page_${Date.now()}`,
                        savedir: os.tmpdir(),
                        format: 'png',
                        width: 1920,
                        height: 1920
                    };
                    
                    console.log('🔄 [PDF] Convertendo PDF para imagens (bulk)...');
                    const converter = fromPath(tempPdfPath, options);
                    const pages = await converter.bulk(-1, true); // -1 = todas as páginas
                    
                    if (!Array.isArray(pages) || pages.length === 0) {
                        throw new Error('PDF2PIC_SEM_PAGINAS');
                    }
                    
                    console.log(`✅ [PDF] PDF convertido para ${pages.length} página(s)`);
                    
                    // Aplicar OCR em cada página
                    let textoCompleto = '';
                    
                    for (let i = 0; i < pages.length; i++) {
                        const page = pages[i];
                        const pagePath = page?.path || page?.name || page;
                        console.log(`🔄 [PDF] Processando página ${i + 1}/${pages.length}...`);
                        
                        try {
                            if (!pagePath || !fs.existsSync(pagePath)) {
                                throw new Error('CAMINHO_IMAGEM_INEXISTENTE');
                            }
                            
                            // Ler arquivo de imagem
                            const imgBuffer = fs.readFileSync(pagePath);
                            
                            // Otimizar imagem para OCR
                            const imgOtimizada = await sharp(imgBuffer)
                                .greyscale()
                                .normalise()
                                .sharpen()
                                .toBuffer();
                            
                            // OCR
                            const { data: { text } } = await Tesseract.recognize(imgOtimizada, 'por', {
                                logger: () => {}
                            });
                            
                            if (text && text.trim().length > 0) {
                                textoCompleto += `\n--- Página ${i + 1} ---\n${text}`;
                                console.log(`✅ [PDF] Página ${i + 1}: ${text.length} chars extraídos`);
                            }
                            
                            // Limpar arquivo temporário
                            try {
                                fs.unlinkSync(pagePath);
                            } catch (e) {}
                        } catch (pageErr) {
                            console.error(`⚠️ [PDF] Erro ao processar página ${i + 1}:`, pageErr.message);
                        }
                    }
                    
                    // Limpar arquivo PDF temporário
                    try {
                        fs.unlinkSync(tempPdfPath);
                    } catch (e) {}
                    
                    if (textoCompleto.trim().length > 50) {
                        console.log(`✅ [PDF] Texto extraído com OCR: ${textoCompleto.length} chars`);
                        return textoCompleto;
                    } else {
                        throw new Error('PDF_TEXTO_INSUFICIENTE_OCR');
                    }
                } catch (err2) {
                    // Limpar arquivo PDF temporário
                    try {
                        fs.unlinkSync(tempPdfPath);
                    } catch (e) {}
                    
                    throw err2;
                }
            } catch (err3) {
                console.log(`⚠️ [PDF] Método 2 (OCR) falhou: ${err3.message}`);
                console.error('❌ [PDF] Não foi possível extrair texto do PDF com nenhum método');
                throw new Error('PDF_SEM_TEXTO');
            }
        }
        
    } catch (err) {
        console.error(`❌ [PDF] Erro completo:`, err.message);
        throw err;
    }
}

// Processar documento Word
async function processarWord(buffer) {
    console.log('📄 [WORD] Processando documento Word...');
    
    try {
        if (!buffer || buffer.length === 0) {
            throw new Error('Buffer Word vazio');
        }
        
        const result = await mammoth.extractRawText({ arrayBuffer: buffer.buffer });
        
        if (result && result.value && result.value.trim().length > 0) {
            console.log(`✅ [WORD] Texto extraído com sucesso: ${result.value.length} chars`);
            return result.value;
        } else {
            throw new Error('WORD_SEM_TEXTO');
        }
    } catch (err) {
        console.error(`❌ [WORD] Erro: ${err.message}`);
        throw err;
    }
}

// Processar documento Excel
async function processarExcel(buffer) {
    console.log('📊 [EXCEL] Processando documento Excel...');
    
    try {
        if (!buffer || buffer.length === 0) {
            throw new Error('Buffer Excel vazio');
        }
        
        const workbook = XLSX.read(buffer, { type: 'buffer' });
        let textoExtraido = '';
        
        // Ler todas as abas
        for (const sheetName of workbook.SheetNames) {
            const sheet = workbook.Sheets[sheetName];
            textoExtraido += `--- Aba: ${sheetName} ---\n`;
            
            const rows = XLSX.utils.sheet_to_json(sheet, { header: 1 });
            rows.forEach(row => {
                if (Array.isArray(row)) {
                    textoExtraido += row.join(' | ') + '\n';
                }
            });
            textoExtraido += '\n';
        }
        
        if (textoExtraido.trim().length > 0) {
            console.log(`✅ [EXCEL] Texto extraído com sucesso: ${textoExtraido.length} chars`);
            return textoExtraido;
        } else {
            throw new Error('EXCEL_SEM_TEXTO');
        }
    } catch (err) {
        console.error(`❌ [EXCEL] Erro: ${err.message}`);
        throw err;
    }
}

// Processar arquivo CSV
async function processarCSV(buffer) {
    console.log('📋 [CSV] Processando arquivo CSV...');
    
    try {
        if (!buffer || buffer.length === 0) {
            throw new Error('Buffer CSV vazio');
        }
        
        const texto = buffer.toString('utf-8');
        
        if (texto.trim().length > 0) {
            console.log(`✅ [CSV] Texto extraído com sucesso: ${texto.length} chars`);
            return texto;
        } else {
            throw new Error('CSV_SEM_TEXTO');
        }
    } catch (err) {
        console.error(`❌ [CSV] Erro: ${err.message}`);
        throw err;
    }
}

async function processarArquivo(msg) {
    console.log('📥 [ARQUIVO] Iniciando download...');
    console.log('📥 [ARQUIVO] Estrutura de msg.message:', Object.keys(msg.message || {}));
    
    try {
        // Download do arquivo
        console.log('📥 [ARQUIVO] Chamando downloadMedia...');
        const buffer = await client.downloadMedia(msg);
        
        if (!buffer) {
            console.error('❌ [ARQUIVO] Buffer é null/undefined');
            throw new Error('DOWNLOAD_VAZIO');
        }
        
        if (buffer.length === 0) {
            console.error('❌ [ARQUIVO] Buffer tem tamanho 0');
            throw new Error('DOWNLOAD_VAZIO');
        }
        
        console.log(`✅ [ARQUIVO] Download: ${buffer.length} bytes`);
        
        // Detectar tipo de arquivo - verificar múltiplas estruturas possíveis
        const docMsg = msg.message?.documentMessage || 
                       msg.message?.documentWithCaptionMessage?.message?.documentMessage;
        const imgMsg = msg.message?.imageMessage;
        
        const msgType = docMsg || imgMsg;
        
        const mimetype = msgType?.mimetype || '';
        const filename = msgType?.fileName || '';
        
        console.log(`🔍 [ARQUIVO] Tipo detectado: ${mimetype}`);
        console.log(`📝 [ARQUIVO] Nome do arquivo: ${filename}`);
        
        // Processar conforme o tipo
        let texto;
        
        // PDF
        if (mimetype === 'application/pdf' || filename.toLowerCase().endsWith('.pdf')) {
            texto = await processarPDF(buffer);
        } 
        // Imagem
        else if (mimetype.startsWith('image/') || /\.(jpg|jpeg|png|gif|bmp|webp)$/i.test(filename)) {
            texto = await processarImagem(buffer);
        }
        // Word (.docx)
        else if (mimetype === 'application/vnd.openxmlformats-officedocument.wordprocessingml.document' || 
                 filename.toLowerCase().endsWith('.docx')) {
            texto = await processarWord(buffer);
        }
        // Word (.doc)
        else if (mimetype === 'application/msword' || filename.toLowerCase().endsWith('.doc')) {
            texto = await processarWord(buffer);
        }
        // Excel (.xlsx)
        else if (mimetype === 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet' ||
                 filename.toLowerCase().endsWith('.xlsx')) {
            texto = await processarExcel(buffer);
        }
        // Excel (.xls)
        else if (mimetype === 'application/vnd.ms-excel' || filename.toLowerCase().endsWith('.xls')) {
            texto = await processarExcel(buffer);
        }
        // CSV
        else if (mimetype === 'text/csv' || filename.toLowerCase().endsWith('.csv')) {
            texto = await processarCSV(buffer);
        }
        // Tentar detectar por extensão mesmo sem MIME type correto
        else {
            const ext = path.extname(filename).toLowerCase();
            if (ext === '.pdf') {
                texto = await processarPDF(buffer);
            } else if (['.jpg', '.jpeg', '.png', '.gif', '.bmp', '.webp'].includes(ext)) {
                texto = await processarImagem(buffer);
            } else if (['.docx', '.doc'].includes(ext)) {
                texto = await processarWord(buffer);
            } else if (['.xlsx', '.xls'].includes(ext)) {
                texto = await processarExcel(buffer);
            } else if (ext === '.csv') {
                texto = await processarCSV(buffer);
            } else {
                throw new Error('TIPO_NAO_SUPORTADO');
            }
        }
        
        return texto;
        
    } catch (err) {
        console.error(`❌ [ARQUIVO] Erro: ${err.message}`);
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
        // JID e verificação de grupo primeiro para permitir mídia sem texto
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

        // Extrair texto (quando houver). Não sair ainda: mídia pode não ter texto.
        const messageInfo = msg.message?.conversation ||
                            msg.message?.extendedTextMessage?.text || '';

        // --- LEITURA DO PDF (LÓGICA) ---
        if (grupoNome === NOME_GRUPO_AUDITORIA && AGUARDANDO_PDF_AVISO) {
            console.log('🔍 [DETECTOR] Aguardando arquivo...');
            console.log('📨 [DETECTOR] Tipo:', Object.keys(msg.message || {}));
            console.log('📨 [DETECTOR] Mensagem completa:', JSON.stringify(msg, null, 2));
            
            // Aceitar PDF, imagem, Word, Excel, CSV - verificar múltiplas estruturas
            const docMsg = msg.message?.documentMessage || msg.message?.documentWithCaptionMessage?.message?.documentMessage;
            const imgMsg = msg.message?.imageMessage;
            
            console.log('📄 [DEBUG] docMsg:', docMsg ? 'ENCONTRADO' : 'NULL');
            console.log('🖼️ [DEBUG] imgMsg:', imgMsg ? 'ENCONTRADO' : 'NULL');
            
            if (docMsg) {
                console.log('📋 [DEBUG] MimeType:', docMsg.mimetype);
                console.log('📋 [DEBUG] FileName:', docMsg.fileName);
            }
            
            // Verificar se é um arquivo suportado
            const isArquivoValido = 
                (docMsg && (
                    docMsg.mimetype === 'application/pdf' || 
                    docMsg.fileName?.toLowerCase().endsWith('.pdf') ||
                    docMsg.mimetype === 'application/vnd.openxmlformats-officedocument.wordprocessingml.document' ||
                    docMsg.fileName?.toLowerCase().endsWith('.docx') ||
                    docMsg.mimetype === 'application/msword' ||
                    docMsg.fileName?.toLowerCase().endsWith('.doc') ||
                    docMsg.mimetype === 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet' ||
                    docMsg.fileName?.toLowerCase().endsWith('.xlsx') ||
                    docMsg.mimetype === 'application/vnd.ms-excel' ||
                    docMsg.fileName?.toLowerCase().endsWith('.xls') ||
                    docMsg.mimetype === 'text/csv' ||
                    docMsg.fileName?.toLowerCase().endsWith('.csv')
                )) ||
                (imgMsg && imgMsg.mimetype?.startsWith('image/'));
            
            if (!isArquivoValido) {
                console.log('⚠️ [DETECTOR] Não é arquivo suportado. Ignorando...');
                return;
            }
            
            // Determinar tipo de arquivo
            let tipoArquivo = 'Arquivo';
            if (docMsg) {
                const ext = docMsg.fileName?.toLowerCase() || docMsg.mimetype || '';
                if (ext.includes('pdf')) tipoArquivo = 'PDF';
                else if (ext.includes('word') || ext.includes('docx') || ext.includes('doc')) tipoArquivo = 'Word';
                else if (ext.includes('sheet') || ext.includes('excel') || ext.includes('xlsx') || ext.includes('xls')) tipoArquivo = 'Excel';
                else if (ext.includes('csv')) tipoArquivo = 'CSV';
            } else if (imgMsg) {
                tipoArquivo = 'Imagem';
            }
            
            console.log(`📄 [${tipoArquivo}] Arquivo detectado! Processando...`);
            
            // Resetar flag IMEDIATAMENTE para evitar duplicatas
            AGUARDANDO_PDF_AVISO = false;
            
            // Enviar mensagem de processamento
            try {
                await sendMessage(fromJid, `⚙️ *Processando ${tipoArquivo}...*\n\nAguarde alguns segundos...`);
            } catch (e) {
                console.error('❌ Erro ao enviar msg:', e.message);
            }
            
            // Processar arquivo (detecta tipo automaticamente)
            setImmediate(async () => {
                try {
                    console.log('🚀 [PROCESSO] Iniciando...');
                    
                    // Processar arquivo (detecta tipo automaticamente)
                    const textoExtraido = await processarArquivo(msg);
                    
                    // Extrair lista estrita
                    console.log('📊 [DADOS] Extraindo lista estrita...');
                    const resposta = extrairCamposLista(textoExtraido);
                    console.log('✅ [DADOS] Lista gerada');
                    
                    // Enviar resposta
                    console.log('📤 [ENVIO] Enviando...');
                    await client.sendMessage(fromJid, { text: resposta });
                    console.log('✅ [CONCLUÍDO] Sucesso!\n');
                    
                    // Log do comando
                    try {
                        const senderId = msg.key.participant || msg.key.remoteJid;
                        const senderName = await getUserDisplay(senderId);
                        logComando('!aviso (arquivo)', grupoNome, senderName, true);
                    } catch (e) {}
                    
                } catch (error) {
                    console.error('❌ [ERRO]:', error.message);
                    console.error('❌ [STACK]:', error.stack);
                    
                    // Mensagem de erro simplificada
                    let msgErro = '❌ *ERRO AO PROCESSAR ARQUIVO*\n\n';
                    
                    if (error.message.includes('DOWNLOAD_VAZIO')) {
                        msgErro += 'Não foi possível baixar o arquivo. Tente enviar novamente.';
                    } else if (error.message.includes('PDF_SEM_TEXTO')) {
                        msgErro += 'PDF sem texto legível.\n\n*Dicas:*\n• Se for uma imagem escaneada, tente converter em imagem e envie como foto.\n• Se for um PDF protegido, remova a proteção antes de enviar.\n• Tente enviar novamente.';
                    } else if (error.message.includes('PDF_TEXTO_INSUFICIENTE')) {
                        msgErro += 'O PDF tem muito pouco texto legível.\n\n*Dicas:*\n• Certifique-se de que o PDF está legível.\n• Envie um documento melhor ou tente em formato de imagem.';
                    } else if (error.message.includes('IMAGEM_SEM_TEXTO')) {
                        msgErro += 'Imagem sem texto legível. Envie uma foto mais clara ou um documento em melhor resolução.';
                    } else if (error.message.includes('WORD_SEM_TEXTO') ||
                               error.message.includes('EXCEL_SEM_TEXTO') ||
                               error.message.includes('CSV_SEM_TEXTO')) {
                        msgErro += 'Arquivo sem conteúdo legível. Certifique-se de que o arquivo contém dados.';
                    } else if (error.message.includes('TIPO_NAO_SUPORTADO')) {
                        msgErro += 'Formato não suportado.\n\n*Formatos aceitos:*\n📋 PDF\n📊 Excel (XLS, XLSX)\n📄 Word (DOC, DOCX)\n📈 CSV\n🖼️ Imagem (JPG, PNG)';
                    } else {
                        msgErro += `Erro no processamento: ${error.message}\n\nTente enviar novamente ou contate o suporte.`;
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
                        logComando('!aviso (arquivo)', grupoNome, senderName, false, error.message);
                    } catch (e) {}
                }
            });
            
            return;
        }

        // Se não há texto, não há comandos; apenas finalize aqui
        if (!messageInfo) return;

        let textoRecebido = messageInfo.toLowerCase().trim();
        
        // Ativa a espera do PDF
        if (textoRecebido === '!aviso' && grupoNome === NOME_GRUPO_AUDITORIA) {
            AGUARDANDO_PDF_AVISO = true;
            await sendMessage(fromJid, '📄 *IMPORTAÇÃO DE AVISO*\n\nO sistema está aguardando o arquivo.\n👉 *Envie um dos seguintes formatos:*\n\n📋 PDF\n📊 Excel (XLS, XLSX)\n📄 Word (DOC, DOCX)\n📈 CSV\n🖼️ Imagem (JPG, PNG)\n\n*Aguardando o arquivo...*');
            
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
                `📄 *IMPORTADOR DE AVISO (PDF/IMAGEM/EXCEL/WORD/CSV)*\n` +
                `_Funcionalidade exclusiva do grupo ${NOME_GRUPO_AUDITORIA}_\n` +
                `1️⃣ Digite *!aviso*\n` +
                `2️⃣ O bot pedirá o arquivo.\n` +
                `3️⃣ Envie qualquer um destes formatos:\n` +
                `   • 📋 PDF\n` +
                `   • 📊 Excel (XLS, XLSX)\n` +
                `   • 📄 Word (DOC, DOCX)\n` +
                `   • 📈 CSV\n` +
                `   • 🖼️ Imagem (JPG, PNG)\n` +
                `4️⃣ O bot extrairá os dados automaticamente.`;
                
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
        // Silenciar erros de criptografia
        if (error?.message?.includes('MAC') || 
            error?.message?.includes('decrypt') ||
            error?.message?.includes('Bad MAC')) {
            return;
        }
        console.error('❌ Erro ao processar mensagem:', error.message);
    }
});

// Tratamento de erros não capturados
process.on('unhandledRejection', (reason, promise) => {
    // Silenciar erros de criptografia/sessão
    if (reason?.message?.includes('MAC') || 
        reason?.message?.includes('decrypt') ||
        reason?.message?.includes('Bad MAC') ||
        reason?.message?.includes('session')) {
        return;
    }
    console.error('⚠️ Promessa rejeitada:', reason?.message || reason);
});

process.on('uncaughtException', (error) => {
    // Silenciar erros de criptografia/sessão
    if (error?.message?.includes('MAC') || 
        error?.message?.includes('decrypt') ||
        error?.message?.includes('Bad MAC') ||
        error?.message?.includes('session')) {
        return;
    }
    console.error('⚠️ Exceção não capturada:', error?.message || error);
});

// Inicializar cliente
client.initialize();

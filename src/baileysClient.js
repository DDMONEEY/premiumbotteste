const { default: makeWASocket, DisconnectReason, useMultiFileAuthState, fetchLatestBaileysVersion } = require('@whiskeysockets/baileys');
const P = require('pino');
const qrcodeTerminal = require('qrcode-terminal');
const QRCode = require('qrcode');
const fs = require('fs');
const path = require('path');

class BaileysClient {
    constructor() {
        this.sock = null;
        this.qrGenerated = false;
        this.messageHandlers = [];
        this.readyHandlers = [];
        this.authFolder = './auth_info_baileys';
    }

    // Registrar handler de mensagens
    onMessage(handler) {
        this.messageHandlers.push(handler);
    }

    // Registrar handler de ready
    onReady(handler) {
        this.readyHandlers.push(handler);
    }

    // Inicializar cliente
    async initialize() {
        try {
            console.log('🚀 Iniciando conexão com Baileys...');
            
            // Criar pasta de autenticação se não existir
            if (!fs.existsSync(this.authFolder)) {
                fs.mkdirSync(this.authFolder, { recursive: true });
            }

            // Carregar estado de autenticação
            const { state, saveCreds } = await useMultiFileAuthState(this.authFolder);
            
            // Obter versão mais recente do WhatsApp Web
            const { version } = await fetchLatestBaileysVersion();
            console.log(`📱 Usando WhatsApp Web v${version.join('.')}`);

            // Criar socket
            this.sock = makeWASocket({
                version,
                logger: P({ level: 'silent' }),
                printQRInTerminal: false,
                auth: state,
                browser: ['Bot Premium', 'Chrome', '10.0'],
                getMessage: async (key) => {
                    return { conversation: '' };
                }
            });

            // Salvar credenciais quando atualizadas
            this.sock.ev.on('creds.update', saveCreds);

            // Evento de conexão
            this.sock.ev.on('connection.update', async (update) => {
                const { connection, lastDisconnect, qr } = update;

                // Gerar QR Code
                if (qr && !this.qrGenerated) {
                    console.log('\n━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
                    console.log('📱 QR CODE PARA CONEXÃO WHATSAPP');
                    console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n');
                    
                    // Gerar QR Code no terminal (para uso local)
                    qrcodeTerminal.generate(qr, { small: true });
                    
                    // Gerar QR Code como string para logs
                    try {
                        const qrString = await QRCode.toString(qr, { 
                            type: 'terminal',
                            small: true 
                        });
                        console.log('\n' + qrString);
                    } catch (err) {
                        console.log('⚠️ Erro ao gerar QR alternativo');
                    }
                    
                    // Gerar URL do QR Code (pode ser aberta no navegador)
                    try {
                        const qrDataURL = await QRCode.toDataURL(qr);
                        console.log('\n━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
                        console.log('🌐 OPÇÃO ALTERNATIVA - Copie e cole no navegador:');
                        console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
                        console.log('\nDATA URL (Cole no navegador):');
                        console.log(qrDataURL.substring(0, 100) + '...');
                        console.log('\n💡 Ou salve como imagem em: qrcode.png');
                        
                        // Salvar QR Code como imagem
                        await QRCode.toFile('./qrcode.png', qr);
                        console.log('✅ QR Code salvo em: qrcode.png');
                        
                    } catch (err) {
                        console.log('⚠️ Erro ao gerar URL do QR Code:', err.message);
                    }
                    
                    console.log('\n━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
                    console.log('📲 COMO CONECTAR:');
                    console.log('1. Abra o WhatsApp no celular');
                    console.log('2. Vá em Configurações > Aparelhos conectados');
                    console.log('3. Toque em "Conectar um aparelho"');
                    console.log('4. Escaneie o QR Code acima');
                    console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n');
                    
                    this.qrGenerated = true;
                }

                // Verificar conexão
                if (connection === 'close') {
                    const shouldReconnect = lastDisconnect?.error?.output?.statusCode !== DisconnectReason.loggedOut;
                    console.log('⚠️ Conexão fechada. Reconectar:', shouldReconnect);
                    
                    if (shouldReconnect) {
                        setTimeout(() => this.initialize(), 3000);
                    }
                } else if (connection === 'open') {
                    console.log('✅ Conectado ao WhatsApp!');
                    this.qrGenerated = false;
                    
                    // Chamar handlers de ready
                    for (const handler of this.readyHandlers) {
                        try {
                            await handler();
                        } catch (err) {
                            console.error('Erro no handler ready:', err);
                        }
                    }
                }
            });

            // Evento de novas mensagens
            this.sock.ev.on('messages.upsert', async ({ messages, type }) => {
                if (type !== 'notify') return;

                for (const msg of messages) {
                    // Ignorar mensagens antigas e do próprio bot
                    if (!msg.message || msg.key.fromMe) continue;

                    // Processar mensagem
                    for (const handler of this.messageHandlers) {
                        try {
                            await handler(msg);
                        } catch (err) {
                            console.error('Erro no handler de mensagem:', err);
                        }
                    }
                }
            });

        } catch (error) {
            console.error('❌ Erro ao inicializar Baileys:', error);
            throw error;
        }
    }

    // Enviar mensagem de texto
    async sendMessage(jid, text) {
        try {
            await this.sock.sendMessage(jid, { text });
        } catch (error) {
            console.error('❌ Erro ao enviar mensagem:', error);
            throw error;
        }
    }

    // Enviar arquivo/documento
    async sendDocument(jid, filePath, caption = '') {
        try {
            const fileName = path.basename(filePath);
            const fileBuffer = fs.readFileSync(filePath);
            
            await this.sock.sendMessage(jid, {
                document: fileBuffer,
                fileName: fileName,
                caption: caption,
                mimetype: this.getMimeType(filePath)
            });
        } catch (error) {
            console.error('❌ Erro ao enviar documento:', error);
            throw error;
        }
    }

    // Enviar imagem
    async sendImage(jid, imagePath, caption = '') {
        try {
            const imageBuffer = fs.readFileSync(imagePath);
            
            await this.sock.sendMessage(jid, {
                image: imageBuffer,
                caption: caption
            });
        } catch (error) {
            console.error('❌ Erro ao enviar imagem:', error);
            throw error;
        }
    }

    // Baixar mídia
    async downloadMedia(message) {
        try {
            const { default: { downloadMediaMessage } } = require('@whiskeysockets/baileys');
            const buffer = await downloadMediaMessage(message, 'buffer', {});
            return buffer;
        } catch (error) {
            console.error('❌ Erro ao baixar mídia:', error);
            throw error;
        }
    }

    // Obter chats/grupos
    async getChats() {
        try {
            // No Baileys, precisamos manter um cache dos chats
            // ou buscar do store
            const chats = [];
            
            if (this.sock && this.sock.groupFetchAllParticipating) {
                const groups = await this.sock.groupFetchAllParticipating();
                
                for (const groupId in groups) {
                    const group = groups[groupId];
                    chats.push({
                        id: { _serialized: groupId },
                        name: group.subject,
                        isGroup: true
                    });
                }
            }
            
            return chats;
        } catch (error) {
            console.error('❌ Erro ao buscar chats:', error);
            return [];
        }
    }

    // Obter contato por ID
    async getContactById(contactId) {
        try {
            // Extrair número do JID se necessário
            const number = contactId.split('@')[0];
            
            return {
                id: { _serialized: contactId },
                pushname: number,
                name: number,
                number: number
            };
        } catch (error) {
            console.error('❌ Erro ao buscar contato:', error);
            return {
                id: { _serialized: contactId },
                pushname: contactId,
                name: contactId
            };
        }
    }

    // Determinar tipo MIME
    getMimeType(filePath) {
        const ext = path.extname(filePath).toLowerCase();
        const mimeTypes = {
            '.pdf': 'application/pdf',
            '.png': 'image/png',
            '.jpg': 'image/jpeg',
            '.jpeg': 'image/jpeg',
            '.gif': 'image/gif',
            '.doc': 'application/msword',
            '.docx': 'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
            '.xls': 'application/vnd.ms-excel',
            '.xlsx': 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
            '.txt': 'text/plain',
            '.zip': 'application/zip'
        };
        return mimeTypes[ext] || 'application/octet-stream';
    }

    // Destruir cliente
    async destroy() {
        if (this.sock) {
            await this.sock.logout();
            this.sock = null;
        }
    }
}

module.exports = BaileysClient;

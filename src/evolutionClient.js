const axios = require('axios');
const { EVOLUTION_API_URL, EVOLUTION_API_KEY, EVOLUTION_INSTANCE_NAME } = require('./config');

class EvolutionClient {
    constructor() {
        this.baseURL = EVOLUTION_API_URL;
        this.apiKey = EVOLUTION_API_KEY;
        this.instanceName = EVOLUTION_INSTANCE_NAME;
        this.axios = axios.create({
            baseURL: this.baseURL,
            headers: {
                'apikey': this.apiKey,
                'Content-Type': 'application/json'
            }
        });
    }

    // Criar ou conectar instância
    async createInstance() {
        try {
            const response = await this.axios.post('/instance/create', {
                instanceName: this.instanceName,
                qrcode: true,
                integration: 'WHATSAPP-BAILEYS'
            });
            console.log('✅ Instância criada/conectada:', response.data);
            return response.data;
        } catch (error) {
            console.error('❌ Erro ao criar instância:', error.response?.data || error.message);
            throw error;
        }
    }

    // Conectar instância existente
    async connectInstance() {
        try {
            const response = await this.axios.get(`/instance/connect/${this.instanceName}`);
            console.log('✅ Conectado à instância');
            return response.data;
        } catch (error) {
            console.error('❌ Erro ao conectar:', error.response?.data || error.message);
            throw error;
        }
    }

    // Obter QR Code
    async getQRCode() {
        try {
            const response = await this.axios.get(`/instance/qrcode/${this.instanceName}`);
            return response.data;
        } catch (error) {
            console.error('❌ Erro ao obter QR Code:', error.response?.data || error.message);
            return null;
        }
    }

    // Enviar mensagem de texto
    async sendText(remoteJid, text) {
        try {
            const response = await this.axios.post(`/message/sendText/${this.instanceName}`, {
                number: remoteJid,
                text: text
            });
            return response.data;
        } catch (error) {
            console.error('❌ Erro ao enviar mensagem:', error.response?.data || error.message);
            throw error;
        }
    }

    // Enviar arquivo/mídia
    async sendMedia(remoteJid, mediaPath, caption = '') {
        try {
            const fs = require('fs');
            const path = require('path');
            const base64 = fs.readFileSync(mediaPath, { encoding: 'base64' });
            const mimetype = this.getMimeType(mediaPath);
            
            const response = await this.axios.post(`/message/sendMedia/${this.instanceName}`, {
                number: remoteJid,
                mediatype: 'document',
                mimetype: mimetype,
                caption: caption,
                media: base64,
                fileName: path.basename(mediaPath)
            });
            return response.data;
        } catch (error) {
            console.error('❌ Erro ao enviar mídia:', error.response?.data || error.message);
            throw error;
        }
    }

    // Obter grupos
    async fetchGroups() {
        try {
            const response = await this.axios.get(`/group/fetchAllGroups/${this.instanceName}`);
            return response.data;
        } catch (error) {
            console.error('❌ Erro ao buscar grupos:', error.response?.data || error.message);
            return [];
        }
    }

    // Marcar como lido
    async markAsRead(remoteJid, messageId) {
        try {
            const response = await this.axios.post(`/chat/markMessageAsRead/${this.instanceName}`, {
                readMessages: [{
                    remoteJid: remoteJid,
                    id: messageId,
                    fromMe: false
                }]
            });
            return response.data;
        } catch (error) {
            // Ignora erro silenciosamente
        }
    }

    // Status da conexão
    async getConnectionStatus() {
        try {
            const response = await this.axios.get(`/instance/connectionState/${this.instanceName}`);
            return response.data;
        } catch (error) {
            console.error('❌ Erro ao obter status:', error.response?.data || error.message);
            return null;
        }
    }

    // Helper: determinar mimetype
    getMimeType(filePath) {
        const ext = filePath.split('.').pop().toLowerCase();
        const mimeTypes = {
            'pdf': 'application/pdf',
            'doc': 'application/msword',
            'docx': 'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
            'xlsx': 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
            'xlsm': 'application/vnd.ms-excel.sheet.macroEnabled.12',
            'jpg': 'image/jpeg',
            'jpeg': 'image/jpeg',
            'png': 'image/png'
        };
        return mimeTypes[ext] || 'application/octet-stream';
    }
}

module.exports = EvolutionClient;

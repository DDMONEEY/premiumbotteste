const path = require('path');
const { MessageMedia } = require('whatsapp-web.js');

async function enviar(chat, arquivos) {
    setTimeout(async () => {
        try {
            for (let i = 0; i < arquivos.length; i++) {
                const filePath = path.join(__dirname, '..', arquivos[i]);
                const media = MessageMedia.fromFilePath(filePath);
                await chat.sendMessage(media, { sendMediaAsDocument: true });
                // Delay entre envios para evitar sobrecarga
                if (i < arquivos.length - 1) {
                    await new Promise(resolve => setTimeout(resolve, 2000));
                }
            }
        } catch (erro) { 
            console.error('❌ Erro ao enviar arquivo:', erro.message);
        }
    }, 3000);
}

module.exports = { enviar, enviarArquivos: enviar };
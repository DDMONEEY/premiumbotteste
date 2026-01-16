const path = require('path');
const { MessageMedia } = require('whatsapp-web.js');

async function enviar(chat, arquivos) {
    setTimeout(async () => {
        try {
            for (let i = 0; i < arquivos.length; i++) {
                const media = MessageMedia.fromFilePath(path.join(__dirname, '..', arquivos[i]));
                await chat.sendMessage(media);
            }
        } catch (erro) { console.log('Erro envio:', erro.message); }
    }, 3000);
}

module.exports = { enviar, enviarArquivos: enviar };
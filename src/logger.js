const fs = require('fs');
const path = require('path');

const logsDir = path.join(__dirname, '..', 'logs');
const logFile = path.join(logsDir, 'commands.log');

function ensureLogsDir() {
    if (!fs.existsSync(logsDir)) {
        fs.mkdirSync(logsDir, { recursive: true });
    }
}

function logPainel(titulo, conteudo) {
    console.log('\n' + '='.repeat(60));
    console.log(` ${titulo}`);
    console.log('-'.repeat(60));

    if (Array.isArray(conteudo)) {
        conteudo.forEach(line => console.log(line));
    } else {
        console.log(conteudo);
    }

    console.log('='.repeat(60) + '\n');
}

function logComando(comando, grupo, usuario, retornou = false, motivo = '') {
    const timestamp = new Date().toLocaleString('pt-BR');
    const linhas = [
        `Comando: ${comando}`,
        `Grupo: ${grupo}`,
        `Usuário: ${usuario}`,
        `Data/Hora: ${timestamp}`,
        `Retornou: ${retornou ? '✅' : '❌'}${motivo ? ' - ' + motivo : ''}`
    ];

    // Log no terminal
    logPainel('COMANDO', linhas);

    // Grava também em arquivo para o painel .bat
    try {
        ensureLogsDir();
        const entry = linhas.join('\r\n') + '\r\n' + '-'.repeat(60) + '\r\n';
        fs.appendFile(logFile, entry, (err) => {
            if (err) console.error('Erro ao gravar log:', err);
        });
    } catch (e) {
        console.error('Erro ao gravar log em arquivo:', e);
    }
}

module.exports = { logPainel, logComando };
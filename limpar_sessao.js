const fs = require('fs');
const path = require('path');

const authFolder = './auth_info_baileys';

console.log('🧹 Limpando pasta de autenticação...\n');

if (fs.existsSync(authFolder)) {
    const files = fs.readdirSync(authFolder);
    
    if (files.length === 0) {
        console.log('✅ Pasta já está vazia.');
    } else {
        files.forEach(file => {
            const filePath = path.join(authFolder, file);
            try {
                fs.unlinkSync(filePath);
                console.log(`✅ Removido: ${file}`);
            } catch (err) {
                console.error(`❌ Erro ao remover ${file}:`, err.message);
            }
        });
        console.log('\n✅ Pasta de autenticação limpa com sucesso!');
        console.log('⚠️ Execute o bot novamente para fazer login via QR Code.');
    }
} else {
    console.log('ℹ️ Pasta de autenticação não existe.');
}

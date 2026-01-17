// src/config.js

module.exports = {
    ANTI_FLOOD_TIME: 5000,
    NOME_GRUPO_AUDITORIA: 'TESTE BOT',
    VERSAO_BOT: '7.0.0 (Evolution API)',
    
    // Configurações Evolution API
    EVOLUTION_API_URL: process.env.EVOLUTION_API_URL || 'http://localhost:8080',
    EVOLUTION_API_KEY: process.env.EVOLUTION_API_KEY || 'sua-chave-api-aqui',
    EVOLUTION_INSTANCE_NAME: process.env.EVOLUTION_INSTANCE_NAME || 'premium-bot',
    
    COMANDOS_VALIDOS: [
        '!inicio', '!recibo', '!final', '!cnpj', '!declaracao', '!ata', '!inventario', 
        '!salvados', '!atencao', '!ajuda', '!menu', '!comandos', '!status',
        '!espiao on', '!espiao off', '!aviso', '!buscar'
    ],
    comandosValidos: [
        '!inicio', '!recibo', '!final', '!cnpj', '!declaracao', '!ata', '!inventario', 
        '!salvados', '!atencao', '!ajuda', '!menu', '!comandos', '!status',
        '!espiao on', '!espiao off', '!aviso', '!buscar'
    ]
};
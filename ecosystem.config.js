module.exports = {
  apps: [{
    name: 'premiumbot',
    script: './index.js',
    instances: 1,
    exec_mode: 'fork',
    
    // ⚠️ CRÍTICO: Variáveis de ambiente para sessão persistente
    env: {
      NODE_ENV: 'production',
      WA_AUTH_DIR: '/var/lib/premium-bot/auth',
      CLEAN_SESSION_ON_START: '0'
    },
    
    // Logs
    error_file: '/var/log/premium-bot/error.log',
    out_file: '/var/log/premium-bot/out.log',
    log_date_format: 'YYYY-MM-DD HH:mm:ss Z',
    
    // Comportamento
    autorestart: true,
    watch: false,
    max_memory_restart: '500M',
    
    // Timeouts
    listen_timeout: 5000,
    kill_timeout: 5000
  }]
};

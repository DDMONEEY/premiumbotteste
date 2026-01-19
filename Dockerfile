# Dockerfile para bot-sinistro
# Imagem base com Puppeteer instalada
FROM ghcr.io/puppeteer/puppeteer:latest

# Rodar como root (conforme solicitado)
USER root

# Diretório de trabalho
WORKDIR /usr/src/app

# Evita instalar dependências desnecessárias em ambientes de dev/build
ENV NODE_ENV=production

# Copia package.json primeiro para aproveitar cache do Docker
COPY package*.json ./

# Instala dependências
RUN npm install --production

# Copia o restante do código
COPY . .

# Comando de start
CMD ["node", "index.js"]

# Instala dependências do sistema para o Puppeteer/Chrome rodar no Linux
RUN apt-get update && apt-get install -y \
    wget \
    gnupg \
    ca-certificates \
    fonts-liberation \
    libasound2 \
    libatk-bridge2.0-0 \
    libatk1.0-0 \
    libc6 \
    libcairo2 \
    libcups2 \
    libdbus-1-3 \
    libexpat1 \
    libfontconfig1 \
    libgbm1 \
    libgcc1 \
    libglib2.0-0 \
    libgtk-3-0 \
    libnspr4 \
    libnss3 \
    libpango-1.0-0 \
    libpangocairo-1.0-0 \
    libstdc++6 \
    libx11-6 \
    libx11-xcb1 \
    libxcb1 \
    libxcomposite1 \
    libxcursor1 \
    libxdamage1 \
    libxext6 \
    libxfixes3 \
    libxi6 \
    libxrandr2 \
    libxrender1 \
    libxss1 \
    libxtst6 \
    lsb-release \
    xdg-utils \
    --no-install-recommends \
    && rm -rf /var/lib/apt/lists/*
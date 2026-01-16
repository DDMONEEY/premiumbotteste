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

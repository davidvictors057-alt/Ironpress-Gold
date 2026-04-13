# Stage 1: Build do Frontend (Vite)
FROM node:22-alpine AS builder
WORKDIR /app

# Instalar dependências de build
COPY package*.json ./
RUN npm install

# Copiar código e realizar o build
COPY . .
RUN npm run build

# Stage 2: Servidor de Produção (Express Bunker)
FROM node:22-alpine AS runner
WORKDIR /app

# Definir ambiente
ENV NODE_ENV=production

# Instalar apenas dependências de produção
COPY package*.json ./
RUN npm install --only=production

# Copiar o build do frontend para a pasta 'dist' do servidor
COPY --from=builder /app/dist ./dist

# Copiar o servidor bunker
COPY server.js .

# Cloud Run exige porta dinâmica via porta 8080 padrão
EXPOSE 8080

# Comando de Inicialização de Elite
CMD ["node", "server.js"]

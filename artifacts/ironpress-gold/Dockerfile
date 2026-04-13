# Stage 1: Build do Frontend e Preparação do Bunker
FROM node:22-alpine AS builder

# Instalar pnpm
RUN npm install -g pnpm

WORKDIR /app

# Copiar arquivos de configuração do Monorepo (Raiz)
COPY pnpm-lock.yaml pnpm-workspace.yaml package.json .npmrc tsconfig*.json ./
COPY artifacts/ironpress-gold ./artifacts/ironpress-gold
COPY lib ./lib
COPY attached_assets ./attached_assets

# Instalar TODAS as dependências da raiz de forma flexível (sem travar o lockfile)
RUN pnpm install --no-frozen-lockfile

# Realizar o build do app
WORKDIR /app/artifacts/ironpress-gold
RUN pnpm run build

# Stage 2: Servidor de Produção de Elite (Bunker)
FROM node:22-alpine AS runner
WORKDIR /app

# Definir ambiente
ENV NODE_ENV=production
ENV PORT=8080

# Instalar APENAS as dependências do servidor bunker
# Criamos um package.json temporário com "type": "module" para o Node aceitar a sintaxe 'import' do seu server.js
RUN echo '{"type": "module"}' > package.json && \
    npm install express@4 cors dotenv node-fetch

# Copiar o bundle do frontend e o arquivo do servidor
COPY --from=builder /app/artifacts/ironpress-gold/dist/public ./dist
COPY --from=builder /app/artifacts/ironpress-gold/server.js ./

# Cloud Run exige porta dinâmica via porta 8080 padrão
EXPOSE 8080

# Comando de Inicialização do Bunker
# Usamos node direto para carregamento rápido
CMD ["node", "server.js"]




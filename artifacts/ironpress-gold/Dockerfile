# Stage 1: Build do Frontend e Preparação do Bunker
FROM node:22-alpine AS builder

# Instalar pnpm
RUN npm install -g pnpm

WORKDIR /app

# Copiar arquivos de configuração do Monorepo (Raiz)
# Estes arquivos são necessários para resolver os "catalogs" e dependências locais
COPY pnpm-lock.yaml pnpm-workspace.yaml package.json .npmrc ./
COPY artifacts/ironpress-gold ./artifacts/ironpress-gold
COPY lib ./lib
COPY attached_assets ./attached_assets

# Instalar dependências focando no app ironpress-gold e suas libs locais (@workspace)
RUN pnpm install --frozen-lockfile --filter ironpress-gold...

# Realizar o build do app
WORKDIR /app/artifacts/ironpress-gold
RUN pnpm run build

# Stage 2: Servidor de Produção de Elite (Bunker)
FROM node:22-alpine AS runner
WORKDIR /app

# Definir ambiente
ENV NODE_ENV=production
ENV PORT=8080

# Copiar apenas os arquivos necessários para execução
# Nota: O vite.config.ts gera em dist/public, normalizamos para /app/dist conforme server.js
COPY --from=builder /app/artifacts/ironpress-gold/dist/public ./dist
COPY --from=builder /app/artifacts/ironpress-gold/package.json ./
COPY --from=builder /app/artifacts/ironpress-gold/server.js ./

# Instalar pnpm no runner para garantir resolução limpa de produção
RUN npm install -g pnpm && \
    pnpm install --prod --no-frozen-lockfile

# Cloud Run exige porta dinâmica via porta 8080 padrão
EXPOSE 8080

# Comando de Inicialização do Bunker
CMD ["node", "server.js"]


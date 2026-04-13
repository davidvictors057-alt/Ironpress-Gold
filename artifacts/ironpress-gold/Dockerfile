# Stage 1: Build do Frontend e Preparação do Bunker
FROM node:22-alpine AS builder

# Instalar pnpm
RUN npm install -g pnpm

WORKDIR /app

# Copiar arquivos de configuração do Monorepo (Raiz)
COPY pnpm-lock.yaml pnpm-workspace.yaml package.json .npmrc ./
COPY artifacts/ironpress-gold ./artifacts/ironpress-gold
COPY lib ./lib
COPY attached_assets ./attached_assets

# Instalar TODAS as dependências da raiz para evitar erros de filtro/referência
RUN pnpm install --frozen-lockfile

# Realizar o build do app
WORKDIR /app/artifacts/ironpress-gold
RUN pnpm run build

# Stage 2: Servidor de Produção de Elite (Bunker)
FROM node:22-alpine AS runner
WORKDIR /app

# Definir ambiente
ENV NODE_ENV=production
ENV PORT=8080

# Instalar APENAS as dependências do servidor (ignorando o package.json do frontend para evitar erro de npm com "catalog:")
RUN npm install express cors dotenv node-fetch

# Copiar o bundle do frontend e o arquivo do servidor
COPY --from=builder /app/artifacts/ironpress-gold/dist/public ./dist
COPY --from=builder /app/artifacts/ironpress-gold/server.js ./

# Cloud Run exige porta dinâmica via porta 8080 padrão
EXPOSE 8080

# Comando de Inicialização do Bunker
CMD ["node", "server.js"]



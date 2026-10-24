# Stage 1: Build Stage
FROM node:22-alpine AS builder

WORKDIR /app

# Instalar dependencias necesarias para modulos nativos
RUN apk add --no-cache python3 make g++

# Copiar manifiestos de backend y shared
COPY backend/package*.json ./backend/
COPY shared/ ./shared/

WORKDIR /app/backend
RUN npm ci

# Copiar configuraciones y codigo fuente
COPY backend/tsconfig*.json ./
COPY backend/nest-cli.json ./
COPY backend/src/ ./src/

# Compilar backend
RUN npm run build

# Stage 2: Production Minimal Stage
FROM node:22-alpine AS production

WORKDIR /app

ENV NODE_ENV=production
ENV PORT=3000

# Copiar manifiestos e instalar unicamente dependencias de produccion
COPY backend/package*.json ./backend/
COPY shared/ ./shared/

WORKDIR /app/backend
RUN npm ci --omit=dev && npm cache clean --force

# Copiar artefactos de compilacion desde el stage builder
COPY --from=builder /app/backend/dist ./dist

# Principio de menor privilegio: ejecucion con usuario no-root
USER node

EXPOSE 3000

CMD ["node", "dist/backend/src/main.js"]

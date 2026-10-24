# Stage 1: Build Angular SPA
FROM node:22-alpine AS builder

WORKDIR /app

# Copiar manifiesto de dependencias y shared
COPY frontend/package*.json ./frontend/
COPY shared/ ./shared/

WORKDIR /app/frontend
RUN npm ci

# Copiar configuraciones y codigo fuente
COPY frontend/angular.json frontend/tsconfig*.json ./
COPY frontend/src/ ./src/
COPY frontend/public/ ./public/

# Compilacion de produccion AOT
RUN npm run build -- --configuration production

# Stage 2: Serve with Nginx Alpine
FROM nginx:1.27-alpine AS production

# Copiar configuracion optimizada de Nginx
COPY frontend/nginx.conf /etc/nginx/conf.d/default.conf

# Copiar bundle de produccion compilado
COPY --from=builder /app/frontend/dist/frontend/browser /usr/share/nginx/html

EXPOSE 80

CMD ["nginx", "-g", "daemon off;"]

# Dockerfile para PseudoGen v1.0.0
# Usando un build multi-etapa con Node 22 (Alpine) para optimizar el tamaño

# Etapa 1: Construcción (Build)
FROM node:22-alpine AS build
WORKDIR /app

# Copiar archivos de dependencias
COPY package*.json ./

# Instalar dependencias usando --legacy-peer-deps por el conflicto de Vite 8 + Recharts
RUN npm install --legacy-peer-deps

# Copiar el resto del código y construir la app
COPY . .
RUN npm run build

# Etapa 2: Servidor de Producción (Nginx)
FROM nginx:stable-alpine
# Copiar el build de la etapa anterior
COPY --from=build /app/dist /usr/share/nginx/html

# Configuración básica de Nginx para Single Page Apps (opcional, previene 404 en refrescos de rutas)
RUN echo 'server { \
    listen 80; \
    location / { \
        root /usr/share/nginx/html; \
        index index.html index.htm; \
        try_files $uri $uri/ /index.html; \
    } \
}' > /etc/nginx/conf.d/default.conf

EXPOSE 80
CMD ["nginx", "-g", "daemon off;"]

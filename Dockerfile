# Build-Stage: React/Vite-Produktionsbuild
FROM node:22-alpine AS build
WORKDIR /app
COPY package.json package-lock.json ./
RUN npm ci
COPY . .
RUN npm run build

# Serve-Stage: nur statische Dateien, kein Node im Produktiv-Image
FROM nginx:1.25-alpine
COPY --from=build /app/dist /usr/share/nginx/html
COPY docker/nginx.conf /etc/nginx/conf.d/default.conf
EXPOSE 80

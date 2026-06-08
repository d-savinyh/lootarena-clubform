# Этап сборки
FROM node:20-alpine AS build

WORKDIR /app

COPY package*.json ./
RUN npm ci

COPY . .
RUN npm run build

# Продакшн — Node edge-сервер (SPA + динамические OG-теги + кеш get_landing)
FROM node:20-alpine

WORKDIR /app

# Только статика сборки и edge-сервер (server.js — zero-dependency, Node built-ins)
COPY --from=build /app/dist ./dist
COPY --from=build /app/server.js ./server.js

ENV PORT=80
# SITE_ORIGIN и VITE_API_BASE_URL можно переопределить в Dokploy
ENV SITE_ORIGIN=https://form.lootarena.ru

EXPOSE 80

CMD ["node", "server.js"]

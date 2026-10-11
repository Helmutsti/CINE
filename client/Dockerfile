# Cineteca · client web per Jellyfin
FROM node:24-alpine AS costruzione
WORKDIR /app
COPY package.json package-lock.json ./
RUN npm ci
COPY . .
RUN npm run build

FROM nginx:1.29-alpine
ARG VERSIONE=1.2.0
ENV CINETECA_VERSIONE=${VERSIONE} \
    JELLYFIN_URL=http://jellyfin:8096 \
    JELLYFIN_API_KEY=""
COPY --from=costruzione /app/dist /usr/share/nginx/html
COPY docker/default.conf.template /etc/nginx/templates/default.conf.template
EXPOSE 80

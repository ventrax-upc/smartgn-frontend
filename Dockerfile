FROM node:22-alpine AS build
WORKDIR /app
COPY package.json package-lock.json ./
RUN npm ci
COPY angular.json tsconfig*.json ./
COPY public ./public
COPY src ./src
RUN npm run build

FROM nginx:stable-alpine-slim
ENV SMARTGN_GATEWAY_UPSTREAM=api-gateway:8000 \
    SMARTGN_DNS_RESOLVER=127.0.0.11 \
    NGINX_ENVSUBST_FILTER="^SMARTGN_(GATEWAY_UPSTREAM|DNS_RESOLVER)$"
COPY nginx.conf /etc/nginx/templates/default.conf.template
COPY --from=build /app/dist/smartgn-frontend/browser/ /usr/share/nginx/html/
HEALTHCHECK --interval=15s --timeout=3s CMD wget -q -O /dev/null http://127.0.0.1/healthz || exit 1

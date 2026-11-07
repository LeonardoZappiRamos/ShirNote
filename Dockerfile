# Site de demonstração do ShirNote: build estático servido pelo nginx.
# Uso local: docker compose up --build  (abre em http://localhost:8088)

FROM node:22-alpine AS build
WORKDIR /app
COPY package.json package-lock.json ./
RUN npm ci
COPY . .
RUN npm run build

FROM nginx:1.27-alpine
COPY --from=build /app/dist /usr/share/nginx/html
EXPOSE 80

# Stage 1: Build
FROM node:20-alpine AS build
WORKDIR /app

ARG API_BASE_URL=http://localhost:8080

COPY package*.json ./
RUN npm ci

COPY . .

# Replace __API_BASE_URL__ placeholder with actual API_BASE_URL build arg
RUN sed -i "s|__API_BASE_URL__|${API_BASE_URL}|g" src/environments/environment.prod.ts

RUN npm run build -- --configuration production

# Stage 2: Serve
FROM nginx:alpine

COPY --from=build /app/dist/pos-frontend/browser /usr/share/nginx/html
COPY nginx.conf /etc/nginx/conf.d/default.conf

EXPOSE 80
# Stage 1: Build compilation
FROM node:20-alpine AS build

WORKDIR /app

COPY package*.json ./
RUN npm ci

COPY . .
RUN npm run build

# Stage 2: Serve using Nginx
FROM nginx:alpine

# Copy custom nginx configuration for routing proxies
COPY nginx.conf /etc/nginx/conf.d/default.conf

# Copy production files from compile layer
COPY --from=build /app/dist /usr/share/nginx/html

EXPOSE 80

CMD ["nginx", "-g", "daemon off;"]

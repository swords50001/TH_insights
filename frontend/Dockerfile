# Multi-stage build for frontend (Vite) - builds static assets then serves with nginx
FROM node:18-alpine AS builder

WORKDIR /app
ENV CI=true
ARG VITE_API_URL
ENV VITE_API_URL=${VITE_API_URL}

# install dependencies
COPY package*.json ./
RUN npm ci

# copy source and build
COPY . .
RUN npm run build

# production image - serve built assets with nginx
FROM nginx:stable-alpine AS runner
COPY --from=builder /app/dist /usr/share/nginx/html
COPY nginx.conf /etc/nginx/conf.d/default.conf
EXPOSE 80
CMD ["nginx", "-g", "daemon off;"]

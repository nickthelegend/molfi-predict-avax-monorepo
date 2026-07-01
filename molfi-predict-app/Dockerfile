# Predifi Frontend Dockerfile
FROM node:20-alpine AS build
WORKDIR /app
# Copy dependency manifests
COPY package.json package-lock.json* ./
RUN npm ci
# Copy source
COPY . .
# Build static assets
RUN npm run build

FROM node:20-alpine AS runtime
WORKDIR /app
# Install a lightweight static file server
RUN npm install -g serve@14.2.1
# Copy build output only
COPY --from=build /app/dist ./dist
# Cloud Run / typical container platforms provide PORT env var
ENV PORT=8080
EXPOSE 8080
# Serve the compiled Vite app; -s enables single-page routing fallback
CMD ["serve", "-s", "dist", "-l", "${PORT}"]

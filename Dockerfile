FROM node:24-bookworm-slim AS build
WORKDIR /app
COPY package.json package-lock.json ./
RUN npm ci --no-audit --no-fund
COPY index.html vite.config.mjs ./
COPY app ./app
COPY lib ./lib
COPY public ./public
RUN npm run build

FROM node:24-bookworm-slim
WORKDIR /app
ENV NODE_ENV=production HOST=0.0.0.0 PORT=3000 DATABASE_PATH=/app/data/sessions.sqlite
COPY --from=build /app/dist ./dist
COPY --from=build /app/app/api ./app/api
COPY --from=build /app/lib ./lib
COPY server.mjs package.json ./
RUN mkdir -p /app/data && chown node:node /app/data
USER node
EXPOSE 3000
CMD ["node","server.mjs"]

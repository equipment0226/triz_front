FROM node:24-alpine AS build
WORKDIR /app
COPY package*.json ./
RUN npm ci
COPY . .
RUN npm run build

FROM node:24-alpine
WORKDIR /app
ENV NODE_ENV=production PORT=8080
COPY package*.json ./
RUN npm ci --omit=dev
COPY --from=build /app/dist ./dist
COPY server.mjs ./server.mjs
COPY auth.mjs ./auth.mjs
EXPOSE 8080
CMD ["node", "server.mjs"]

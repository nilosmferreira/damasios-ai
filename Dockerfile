FROM node:20-alpine AS development-dependencies-env
RUN npm install -g pnpm
COPY package.json pnpm-lock.yaml /app/
WORKDIR /app
RUN pnpm install --frozen-lockfile
COPY . /app

FROM node:20-alpine AS production-dependencies-env
RUN npm install -g pnpm
COPY package.json pnpm-lock.yaml /app/
WORKDIR /app
RUN pnpm install --frozen-lockfile --prod

FROM node:20-alpine AS build-env
RUN npm install -g pnpm
COPY package.json pnpm-lock.yaml /app/
COPY --from=development-dependencies-env /app/node_modules /app/node_modules
COPY . /app/
WORKDIR /app
RUN pnpm build

FROM node:20-alpine
RUN npm install -g pnpm
COPY package.json pnpm-lock.yaml /app/
COPY --from=production-dependencies-env /app/node_modules /app/node_modules
COPY --from=build-env /app/build /app/build
WORKDIR /app
EXPOSE 3000
CMD ["pnpm", "start"]
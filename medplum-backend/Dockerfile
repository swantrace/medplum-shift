# syntax = docker/dockerfile:1

ARG NODE_VERSION=20.17.0
FROM node:${NODE_VERSION}-slim as base
LABEL fly_launch_runtime="Node.js"

RUN mkdir -p /app/binary && chmod 777 /app/binary
WORKDIR /app
ENV NODE_ENV="production"

FROM base as build
RUN apt-get update -qq && apt-get install --no-install-recommends -y build-essential node-gyp pkg-config python-is-python3
COPY server/package-lock.json server/package.json ./
RUN npm ci
COPY server/ .
RUN npm run build

FROM base
COPY --from=build /app /app
EXPOSE 8103
CMD ["npm", "run", "start"]
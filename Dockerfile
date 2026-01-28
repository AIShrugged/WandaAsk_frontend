FROM third-party-registry.fabit.ru/docker.io/library/node:20.15.0-alpine3.20

WORKDIR /app

COPY package.json package-lock.json ./
RUN npm ci

COPY . ./

# Clean any cached build artifacts
RUN rm -rf .next node_modules/.cache

# Build without turbopack (webpack is more stable for production)
ENV NEXT_TELEMETRY_DISABLED=1
RUN npm run build

CMD ["npm", "run", "start"]

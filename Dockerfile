FROM docker.io/library/node:20.15.0-alpine3.20

WORKDIR /app

COPY package.json package-lock.json ./
RUN npm ci

COPY . ./

# Clean any cached build artifacts
RUN rm -rf .next node_modules/.cache

# Build without turbopack (webpack is more stable for production)
ENV NEXT_TELEMETRY_DISABLED=1
ARG NEXT_PUBLIC_APP_ENV
ENV NEXT_PUBLIC_APP_ENV=$NEXT_PUBLIC_APP_ENV
RUN npm run build

CMD ["npm", "run", "start"]

FROM third-party-registry.fabit.ru/docker.io/library/node:20.15.0-alpine3.20

ARG API_URL=https://dev-api.shrugged.ai/api/v1
ARG NEXT_PUBLIC_APP_ENV=production

WORKDIR /app

COPY package.json package-lock.json ./
RUN npm ci

COPY . ./

# Clean any cached build artifacts
RUN rm -rf .next node_modules/.cache

# Build-time env: NEXT_PUBLIC_* must be available during `npm run build`
# so Next.js can inline them into the client bundle.
ENV NEXT_TELEMETRY_DISABLED=1
ENV API_URL=${API_URL}
ENV NEXT_PUBLIC_APP_ENV=${NEXT_PUBLIC_APP_ENV}
RUN npm run build

CMD ["npm", "run", "start"]

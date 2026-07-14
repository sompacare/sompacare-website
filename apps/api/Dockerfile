# Sompacare Platform API — production container
FROM node:20-alpine AS base
WORKDIR /app
RUN apk add --no-cache openssl

FROM base AS deps
COPY package.json package-lock.json ./
COPY apps/api/package.json ./apps/api/
COPY apps/nurse-portal/package.json ./apps/nurse-portal/
COPY apps/facility-portal/package.json ./apps/facility-portal/
COPY apps/recruiter-portal/package.json ./apps/recruiter-portal/
COPY apps/admin-portal/package.json ./apps/admin-portal/
COPY packages/database/package.json ./packages/database/
COPY packages/shared/package.json ./packages/shared/
COPY packages/database/prisma ./packages/database/prisma
RUN npm ci --include=dev
RUN npm run db:generate --workspace=@sompacare/database

FROM base AS build
COPY --from=deps /app/node_modules ./node_modules
COPY . .
RUN npm run build --workspace=@sompacare/shared \
  && npm run build --workspace=@sompacare/database \
  && npm run build --workspace=@sompacare/api

FROM base AS runner
ENV NODE_ENV=production
WORKDIR /app
COPY --from=build /app/node_modules ./node_modules
COPY --from=build /app/apps/api/dist ./apps/api/dist
COPY --from=build /app/apps/api/package.json ./apps/api/package.json
COPY --from=build /app/apps/api/docker-entrypoint.sh ./apps/api/docker-entrypoint.sh
COPY --from=build /app/packages ./packages
COPY --from=build /app/package.json ./package.json
RUN chmod +x /app/apps/api/docker-entrypoint.sh \
  && sed -i 's/\r$//' /app/apps/api/docker-entrypoint.sh
WORKDIR /app/apps/api
EXPOSE 4000
ENTRYPOINT ["sh", "/app/apps/api/docker-entrypoint.sh"]

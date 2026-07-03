FROM node:20-bookworm-slim

WORKDIR /app

RUN apt-get update && apt-get install -y --no-install-recommends openssl ca-certificates \
  && rm -rf /var/lib/apt/lists/*

COPY package.json package-lock.json .npmrc ./
COPY scripts/ensure-tailwind-oxide.js scripts/ensure-tailwind-oxide.js

RUN npm ci --include=optional \
  && node scripts/ensure-tailwind-oxide.js

COPY . .

RUN npm run build

ENV NODE_ENV=production
ENV PORT=3000
EXPOSE 3000

CMD ["npm", "run", "start"]

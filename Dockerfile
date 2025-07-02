# web/Dockerfile
FROM node:20-slim

WORKDIR /app/web

# 1) Install pnpm globally
RUN npm install -g pnpm@9.6.0

# 2) Ensure local binaries (like `next`) are on PATH
ENV PATH /app/web/node_modules/.bin:$PATH

# 3) Copy lockfiles & install deps for best cache
COPY web/package.json web/pnpm-lock.yaml ./
RUN pnpm install --frozen-lockfile

# 4) Copy source code
COPY web/ .

# 5) Copy environment file into the project root
COPY .env.local /app/web/.env.local

EXPOSE 3000

# 6) Start the Next.js dev server
CMD ["pnpm", "exec", "next", "dev"]
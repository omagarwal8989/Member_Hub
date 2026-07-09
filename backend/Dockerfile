# Using node:20-slim (Debian-based), NOT alpine — Prisma's query engine
# binaries are notoriously finicky on Alpine's musl libc and often need
# extra binaryTarget configuration to work. Debian avoids that entirely.
FROM node:20-slim

# Install a system Chromium instead of letting Puppeteer download its own
# copy during npm install. This is faster, keeps the image smaller, and
# avoids flaky large downloads happening mid-build.
RUN apt-get update && apt-get install -y --no-install-recommends \
    chromium \
    && rm -rf /var/lib/apt/lists/*

ENV PUPPETEER_SKIP_DOWNLOAD=true
ENV PUPPETEER_EXECUTABLE_PATH=/usr/bin/chromium

WORKDIR /app

# Install dependencies first (separate layer so Docker can cache this step
# and skip reinstalling everything just because you changed a route file)
COPY package*.json ./
RUN npm install --omit=dev

# Copy the Prisma schema and generate the client INSIDE the container.
# This is important: the client must be generated for Linux (the
# container's OS), not copied over from your Windows dev machine, or the
# native query engine binary won't match and Prisma will crash at runtime.
COPY prisma ./prisma
RUN npx prisma generate

# Now copy the rest of the source
COPY . .

EXPOSE 5000

CMD ["node", "src/server.js"]
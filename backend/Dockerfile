FROM node:20-alpine

# Create a non-root user for security
RUN addgroup -S hustlehub && adduser -S hustlehub -G hustlehub

WORKDIR /app

# Copy dependency manifests first (layer caching)
COPY package*.json ./

# Install production dependencies only
RUN npm ci --only=production

# Copy source code
COPY . .

# Change ownership to the non-root user
RUN chown -R hustlehub:hustlehub /app

USER hustlehub

# Expose the HTTPS port
EXPOSE 5000

# Healthcheck – verifies the container is serving the API
HEALTHCHECK --interval=30s --timeout=10s --start-period=5s --retries=3 \
  CMD node -e "const https = require('https'); const opts = { hostname: 'localhost', port: 5000, path: '/api/health', method: 'GET', rejectUnauthorized: false }; const req = https.request(opts, r => process.exit(r.statusCode === 200 ? 0 : 1)); req.on('error', () => process.exit(1)); req.end();"

CMD ["node", "server.js"]

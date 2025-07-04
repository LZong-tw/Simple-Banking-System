FROM node:18-alpine

WORKDIR /app

# Copy package files and scripts needed for preinstall
COPY package*.json ./
COPY scripts/ ./scripts/

# Install dependencies
RUN npm ci

# Copy source code and tests
COPY src/ ./src/
COPY tests/ ./tests/

# Create logs directory with proper permissions
RUN mkdir -p /app/logs

# Create non-root user
RUN addgroup -g 1001 -S nodejs
RUN adduser -S banking -u 1001

# Change ownership
RUN chown -R banking:nodejs /app
USER banking

# Expose port
EXPOSE 3000

# Health check
HEALTHCHECK --interval=30s --timeout=3s --start-period=5s --retries=3 \
  CMD node -e "require('http').get('http://localhost:3000/health', (res) => { process.exit(res.statusCode === 200 ? 0 : 1) })"

# Start the application
CMD ["npm", "run", "dev"]
# Backend Dockerfile for Node.js Server
FROM node:20-alpine

# Set working directory
WORKDIR /app

# Install dumb-init for signal handling
RUN apk add --no-cache dumb-init

# Copy package files
COPY package*.json ./

# Install dependencies
RUN npm ci --omit=dev && npm cache clean --force

# Copy source code
COPY . .

# Create non-root user for security
RUN addgroup -g 1001 -S nodejs && \
    adduser -S nodejs -u 1001 -G nodejs

# Change ownership of the working directory
RUN chown -R nodejs:nodejs /app
USER nodejs

# Expose port (updated to match k8s config)
EXPOSE 5000

# Health check
HEALTHCHECK --interval=30s --timeout=3s --start-period=5s --retries=3 \
    CMD node -e "require('http').get('http://localhost:5000/health', (res) => { \
        if (res.statusCode === 200) { \
            process.exit(0); \
        } else { \
            process.exit(1); \
        } \
    }).on('error', () => process.exit(1));"

# Use dumb-init to handle signals properly
ENTRYPOINT ["dumb-init", "--"]
CMD ["node", "server.js"]
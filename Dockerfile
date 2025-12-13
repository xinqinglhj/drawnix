# Stage 1: Build the frontend
FROM node:20 AS builder
WORKDIR /repo
COPY . .
# Install dependencies including devDependencies for building
RUN npm install
# Build the frontend application
RUN npm run build:web

# Stage 2: Setup the production environment
FROM node:20
WORKDIR /app

# Install production dependencies for the server
COPY apps/server/package.json .
RUN npm install --production

# Copy server source code ensuring directory structure matches path.join expectations
# main.js expects ../../../dist/apps/web relative to apps/server/src
COPY apps/server/src ./apps/server/src

# Copy built frontend assets from builder stage
COPY --from=builder /repo/dist ./dist

# Expose the port the app runs on
EXPOSE 3000

# Start the server
CMD ["node", "apps/server/src/main.js"]
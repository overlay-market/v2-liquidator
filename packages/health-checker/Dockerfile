FROM node:18-alpine

# Create app directory
WORKDIR /usr/src/app

# Copy the pnpm files
COPY pnpm-lock.yaml ./
COPY pnpm-workspace.yaml ./
COPY packages/health-checker/package.json ./packages/health-checker/

# Install global dependencies and pnpm dependencies
RUN npm install -g pnpm
RUN pnpm install --recursive --filter "health-checker" --frozen-lockfile

# Copy the source code
COPY packages/health-checker/ ./packages/health-checker/

# Compile TypeScript to JavaScript
WORKDIR /usr/src/app/packages/health-checker
RUN pnpm run build

# Exposure the port that the application will use
EXPOSE 3000

# Command to run the compiled application
CMD ["node", "dist/server.js"]

FROM node:18-bullseye-slim

# Create directory to install Foundry
WORKDIR /root

# Install Foundry dependencies
RUN apt-get update && apt-get install -y \
    bash \
    curl \
    git \
    && rm -rf /var/lib/apt/lists/*

# Install Foundry
RUN curl -L https://foundry.paradigm.xyz | bash

# Run Foundryup and ensure it is added to PATH
RUN /root/.foundry/bin/foundryup

# Add Foundry to PATH
ENV PATH="/root/.foundry/bin:$PATH"

# Validate Foundry installation
RUN forge --version
RUN anvil --version

# Create app directory
WORKDIR /usr/src/app

# Copy the pnpm files
COPY pnpm-lock.yaml ./
COPY pnpm-workspace.yaml ./
COPY packages/fork/package.json ./packages/fork/

# Install global dependencies and pnpm dependencies
RUN npm install -g pnpm
RUN pnpm install --filter "fork" --frozen-lockfile

# Copy the source code
COPY packages/fork/ ./packages/fork/

# Compile TypeScript to JavaScript
WORKDIR /usr/src/app/packages/fork
RUN pnpm run build

# Exposure the port that the application will use
EXPOSE 8545

# Command to run the compiled application
CMD ["node", "dist/index.js"]

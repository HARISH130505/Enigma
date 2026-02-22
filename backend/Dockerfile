FROM node:20-bullseye

# Install Python and Java (JDK)
# We need these for the compiler route
RUN apt-get update && \
    apt-get install -y python3 default-jdk && \
    # Create symlink for 'python' to point to 'python3' if needed
    ln -s /usr/bin/python3 /usr/bin/python || true && \
    apt-get clean && \
    rm -rf /var/lib/apt/lists/*

WORKDIR /app

# Copy package files
COPY package*.json ./

# Install ALL dependencies (including devDependencies required for build, ignoring NODE_ENV locally)
RUN npm install --include=dev

# Copy source code
COPY . .

# Build TypeScript
RUN npm run build

# Expose port
EXPOSE 3001

# Start the application
CMD ["npm", "start"]

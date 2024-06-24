# Use a base image with the required GLIBC version
FROM ubuntu:20.04

# Install dependencies including git and python
RUN apt-get update && apt-get install -y \
    curl \
    build-essential \
    wget \
    ca-certificates \
    libssl-dev \
    git \
    python3 \
    python3-distutils \
    && curl -fsSL https://deb.nodesource.com/setup_16.x | bash - \
    && apt-get install -y nodejs \
    && apt-get clean \
    && rm -rf /var/lib/apt/lists/*

# Install Foundry and Anvil
RUN curl -L https://foundry.paradigm.xyz | bash \
    && ~/.foundry/bin/foundryup

# Install Avalanche CLI
RUN curl -sSfL https://raw.githubusercontent.com/ava-labs/avalanche-cli/main/scripts/install.sh | sh -s

# Set up environment variables for Foundry and Avalanche CLI
ENV PATH="/root/.foundry/bin:/root/bin:${PATH}"

# Create and change to the app directory inside the container
WORKDIR /usr/src/app

# Copy package.json and package-lock.json
COPY package*.json ./

# Install Node.js dependencies
RUN npm install

# Copy the rest of the application code
COPY . .

# The command to keep the container running and allow for command execution
CMD ["bash"]

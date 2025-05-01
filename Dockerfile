# Use Node.js 18 on Alpine Linux for a smaller image size
FROM node:18-alpine

# Set working directory
WORKDIR /usr/src/app

# Install dependencies
COPY package*.json ./
RUN npm install --production

# Copy the rest of the source code
COPY . .

# Start the bot
CMD ["node", "src/index.js"]

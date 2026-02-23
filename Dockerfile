# Use Node.js LTS
FROM node:18-slim

# Set working directory
WORKDIR /app

# Copy package files
COPY package*.json ./

# Install dependencies
RUN npm install

# Copy application code
COPY . .

# Set environment variables
ENV NODE_ENV=production
ENV PORT=7860

# Expose the port (Hugging Face default is 7860)
EXPOSE 7860

# Start the application
CMD ["npm", "start"]

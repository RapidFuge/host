# Use an official Node.js runtime as a parent image
FROM node:lts-alpine AS builder

# Set the working directory
WORKDIR /app

# Copy package.json and package-lock.json
COPY package*.json ./

# Install dependencies
RUN npm install

# Copy the rest of your application code
COPY . .

# Build the application
RUN npm run build

# Use the same Node.js image for serving
FROM node:lts-alpine

# Set the working directory
WORKDIR /app

# Copy the build artifacts from the previous stage
COPY --from=builder /app ./

# Expose the port on which the app runs
EXPOSE 3000

# Start the Next.js application
CMD ["npm", "start"]
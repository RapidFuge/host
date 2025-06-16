# 1. Builder Stage: Install dependencies and build the app
FROM node:lts-alpine AS builder
WORKDIR /app

# Copy package files and install dependencies
COPY package.json ./
RUN npm i

# Copy the rest of the source code
COPY . .

# Build the Next.js application
RUN npm run build

# ---

# 2. Runner Stage: Create the final, minimal image
FROM node:lts-alpine AS runner
WORKDIR /app

# Set the environment to production
# ENV NODE_ENV=production
# Disable telemetry
ENV NEXT_TELEMETRY_DISABLED=1

# Copy the standalone output from the builder stage
COPY --from=builder /app/.next/standalone ./

# Copy the compiled static assets and the public folder
COPY --from=builder /app/.next/static ./.next/static
COPY --from=builder /app/public ./public

# Expose the port the app runs on (default is 3000)
EXPOSE 3000

# Set the host to 0.0.0.0 to be accessible from outside the container
ENV PORT=3000
ENV HOSTNAME=0.0.0.0

# Start the server. The entrypoint is server.js in the standalone output.
CMD ["node", "server.js"]
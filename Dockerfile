# 1. Builder Stage: Install dependencies and build the app
FROM node:lts-slim AS builder
WORKDIR /app

# Copy package files and install dependencies
COPY package.json ./
RUN npm i

# Copy the rest of the source code
COPY . .

ARG GITHUB_ACTIONS
ARG GITHUB_RUN_NUMBER
ARG GITHUB_WORKFLOW
ARG GITHUB_SHA
ARG CI

ENV GITHUB_ACTIONS=$GITHUB_ACTIONS
ENV GITHUB_RUN_NUMBER=$GITHUB_RUN_NUMBER
ENV GITHUB_WORKFLOW=$GITHUB_WORKFLOW
ENV GITHUB_SHA=$GITHUB_SHA
ENV CI=$CI
ENV DOCKER=true
ENV CONTAINER=true
ENV NODE_ENV=production

# Build the Next.js application
RUN npm run build

# 2. Runner Stage: Create the final, minimal image
FROM gcr.io/distroless/nodejs20
WORKDIR /app

# Copy app from builder stage
COPY --from=builder /app/.next/standalone ./
COPY --from=builder /app/.next/static ./.next/static
COPY --from=builder /app/public ./public

# Expose the port used by your app
EXPOSE 3000

ENV PORT=3000 
ENV HOSTNAME=0.0.0.0

# Start the server (Next.js standalone output includes server.js)
CMD ["server.js"]
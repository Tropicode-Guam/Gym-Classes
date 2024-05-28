# syntax=docker/dockerfile:1

# Comments are provided throughout this file to help you get started.
# If you need more help, visit the Dockerfile reference guide at
# https://docs.docker.com/engine/reference/builder/

ARG NODE_VERSION=21.2.0

FROM node:${NODE_VERSION}-alpine

# Use production node environment by default.
ENV NODE_ENV production


WORKDIR /usr/src/app

# Download dependencies as a separate step to take advantage of Docker's caching.
# Leverage a cache mount to /root/.npm to speed up subsequent builds.
# Leverage a bind mounts to package.json and package-lock.json to avoid having to copy them into
# into this layer.
RUN --mount=type=bind,source=package.json,target=package.json \
    --mount=type=bind,source=package-lock.json,target=package-lock.json \
    --mount=type=cache,target=/root/.npm \
    npm ci --omit=dev

# Copy the rest of the source files into the image.
# test dockerignore
COPY . .

# can't import from outside src folder, so putting it in node_modules instead
RUN ln -s /usr/src/app/settings /usr/src/app/node_modules/settings

# set env variable for build
ARG HOST
ARG API_BASE
ARG PUBLIC_URL
ENV PUBLIC_URL=${PUBLIC_URL}

# build
RUN REACT_APP_API=$(if test "${HOST}" = "localhost"; \
    then echo "http://${HOST}${API_BASE}"; \
    else echo "https://${HOST}${API_BASE}"; fi) \
    npm run build

# Run the application as a non-root user.
USER node

# Expose the port that the application listens on.
EXPOSE 3000

# Run the application.
CMD node server.js

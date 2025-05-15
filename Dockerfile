# Stage 1: Build the frontend assets
FROM node:16 AS frontend-build
WORKDIR /app/frontend

# Install frontend dependencies
COPY frontend/package*.json ./
RUN npm install

# Build the frontend (Vite will output the static files, default folder is "dist")
COPY frontend/ ./
RUN npm run build

# Stage 2: Setup the backend and integrate the built frontend assets
FROM node:16 AS backend-build
WORKDIR /app/backend

# Install backend dependencies
COPY backend/package*.json ./
RUN npm install

# Copy the backend source code
COPY backend/ ./

# Copy the built static frontend assets into a folder your backend serves.
COPY --from=frontend-build /app/frontend/dist ./public

# Expose the port where your backend server listens (e.g., 5000)
EXPOSE 5000

# Start the backend server
CMD ["node", "server.js"]

# Start the frontend server
CMD ["npm", "run", "start"]
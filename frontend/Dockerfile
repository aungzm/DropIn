FROM node:20-alpine AS builder

WORKDIR /app

# Copy package files and install dependencies
COPY package*.json ./
RUN npm install

# Copy the remaining files and build the production bundle
COPY . .
RUN npm run build

# --- Serve Stage ---
FROM nginx:stable-alpine

# Copy the built files from the builder stage to the nginx web root
COPY --from=builder /app/dist /usr/share/nginx/html

# Expose the port (mapped to VITE_FRONTEND_PORT at runtime)
ENV VITE_FRONTEND_PORT=5173
EXPOSE ${VITE_FRONTEND_PORT}

CMD ["nginx", "-g", "daemon off;"]
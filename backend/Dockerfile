# Use an official Node runtime as a parent image
FROM node:20-alpine

# Set the working directory
WORKDIR /app

# Copy package files and install dependencies
COPY package*.json ./
RUN npm install

# Copy the rest of your backend files
COPY . .

ENV BACKEND_PORT=5000
EXPOSE ${BACKEND_PORT}

# Start the backend
CMD ["npm", "start"]

import express, { Application } from "express";
import dotenv from "dotenv";
import morgan from "morgan";
import os from "os";
import { PrismaClient } from "@prisma/client";
import userRoutes from "./routes/userRoutes";
import authRoutes from "./routes/authRoutes";
import fileRoutes from "./routes/fileRoutes";
import spaceRoutes from "./routes/spaceRoutes";
import shareRoutes from "./routes/shareRoutes";
import adminRoutes from "./routes/adminRoutes";
import cors from "cors";

// Load environment variables from the project root
dotenv.config();

// Initialize Prisma Client
const prisma = new PrismaClient();

// Create Express app
const app: Application = express();

// Middleware
app.use(express.json());
app.use(morgan("dev"));


// Enable CORS
app.use(
  cors({
    origin: process.env.FRONTEND_URL || "http://localhost:5173", 
    methods: ["GET", "POST", "PUT", "DELETE", "PATCH","OPTIONS"], // Allowed HTTP methods
    allowedHeaders: ["Content-Type", "Authorization"], // Allowed headers
    credentials: true, // Allow cookies and credentials
  })
);


// Defined routes
app.use("/api/users", userRoutes);
app.use("/api/admins", adminRoutes)
app.use("/api/auth", authRoutes);
app.use("/api/files", fileRoutes);
app.use("/api/spaces", spaceRoutes);
app.use("/api/shares", shareRoutes);



// Function to get the local IP address
const getLocalIpAddress = (): string => {
  const networkInterfaces = os.networkInterfaces();
  for (const interfaceName in networkInterfaces) {
    const interfaces = networkInterfaces[interfaceName] || [];
    for (const iface of interfaces) {
      if (iface.family === "IPv4" && !iface.internal) {
        return iface.address;
      }
    }
  }
  return "IP not found";
};

// Async function to start the server
const startServer = async () => {
  try {
    console.log("Starting server...");

    // Test database connection
    await prisma.$connect();
    console.log("Connected to the database via Prisma");

    const PORT = process.env.PORT || 5000;
    app.listen(PORT, () => {
      const ipAddress = getLocalIpAddress();
      console.log(`Server running on port ${PORT}`);
      console.log(`Your local IP address is: ${ipAddress}`);
    });
  } catch (error) {
    console.error("Error starting the server:", error);
    process.exit(1); // Exit the application if there's an error
  }
};

// Start the server
startServer();
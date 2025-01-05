import { Request } from "express";
import jwt from "jsonwebtoken";
import dotenv from "dotenv";

// Load environment variables
dotenv.config();

// Helper function to get userId from refreshToken
const getUserIdFromToken = (req: Request): string | null => {
    const token = req.headers.authorization?.split(" ")[1]; // Assuming "Bearer <token>"
    if (!token) return null;

    try {
        const decoded = jwt.verify(token, process.env.REFRESH_TOKEN_SECRET as string) as { userId: string };
        return decoded.userId;
    } catch (error) {
        console.error("Invalid token:", error);
        return null;
    }
};

export default getUserIdFromToken;
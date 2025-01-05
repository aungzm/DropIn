import { Request, Response, NextFunction } from "express";
import jwt from "jsonwebtoken";
import dotenv from "dotenv";
import path from "path";

const envPath = path.resolve(__dirname, "../../.env");
dotenv.config({ path: envPath });

// Extend the Request interface to include the user property
declare module "express-serve-static-core" {
    interface Request {
        user?: { id: string; role: string };
    }
}

// Load both secrets from environment variables
const ACCESS_TOKEN_SECRET = process.env.ACCESS_TOKEN_SECRET as string;
const REFRESH_TOKEN_SECRET = process.env.REFRESH_TOKEN_SECRET as string;

// Middleware to authenticate access tokens
export const authenticateToken = (req: Request, res: Response, next: NextFunction) => {
    const token = req.headers.authorization?.split(" ")[1]; // Assuming "Bearer <token>"
    if (!token) {
        return res.status(401).json({ error: "Unauthorized: Missing token" });
    }

    try {
        const decoded = jwt.verify(token, ACCESS_TOKEN_SECRET) as { userId: string; role: string };
        req.user = { id: decoded.userId, role: decoded.role }; // Attach user info to the request
        next(); 
    } catch (error) {
        console.error("Invalid token:", error);
        res.status(401).json({ error: "Unauthorized: Invalid token" });
    }
};

// Middleware to allow authenticated users or guests
export const allowAuthenticatedOrGuest = (req: Request, res: Response, next: NextFunction) => {
    const token = req.headers.authorization?.split(" ")[1]; // Assuming "Bearer <token>"
    
    if (!token) {
        // No token provided, proceed as guest
        req.user = undefined;
        return next();
    }

    try {
        const decoded = jwt.verify(token, ACCESS_TOKEN_SECRET) as { userId: string; role: string };
        req.user = { id: decoded.userId, role: decoded.role }; // Attach user info to the request
    } catch (error) {
        console.warn("Invalid token, proceeding as guest:", error);
        req.user = undefined; // Treat as guest if the token is invalid
    }

    next(); 
};

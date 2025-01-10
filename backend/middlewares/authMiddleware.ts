import { Request, Response, NextFunction } from "express";
import { PrismaClient } from "@prisma/client";
import { validationResult } from "express-validator";
import bcrypt from "bcryptjs";

const prisma = new PrismaClient();
export const verifyFileOwnershipOrAdmin = async (req: Request, res: Response, next: NextFunction) => {
    const { id: userId, role: userRole } = req.user!; // Use user info from authenticateToken
    const { fileId } = req.params;

    try {
        // Check if the file exists
        const file = await prisma.file.findUnique({ where: { id: fileId } });
        if (!file) {
            return res.status(404).json({ error: "File not found" });
        }

        // Check if the user is the owner or an admin
        if (file.uploadedById === userId || userRole === "admin") {
            next(); // Proceed to the controller
        } else {
            return res.status(403).json({ error: "Forbidden: Insufficient permissions" });
        }
    } catch (error) {
        console.error("Error verifying file ownership:", error);
        res.status(500).json({ error: "Internal server error" });
    }
};

export const verifySpaceOwnershipOrAdmin = async (req: Request, res: Response, next: NextFunction) => {
    const { id: userId, role: userRole } = req.user!; // Use user info from authenticateToken
    const { spaceId } = req.params;
    if (!userId || !userRole) {
        return res.status(403).json({ error: "Forbidden userId or userRole is missing" });
    }
    
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
        res.status(400).json({ errors: errors.array() });
        return;
    }

    try {
        // Check if the space exists
        const space = await prisma.space.findFirst({ where: { id: spaceId } });
        if (!space) {
            return res.status(404).json({ error: "Space not found" });
        }

        // Check if the user is the owner or an admin
        if (space.createdById === userId || userRole === "admin") {
            next(); // Proceed to the controller
        } else {
            return res.status(403).json({ error: "Forbidden: Insufficient permissions" });
        }
    } catch (error) {
        console.error("Error verifying space ownership:", error);
        res.status(500).json({ error: "Internal server error" });
    }
};


export const verifyAccountOwnershipOrAdmin = async (req: Request, res: Response, next: NextFunction) => {
    const { id: userId, role: userRole } = req.user!; // Use user info from authenticateToken
    if (!userId || !userRole) {
        return res.status(403).json({ error: "Forbidden userId or userRole is missing" });
    }
    
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
        res.status(400).json({ errors: errors.array() });
        return;
    }

    try {
        console.log("Param userId:", userId);
        const user = await prisma.user.findFirst({ where: { id: userId } });
        if (!user) {
            return res.status(404).json({ error: "User not found" });
        }
        console.log("Database userId:", user.id);
        console.log(user.id === userId);
        // Check if the user is the owner or an admin
        if (user.id === userId || userRole === "admin") {
            next(); // Proceed to the controller
        } else {
            return res.status(403).json({ error: "Forbidden: Insufficient permissions" });
        }
    } catch (error) {
        console.error("Error verifying account ownership:", error);
        res.status(500).json({ error: "Internal server error" });
    }
};

export const verifyAccountIsAdmin = async (req: Request, res: Response, next: NextFunction) => {
    const { role: userRole } = req.user!; // Use user info from authenticateToken
    if (!userRole) {
        return res.status(403).json({ error: "Forbidden userRole is missing" });
    }
    
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
        res.status(400).json({ errors: errors.array() });
        return;
    }

    if (userRole === "admin") {
        next(); // Proceed to the controller
    } else {
        return res.status(403).json({ error: "Forbidden: Insufficient permissions" });
    }
};

export const notDemotingSelf = async (req: Request, res: Response, next: NextFunction) => {
    const { id: userId, role: userRole } = req.user!; // Use user info from authenticateToken
    const { userId: targetUserId } = req.params;
    if (!userId) {
        return res.status(403).json({ error: "Forbidden userId is missing" });
    }
    
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
        res.status(400).json({ errors: errors.array() });
        return;
    }

    if (userId === targetUserId) {
        return res.status(403).json({ error: "Forbidden: Cannot demote self" });
    }
    next();
}


export const noteDeletingSelf = async (req: Request, res: Response, next: NextFunction) => {
    const { id: userId, role: userRole } = req.user!; // Use user info from authenticateToken
    const { userId: targetUserId } = req.params;
    if (!userId) {
        return res.status(403).json({ error: "Forbidden userId is missing" });
    }
    
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
        res.status(400).json({ errors: errors.array() });
        return;
    }

    if (userId === targetUserId) {
        return res.status(403).json({ error: "Forbidden: Cannot delete self" });
    }
    next();
};
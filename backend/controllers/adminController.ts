import { Request, Response } from "express";
import { validationResult } from "express-validator";
import { PrismaClient } from "@prisma/client";
import fs from "fs/promises";
import path from "path";

const prisma = new PrismaClient();

// Controller to retrieve all users
export const getAllUsers = async (req: Request, res: Response): Promise<void> => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
        res.status(400).json({ errors: errors.array() });
        return;
    }

    try {
        // Retrieve all users
        const users = await prisma.user.findMany({
            include: {
                profile: true, // Include profile picture details
            },
        });
        res.status(200).json({ message: "All users retrieved successfully!", users });
    } catch (error) {
        console.error(error);
        res.status(500).json({ error: "Failed to retrieve users" });
    }
};

// Controller to delete a user
export const deleteUser = async (req: Request, res: Response): Promise<void> => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
        res.status(400).json({ errors: errors.array() });
        return;
    }

    const { userId } = req.params;

    try {
            // Fetch all files uploaded by the user
            const files = await prisma.file.findMany({ where: { uploadedById: userId } });
    
            // Delete all associated physical files for user's files
            for (const file of files) {
                try {
                    await fs.unlink(file.storageUrl); // Delete physical file
                } catch (err) {
                    console.error(`Error deleting file ${file.storageUrl}:`, err);
                }
            }
    
            // Delete associated FileLinks
            await prisma.fileLink.deleteMany({ where: { fileId: { in: files.map((file: { id: string }) => file.id) } } });
    
            // Delete user's files
            await prisma.file.deleteMany({ where: { uploadedById: userId } });
    
            // Fetch user's profile picture
            const profilePic = await prisma.profilePic.findUnique({ where: { userId } });
    
            if (profilePic) {
                try {
                    await fs.unlink(profilePic.storageUrl); // Delete physical profile picture
                } catch (err) {
                    console.error(`Error deleting profile picture ${profilePic.storageUrl}:`, err);
                }
                // Delete the profile picture record
                await prisma.profilePic.delete({ where: { userId } });
            }
    
            // Fetch all spaces created by the user
            const spaces = await prisma.space.findMany({ where: { createdById: userId } });
            await prisma.spaceLink.deleteMany({ where: { spaceId: { in: spaces.map((space: { id: string }) => space.id) } } }); // Delete space links
            await prisma.space.deleteMany({ where: { createdById: userId } }); // Delete user's spaces
            await prisma.user.delete({ where: { id: userId } }); // Finally, delete the user
            res.status(200).json({ message: "Account and related data deleted successfully!" });
        } catch (error) {
            console.error("Error deleting account:", error);
            res.status(500).json({ error: "Failed to delete account" });
        }
}

export const promoteUser = async (req: Request, res: Response): Promise<void> => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
        res.status(400).json({ errors: errors.array() });
        return;
    }

    const { userId } = req.params;

    try {
        await prisma.user.update({
            where: { id: userId, role: "user" },
            data: {
                role: "admin",
            },
        });
        res.status(200).json({ message: "User promoted to admin successfully!" });
    } catch (error) {
        console.error("Error promoting user:", error);
        res.status(500).json({ error: "Failed to promote user" });
    }
};


export const demoteUser = async (req: Request, res: Response): Promise<void> => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
        res.status(400).json({ errors: errors.array() });
        return;
    }

    const { userId } = req.params;
    try {
        await prisma.user.update({
            where: { id: userId, role: "admin" },
            data: {
                role: "user",
            },
        });
        res.status(200).json({ message: "Admin demoted to user successfully!" });
    } catch (error) {
        console.error("Error demoting admin:", error);
        res.status(500).json({ error: "Failed to demote admin" });
    }
};

export const getUserProfilePic = async (req: Request, res: Response): Promise<void> => {
    const { userId } = req.params; 
    try {
        // Fetch profile picture metadata from the database
        const profilePic = await prisma.profilePic.findUnique({ where: { userId } });
        if (!profilePic) {
            res.status(404).json({ error: "Profile picture not found" });
            return;
        }

        // Resolve the full file path
        const filePath = path.join(__dirname, "../../", profilePic.storageUrl);

        // Check if the file exists
        try {
            await fs.access(filePath); // Throws if the file does not exist
        } catch {
            res.status(404).json({ error: "Profile picture file not found on server" });
            return;
        }

        // Send the file as a response
        res.sendFile(filePath, (err) => {
            if (err) {
                console.error("Error sending file:", err);
                res.status(500).json({ error: "Internal server error while sending the file" });
            }
        });
    } catch (error) {
        console.error("Error retrieving profile picture:", error);
        res.status(500).json({ error: "Internal server error" });
    }
};

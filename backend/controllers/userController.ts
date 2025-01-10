import { Request, Response } from "express";
import { validationResult } from "express-validator";
import { PrismaClient } from "@prisma/client";
import fs from "fs/promises";
import path from "path";
import bcrypt from "bcryptjs";
import { fileExists } from "../utils/fileHelper";

const prisma = new PrismaClient();

// Helper function to convert storageUrl to absolute filesystem path
const getFilePath = (storageUrl: string): string => {
    // Define the base uploads directory relative to this file
    const uploadsDir = path.join(__dirname, '../../uploads');
    
    // Remove leading '/' if present to prevent path.join from ignoring uploadsDir
    const relativePath = storageUrl.startsWith('/') ? storageUrl.slice(1) : storageUrl;
    
    // Construct the absolute path
    return path.join(uploadsDir, relativePath);
};

// Controller for deleting an account
export const deleteAccount = async (req: Request, res: Response): Promise<void> => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
        res.status(400).json({ errors: errors.array() });
        return;
    }

    const { id: userId } = req.user!;

    try {
        // Fetch all files uploaded by the user
        const userFiles = await prisma.file.findMany({ where: { uploadedById: userId } });

        // Delete all associated physical files for user's files
        for (const file of userFiles) {
            const filePath = getFilePath(file.storageUrl);
            try {
                await fs.unlink(filePath);
            } catch {
                // Log the error and continue
                console.error(`Failed to delete file: ${filePath}`);
            }
        }

        // Delete associated FileLinks for user's files
        await prisma.fileLink.deleteMany({ where: { fileId: { in: userFiles.map(file => file.id) } } });

        // Delete user's files from the database
        await prisma.file.deleteMany({ where: { uploadedById: userId } });

        // Fetch and delete the user's profile picture
        const profilePic = await prisma.profilePic.findUnique({ where: { userId } });
        if (profilePic) {
            const profilePicPath = getFilePath(profilePic.storageUrl);
            try {
                await fs.unlink(profilePicPath);
            } catch {
                console.error(`Failed to delete profile picture: ${profilePicPath}`);
            }
            // Delete the profile picture record from the database
            await prisma.profilePic.delete({ where: { userId } });
        }

        // Fetch all spaces created by the user
        const userSpaces = await prisma.space.findMany({ where: { createdById: userId } });

        if (userSpaces.length > 0) {
            const spaceIds = userSpaces.map(space => space.id);

            // Fetch all files within these spaces
            const spaceFiles = await prisma.file.findMany({ where: { spaceId: { in: spaceIds } } });

            // Delete physical files within spaces
            for (const file of spaceFiles) {
                const filePath = getFilePath(file.storageUrl);
                try {
                    await fs.unlink(filePath);
                } catch {
                    console.error(`Failed to delete file in space: ${filePath}`);
                }
            }

            // Delete associated FileLinks for space files
            await prisma.fileLink.deleteMany({ where: { fileId: { in: spaceFiles.map(file => file.id) } } });

            // Delete space files from the database
            await prisma.file.deleteMany({ where: { spaceId: { in: spaceIds } } });

            // Delete associated SpaceLinks
            await prisma.spaceLink.deleteMany({ where: { spaceId: { in: spaceIds } } });

            // Delete the spaces from the database
            await prisma.space.deleteMany({ where: { createdById: userId } });

            // Delete space directories
            for (const space of userSpaces) {
                const spaceDir = path.join(__dirname, '../../uploads', space.id);
                try {
                    await fs.rmdir(spaceDir);
                } catch {
                    console.error(`Failed to delete space directory: ${spaceDir}`);
                }
            }
        }

        // Finally, delete the user from the database
        await prisma.user.delete({ where: { id: userId } });

        res.status(200).json({ message: "Account and related data deleted successfully!" });
    } catch (error) {
        console.error("Error deleting account:", error);
        res.status(500).json({ error: "Failed to delete account" });
    }
};

// Controller for resetting a password
export const resetPassword = async (req: Request, res: Response): Promise<void> => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
        res.status(400).json({ errors: errors.array() });
        return;
    }
    
    const { id: userId } = req.user!;
    const { currentPassword, newPassword, repeatPassword } = req.body;

    if (newPassword !== repeatPassword) {
        res.status(400).json({ error: "Passwords do not match" });
        return;
    }
    
    try {
        const user = await prisma.user.findUnique({ where: { id: userId } });
        if (!user) {
            res.status(404).json({ error: "User not found" });
            return;
        }

        const isPasswordValid = await bcrypt.compare(currentPassword, user.password);
        if (!isPasswordValid) {
            res.status(400).json({ error: "Incorrect current password" });
            return;
        }

        const hashedPassword = await bcrypt.hash(newPassword, 10);

        await prisma.user.update({
            where: { id: userId },
            data: { password: hashedPassword },
        });

        res.status(200).json({ message: "Password reset successfully!" });
    } catch (error) {
        console.error("Error resetting password:", error);
        res.status(500).json({ error: "Failed to reset password" });
    }
};

// Controller for changing a username
export const changeUserName = async (req: Request, res: Response): Promise<void> => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
        res.status(400).json({ errors: errors.array() });
        return;
    }

    const { id: userId } = req.user!;
    const { newUsername } = req.body;

    const usernameRegex = /^[a-zA-Z0-9]+$/;
    if (!usernameRegex.test(newUsername)) {
        res.status(400).json({ error: "Username can only contain letters and numbers" });
        return;
    }


    try {
        const existingUser = await prisma.user.findFirst({ where: { username: newUsername } });
        if (existingUser) {
            res.status(400).json({ error: "Username is already taken" });
            return;
        }

        const updatedUser = await prisma.user.update({
            where: { id: userId },
            data: { username: newUsername },
        });

        res.status(200).json({ message: "Username changed successfully!", user: updatedUser });
    } catch (error) {
        console.error("Error changing username:", error);
        res.status(500).json({ error: "Failed to change username" });
    }
};

// Controller for changing a profile picture
export const changeProfilePic = async (req: Request, res: Response): Promise<void> => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
        res.status(400).json({ errors: errors.array() });
        return;
    }

    if (!req.file) {
        res.status(400).json({ error: "No file uploaded." });
        return;
    }

    const { id: userId } = req.user!;
    const fileSizeInMB = req.file.size / (1024 * 1024);
    if (fileSizeInMB > 5) {
        try {
            await fs.unlink(req.file.path);
            res.status(400).json({ error: "File size exceeds 5MB limit." });
        } catch (err) {
            console.error(`Error deleting oversized file: ${req.file.path}`, err);
        }
        return;
    }

    const fileExtension = req.file.originalname.split(".").pop()?.toLowerCase();
    if (!["jpg", "jpeg", "png"].includes(fileExtension!)) {
        try {
            await fs.unlink(req.file.path);
            res.status(400).json({ error: "Invalid file type. Only JPG, JPEG, and PNG are allowed." });
        } catch (err) {
            console.error(`Error deleting invalid file: ${req.file.path}`, err);
        }
        return;
    }

    const tempPath = req.file.path; // Temporary path where Multer saved the file
    const targetDir = path.join(__dirname, "../../profilePic/", userId);
    const targetPath = path.join(targetDir, req.file.originalname);
    const storageUrl = `/profilePic/${userId}/${req.file.originalname}`; // URL to store in DB

    try {
        // Ensure the target directory exists
        await fs.mkdir(targetDir, { recursive: true });

        // Check if an old profile pic exists
        const existingProfilePic = await prisma.profilePic.findUnique({ where: { userId } });

        if (existingProfilePic) {
            // Attempt to delete the old file from the filesystem
            try {
                await fs.unlink(path.join(__dirname, "../../", existingProfilePic.storageUrl));
            } catch (err) {
                console.error(`Error deleting old profile picture: ${existingProfilePic.storageUrl}`, err);
            }
        }

        // Move the new file to the target directory
        await fs.rename(tempPath, targetPath);

        // Update or create the database record
        if (existingProfilePic) {
            await prisma.profilePic.update({
                where: { userId },
                data: { storageUrl },
            });
        } else {
            await prisma.profilePic.create({
                data: {
                    userId,
                    storageUrl,
                },
            });
        }

        res.status(201).json({ message: "File uploaded successfully!", file: storageUrl });
    } catch (error) {
        console.error("Error during profile picture upload:", error);

        // Rollback: Ensure no file remains if the process fails
        try {
            if (await fileExists(tempPath)) {
                await fs.unlink(tempPath);
            }
            if (await fileExists(targetPath)) {
                await fs.unlink(targetPath);
            }
        } catch (err) {
            console.error("Error cleaning up after failure:", err);
        }

        res.status(500).json({ error: "Internal server error" });
    }
};

export const getProfilePic = async (req: Request, res: Response): Promise<void> => {
    const { id: userId } = req.user!; // Assuming `req.user` is populated by authentication middleware

    try {
        // Fetch profile picture metadata from the database
        const profilePic = await prisma.profilePic.findUnique({ where: { userId } });
        if (!profilePic) {
            res.status(404).json({ error: "Profile picture not found" });
            return;
        }

        // Resolve the full file path
        const filePath = path.join(__dirname, "../../", profilePic.storageUrl);
        console.log(filePath);

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


export const getAllSpaces = async (req: Request, res: Response): Promise<void> => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
        res.status(400).json({ errors: errors.array() });
        return;
    }

    const { id: userId, role: userRole } = req.user!; // Assuming `req.user` is populated by the authentication middleware

    try {
        let spaces;

        if (userRole === "admin") {
            // Retrieve all spaces for admin
            spaces = await prisma.space.findMany({
                include: {
                    createdBy: {
                        select: { id: true, username: true }, // Include creator's basic details
                    },
                },
            });
        } else {
            // Retrieve only spaces belonging to the user
            spaces = await prisma.space.findMany({
                where: { createdById: userId },
                include: {
                    createdBy: {
                        select: { username: true }, // Include creator's basic details
                    },
                },
            });
        }

        res.status(200).json({ message: "Spaces retrieved successfully!", spaces });
    } catch (error) {
        console.error("Error retrieving spaces:", error);
        res.status(500).json({ error: "Failed to retrieve spaces" });
    }
};


export const getUserInfo = async (req: Request, res: Response): Promise<void> => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
        res.status(400).json({ errors: errors.array() });
        return;
    }

    const { id: userId } = req.user!; // Assuming `req.user` is populated by authentication middleware

    try {
        // Retrieve user information
        const user = await prisma.user.findUnique({
            where: { id: userId },
            select: {
                id: true,
                username: true,
                email: true,
                role: true,
            },
        });

        if (!user) {
            res.status(404).json({ error: "User not found" });
            return;
        }

        res.status(200).json({ message: "User info retrieved successfully!", user });
    } catch (error) {
        console.error("Error retrieving user info:", error);
        res.status(500).json({ error: "Internal server error" });
    }
};
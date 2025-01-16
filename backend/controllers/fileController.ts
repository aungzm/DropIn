import { Request, Response } from "express";
import { validationResult } from "express-validator";
import { PrismaClient } from "@prisma/client";
import fs from "fs/promises"
import bcrypt from "bcryptjs";
import path from "path";
import { fileExists } from "../utils/fileHelper";
import { generateShareSecret } from "../utils/shareHelper";


const prisma = new PrismaClient();


// Controller for uploading a file
export const fileUpload = async (req: Request, res: Response): Promise<void> => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
        res.status(400).json({ errors: errors.array() });
        return;
    }

    if (!req.user) {
        res.status(401).json({ error: "Unauthorized: Missing or invalid token" });
        return;
    }

    if (!req.file) {
        res.status(400).json({ error: "No file uploaded." });
        return;
    }

    const { id: userId } = req.user; 
    const { spaceId } = req.body; 
    const tempPath = req.file.path; // Temporary path where Multer saved the file
    const targetDir = path.join(__dirname, '../../uploads', spaceId);
    const targetPath = path.join(targetDir, req.file.originalname);
    const storageUrl = `/uploads/${spaceId}/${req.file.originalname}`; 

    try {
        // Ensure the target directory exists
        await fs.mkdir(targetDir, { recursive: true });

        // Move the file from tempPath to targetPath
        await fs.rename(tempPath, targetPath);

        // Save file metadata to the database
        const file = await prisma.file.create({
            data: {
                name: req.file.originalname,
                uploadedById: userId,
                spaceId: spaceId,
                storageUrl,
            },
        });

        const spaceLink = await prisma.spaceLink.findFirst({ where: { spaceId } });

        if (spaceLink){ // If the space is shared, create a file link
            console.log("Creating file link for shared space");
            await prisma.fileLink.create({
                data: {
                    fileId: file.id,
                    spaceLinkId: spaceLink.id,
                    shareSecret: generateShareSecret(),
                },
            });
        }

        res.status(201).json({ message: "File uploaded successfully!", file });
    } catch (error) {
        console.error("Error uploading file:", error);
        // Attempt to remove the file if it exists
        if (await fileExists(tempPath)) {
            await fs.unlink(tempPath);
        }
        res.status(500).json({ error: "Internal server error" });
    }
};


// Controller for deleting a file
export const fileDelete = async (req: Request, res: Response): Promise<void> => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
        res.status(400).json({ errors: errors.array() });
        return;
    }

    if (!req.user) {
        res.status(401).json({ error: "Unauthorized: Missing or invalid token" });
        return;
    }

    const { id: userId, role: userRole } = req.user; // User ID and role from authentication middleware
    const { fileId } = req.params;

    try {
        // Fetch the file from the database
        const file = await prisma.file.findUnique({ where: { id: fileId } });
        if (!file) {
            res.status(404).json({ error: "File not found" });
            return;
        }

        // Check if the user owns the file or is an admin
        if (file.uploadedById !== userId && userRole !== "admin") {
            res.status(403).json({ error: "Forbidden: You do not have permission to delete this file" });
            return;
        }

        // Delete the physical file
        try {
            await fs.unlink(file.storageUrl);
        } catch (err) {
            console.error(`Error deleting file: ${file.storageUrl}`, err);
        }

        // Delete associated FileLink records
        await prisma.fileLink.deleteMany({ where: { fileId } });

        // Delete the file record from the database
        await prisma.file.delete({ where: { id: fileId } });

        res.status(200).json({ message: "File deleted successfully!" });
    } catch (error) {
        console.error("Error deleting file:", error);
        res.status(500).json({ error: "Internal server error" });
    }
};

// Controller for renaming a file
export const fileRename = async (req: Request, res: Response): Promise<void> => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
        res.status(400).json({ errors: errors.array() });
        return;
    }

    if (!req.user) {
        res.status(401).json({ error: "Unauthorized: Missing or invalid token" });
        return;
    }

    const { id: userId, role: userRole } = req.user; // User ID and role from authentication middleware
    const { fileId } = req.params;
    const { newFileName } = req.body;

    try {
        // Fetch the file from the database
        const file = await prisma.file.findUnique({ where: { id: fileId } });
        if (!file) {
            res.status(404).json({ error: "File not found" });
            return;
        }

        // Check if the user owns the file or is an admin
        if (file.uploadedById !== userId && userRole !== "admin") {
            res.status(403).json({ error: "Forbidden: You do not have permission to rename this file" });
            return;
        }

        // Get the file extension
        const fileExt = path.extname(file.name);

        // Generate a new storage URL
        const newStorageUrl = `/uploads/${file.spaceId}/${newFileName}${fileExt}`;

        // Convert storageUrl to filesystem path
        const uploadsDir = path.join(__dirname, '../../uploads');
        const currentFilePath = path.join(uploadsDir, String(file.spaceId), path.basename(file.storageUrl));
        const newFilePath = path.join(uploadsDir, String(file.spaceId), `${newFileName}${fileExt}`);

        try {
            await fs.rename(currentFilePath, newFilePath); // Rename the physical file
            console.log(`File renamed from ${currentFilePath} to ${newFilePath}`);
        } catch (err) {
            console.error(`Error renaming file: ${currentFilePath} to ${newFilePath}`, err);
            res.status(500).json({ error: "Failed to rename the physical file" });
            return;
        }

        // Update the file record in the database
        const updatedFile = await prisma.file.update({
            where: { id: fileId },
            data: { name: `${newFileName}${fileExt}`, storageUrl: newStorageUrl },
        });

        res.status(200).json({ message: "File renamed successfully!", file: updatedFile });
    } catch (error) {
        console.error("Error renaming file:", error);
        res.status(500).json({ error: "Internal server error" });
    }
};

export const getFileInfo = async (req: Request, res: Response): Promise<void> => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
        res.status(400).json({ errors: errors.array() });
        return;
    }

    const { fileId } = req.params;
    try {
        const file = await prisma.file.findUnique({
            where: { id: fileId },
            include: {
                uploadedBy: {
                    select: {
                        id: true,
                        email: true,
                    }, 
                },
                fileLinks: true, // Fetch all associated file share links
            },
        });

        if (!file) {
            res.status(404).json({ error: "File not found" });
            return;
        }

        res.status(200).json({ file });
    } catch (error) {
        console.error("Error fetching file:", error);
        res.status(500).json({ error: "Internal server error" });
    }
};

// Controller for downloading a file
export const downloadFile = async (req: Request, res: Response): Promise<void> => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
        res.status(400).json({ errors: errors.array() });
        return;
    }

    const { fileId } = req.params;
    
    try {
        // Fetch the file metadata from the database
        const file = await prisma.file.findUnique({ where: { id: fileId } });
        if (!file) {
            res.status(404).json({ error: "File not found in the database" });
            return;
        }

        // Construct the absolute filesystem path
        const uploadsDir = path.join(__dirname, '../../uploads'); // Adjust the path as necessary
        const spaceDir = path.join(uploadsDir, String(file.spaceId));
        const filePath = path.join(spaceDir, file.name);

        // Check if the file exists on the server
        try {
            await fs.access(filePath);
        } catch {
            res.status(404).json({ error: "File not found on the server" });
            return;
        }

        // Send the file for download
        res.download(filePath, file.name, (err) => {
            if (err) {
                console.error("Error downloading file:", err);
                // If headers have already been sent, cannot send a response
                if (!res.headersSent) {
                    res.status(500).json({ error: "Error occurred while downloading the file" });
                }
            }
        });

    } catch (error) {
        console.error("Error fetching file:", error);
        res.status(500).json({ error: "Internal server error" });
    }
};

export const lockFile = async (req: Request, res: Response): Promise<void> => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
        res.status(400).json({ errors: errors.array() });
        return;
    }

    const { fileId } = req.params;
    const { password, repeatPassword } = req.body;

    if (password !== repeatPassword) {
        res.status(400).json({ error: "Passwords do not match" });
        return;
    }

    try {
        const file = await prisma.file.findUnique({ where: { id: fileId } });
        if (!file) {
            res.status(404).json({ error: "File not found" });
            return;
        }

        // Hash the password before saving it
        const hashedPassword = await bcrypt.hash(password, 10);

        // Update the file with the hashed password
        const updatedFile = await prisma.file.update({
            where: { id: fileId },
            data: { password: hashedPassword },
        });

        res.status(200).json({
            message: "File locked successfully!",
            file: updatedFile,
        });
    } catch (error) {
        console.error("Error locking file:", error);
        res.status(500).json({ error: "Internal server error" });
    }
};


export const unlockFile = async (req: Request, res: Response): Promise<void> => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
        res.status(400).json({ errors: errors.array() });
        return;
    }

    const { fileId } = req.params;

    try {
        // Check if the file exists
        const file = await prisma.file.findUnique({ where: { id: fileId } });
        if (!file) {
            res.status(404).json({ error: "File not found" });
            return;
        }

        // Update the file by removing the password
        const updatedFile = await prisma.file.update({
            where: { id: fileId },
            data: { password: null }, // Set password to null to unlock the file
        });

        res.status(200).json({
            message: "File unlocked successfully!",
            file: updatedFile,
        });
    } catch (error) {
        console.error("Error unlocking file:", error);
        res.status(500).json({ error: "Internal server error" });
    }
};

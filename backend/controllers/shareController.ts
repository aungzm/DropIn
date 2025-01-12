import { Request, Response } from "express";
import { validationResult } from "express-validator";
import { PrismaClient } from "@prisma/client";
import { fileExists } from "../utils/fileHelper";
import crypto from "crypto";
import path from "path";
import archiver from "archiver";
import fs from "fs/promises";

const prisma = new PrismaClient();

// Helper function to generate a random share secret
const generateShareSecret = (): string => {
    return crypto.randomBytes(5).toString("hex"); // Generates a 10-character string
};


// Add file share link
export const addFileShareLink = async (req: Request, res: Response): Promise<void> => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
        res.status(400).json({ errors: errors.array() });
        return;
    }

    const { fileId } = req.params;
    const { maxDownloads, expiresAt } = req.body;

    try {
        const file = await prisma.file.findUnique({ where: { id: fileId } });
        if (!file) {
            res.status(404).json({ error: "File not found" });
            return;
        }

        const shareSecret = generateShareSecret();

        const fileLink = await prisma.fileLink.create({
            data: {
                fileId,
                shareSecret,
                maxDownloads,
                expiresAt,
            },
        });

        res.status(201).json({ 
            message: "File share link created successfully!", 
            fileId: fileLink.fileId,
            shareSecret: fileLink.shareSecret,
            maxDownloads: fileLink.maxDownloads,
            expiresAt: fileLink.expiresAt
        });
    } catch (error) {
        console.error("Error creating file share link:", error);
        res.status(500).json({ error: "Internal server error" });
    }
};

export const modifyFileShareLink = async (req: Request, res: Response): Promise<void> => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
        res.status(400).json({ errors: errors.array() });
        return;
    }

    const { fileId } = req.params;
    const { expiresAt, maxDownloads } = req.body; // Time limit in minutes

    try {
        const file = await prisma.file.findFirst({ where: { id: fileId } });
        if (!file) {
            res.status(404).json({ error: "File not found" });
            return;
        }

        const fileLink = await prisma.fileLink.findFirst({ where: { fileId } });
        if (!fileLink) {
            res.status(404).json({ error: "File link not found" });
            return;
        }

        await prisma.fileLink.update({
            where: { id: fileLink.id },
            data: { expiresAt, maxDownloads },
        });
        res.status(200).json({ 
            message: "File share link created successfully!", 
            fileId: fileLink.fileId,
            shareSecret: fileLink.shareSecret,
            maxDownloads: fileLink.maxDownloads,
            expiresAt: fileLink.expiresAt
        });
    } catch (error) {
        console.error("Error modifying file share link:", error);
        res.status(500).json({ error: "Internal server error" });
    }
};

// Add space share link
export const addSpaceShareLink = async (req: Request, res: Response): Promise<void> => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
        res.status(400).json({ errors: errors.array() });
        return;
    }

    const { spaceId } = req.params;
    const { expiresAt } = req.body; // Time limit in minutes
    try {
        const space = await prisma.space.findUnique({ where: { id: spaceId } });
        if (!space) {
            res.status(404).json({ error: "Space not found" });
            return;
        }

        const shareSecret = generateShareSecret();

        const spaceLink = await prisma.spaceLink.create({
            data: {
                spaceId,
                shareSecret,
                expiresAt,
            },
        });

        res.status(201).json({ 
            message: "Space share link created successfully!", 
            spaceId: spaceLink.spaceId,
            shareSecret: spaceLink.shareSecret,
            expiresAt: spaceLink.expiresAt
        });
    } catch (error) {
        console.error("Error creating space share link:", error);
        res.status(500).json({ error: "Internal server error" });
    }
};

export const modifySpaceShareLink = async (req: Request, res: Response): Promise<void> => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
        res.status(400).json({ errors: errors.array() });
        return;
    }
    
    const { spaceId } = req.params;
    const { expiresAt } = req.body; // Time limit in minutes

    try {
        const space = await prisma.space.findFirst({ where: { id: spaceId } });
        if (!space) {
            res.status(404).json({ error: "Space not found" });
            return;
        }

        const spaceLink = await prisma.spaceLink.findFirst({ where: { spaceId } });
        if (!spaceLink) {
            res.status(404).json({ error: "Space link not found" });
            return;
        }

        await prisma.spaceLink.update({
            where: { id: spaceLink.id },
            data: { expiresAt },
        });
        res.status(200).json({ 
            message: "Space share link created successfully!", 
            spaceId: spaceLink.spaceId,
            shareSecret: spaceLink.shareSecret,
            expiresAt: spaceLink.expiresAt 
        });

    } catch (error) {
        console.error("Error modifying space share link:", error);
        res.status(500).json({ error: "Internal server error" });
    }
};

// Remove file share link
export const removeFileShareLink = async (req: Request, res: Response): Promise<void> => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
        res.status(400).json({ errors: errors.array() });
        return;
    }

    const { fileId } = req.params;

    try {
        const fileLink = await prisma.fileLink.findFirst({ where: { fileId } });
        if (!fileLink) {
            res.status(404).json({ error: "File share link not found" });
            return;
        }

        await prisma.fileLink.delete({ where: { id: fileLink.id } });

        res.status(200).json({ message: "File share link removed successfully!" });
    } catch (error) {
        console.error("Error removing file share link:", error);
        res.status(500).json({ error: "Internal server error" });
    }
};

// Remove space share link
export const removeSpaceShareLink = async (req: Request, res: Response): Promise<void> => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
        res.status(400).json({ errors: errors.array() });
        return;
    }

    const { spaceId } = req.params;

    try {
        const spaceLink = await prisma.spaceLink.findFirst({ where: { spaceId } });
        if (!spaceLink) {
            res.status(404).json({ error: "Space share link not found" });
            return;
        }

        await prisma.spaceLink.delete({ where: { id: spaceLink.id } });

        res.status(200).json({ message: "Space share link removed successfully!" });
    } catch (error) {
        console.error("Error removing space share link:", error);
        res.status(500).json({ error: "Internal server error" });
    }
};

// Verify file share link
export const verifyFileShareLink = async (req: Request, res: Response): Promise<void> => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
        res.status(400).json({ errors: errors.array() });
        return;
    }

    const { shareSecret } = req.body;

    try {
        const fileLink = await prisma.fileLink.findFirst({ where: { shareSecret } });
        if (!fileLink) {
            res.status(404).json({ error: "File share link not valid" });
            return;
        }

        const file = await prisma.file.findUnique({
            where: { id: fileLink.fileId },
            include: {
                uploadedBy: { select: { username: true } },
            },
        });

        if (!file) {
            res.status(404).json({ error: "File not found" });
            return;
        }

        res.status(200).json({
            id: file.id,
            name: file.name,
            uploadedBy: file.uploadedBy.username,
            passwordNeeded: !!file.password,
        });
    } catch (error) {
        console.error("Error verifying file share link:", error);
        res.status(500).json({ error: "Internal server error" });
    }
};

// Verify space share link
export const verifySpaceShareLink = async (req: Request, res: Response): Promise<void> => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
        res.status(400).json({ errors: errors.array() });
        return;
    }

    const { shareSecret } = req.body;

    try {
        const spaceLink = await prisma.spaceLink.findFirst({ where: { shareSecret } });
    
        if (!spaceLink) {
            res.status(404).json({ error: "Space share link not valid" });
            return;
        }

        const space = await prisma.space.findUnique({
            where: { id: spaceLink.spaceId },
            include: {
                createdBy: { select: { username: true } },
            },
        });

        if (!space) {
            res.status(404).json({ error: "Space not found" });
            return;
        }

        res.status(200).json({
            id: space.id,
            name: space.name,
            createdBy: space.createdBy.username,
            passwordNeeded: !!space.password,
        });
    } catch (error) {
        console.error("Error verifying space share link:", error);
        res.status(500).json({ error: "Internal server error" });
    }
};


export const guestDownloadFile = async (req: Request, res: Response): Promise<void> => {
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

        // Update the download count for the file and delete the share link if max downloads reached
        const fileShare = await prisma.fileLink.findFirst({ where: { fileId } });
        if (!fileShare){
            res.status(404).json({ error: "File not found" });
        }
        if (fileShare && fileShare.maxDownloads !== null) {
            await prisma.fileLink.update({ 
                where: { id: fileShare.id },
                data: { downloads: (fileShare.downloads ?? 0) + 1 }
            });
            if (fileShare.downloads === fileShare.maxDownloads) {
                await prisma.fileLink.delete({ where: { id: fileShare.id } });
            }
        }
        res.status(200).json({ message: "File downloaded successfully!" });
    } catch (error) {
        console.error("Error downloading file:", error);
        res.status(500).json({ error: "Internal server error" });
    }
};

export const guestDownloadAllFiles = async (req: Request, res: Response): Promise<void> => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
        res.status(400).json({ errors: errors.array() });
        return;
    }

    const { spaceId } = req.params;

    try {
        // Fetch space name
        const space = await prisma.space.findUnique({
            where: { id: spaceId },
            select: { name: true },
        });

        if (!space) {
            res.status(404).json({ error: "Space not found" });
            return;
        }

        // Fetch files belonging to the specified space
        const files = await prisma.file.findMany({ where: { spaceId } });
        if (files.length === 0) {
            res.status(404).json({ error: "No files found in the space" });
            return;
        }

        const uploadsDir = path.join(__dirname, '../../uploads', spaceId);
        // Define the zip file path
        const tempDir = path.join(__dirname, 'temp');
        await fs.mkdir(tempDir, { recursive: true });
        const zipFileName = `space-${space.name}.zip`;
        const zipFilePath = path.join(tempDir, zipFileName);

        // Create a zip archive
        const output = await fs.open(zipFilePath, 'w');
        const archive = archiver("zip", { zlib: { level: 9 } });

        // Handle archiver errors
        archive.on("error", async (err) => {
            await output.close();
            await fs.unlink(zipFilePath).catch(() => {});
            res.status(500).json({ error: "Failed to create zip archive" });
        });

        // Pipe the archive data to the zip file
        const stream = archive.pipe(output.createWriteStream());

        // Add each file to the archive
        for (const file of files) {
            const filePath = path.join(uploadsDir, file.name);
            if (await fileExists(filePath)) {
                archive.file(filePath, { name: file.name });
            }
        }

        // Finalize the archive
        await archive.finalize();

        // Wait for the archive to finish
        stream.on("close", async () => {
            // Send the zip file as a response
            res.download(zipFilePath, zipFileName, async (err) => {
                // Clean up the temporary zip file after sending
                await fs.unlink(zipFilePath).catch(() => {});
                await output.close();
                if (err) {
                    console.error("Error sending zip file:", err);
                }
            });
        });

        // Increase download limit on files that apply
        const fileShares = await prisma.fileLink.findMany({ where: { fileId: { in: files.map((file: { id: string }) => file.id) } } });
        for (const fileShare of fileShares) {
            if (fileShare.maxDownloads !== null) {
                await prisma.fileLink.update({ 
                    where: { id: fileShare.id },
                    data: { downloads: (fileShare.downloads ?? 0) + 1 }
                });
                
                if (fileShare.downloads === fileShare.maxDownloads) {
                    await prisma.fileLink.delete({ where: { id: fileShare.id } });
                }
            }
        }
        
    } catch (error) {
        console.error("Error downloading files:", error);
        res.status(500).json({ error: "Internal server error" });
    }
};


export const getSpaceInfoGuest = async (req: Request, res: Response): Promise<void> => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
        res.status(400).json({ errors: errors.array() });
        return;
    }

    const { spaceId, spacePassword } = req.params;
    try {

        const space = await prisma.space.findUnique({
            where: { id: spaceId },
            include: {
                createdBy: { select: { id: true, username: true, email: true } },
                files: true,
                spaceLinks: true,
            },
        });

        if (!space) {
            res.status(404).json({ error: "Space not found" });
            return;
        }

        if (space.password && space.password !== spacePassword) {
            res.status(401).json({ error: "Incorrect password" });
            return;
        }

        res.status(200).json({ space });
    } catch (error) {
        console.error("Error retrieving space info:", error);
        res.status(500).json({ error: "Internal server error" });
    }
};
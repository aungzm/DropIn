import { Request, Response } from "express";
import { validationResult } from "express-validator";
import { PrismaClient } from "@prisma/client";
import bcrypt from "bcryptjs";
import fs from "fs/promises";
import path from "path";
import archiver from "archiver";

const prisma = new PrismaClient();

// Delete a space
export const deleteSpace = async (req: Request, res: Response): Promise<void> => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
        res.status(400).json({ errors: errors.array() });
        return;
    }

    const { spaceId } = req.params;

    try {
        // Fetch the space and its files
        const space = await prisma.space.findUnique({ where: { id: spaceId } });
        if (!space) {
            res.status(404).json({ error: "Space not found" });
            return;
        }

        // Delete all files in the space
        const files = await prisma.file.findMany({ where: { spaceId } });
        for (const file of files) {
            try {
                await fs.unlink(file.storageUrl); // Delete physical files
            } catch (err) {
                console.error(`Error deleting file ${file.storageUrl}:`, err);
            }
        }

        // Delete associated file links
        await prisma.fileLink.deleteMany({ where: { fileId: { in: files.map((file: { id: string }) => file.id) } } });

        // Delete the files
        await prisma.file.deleteMany({ where: { spaceId } });

        // Delete associated space links
        await prisma.spaceLink.deleteMany({ where: { spaceId } });

        // Delete the space
        await prisma.space.delete({ where: { id: spaceId } });

        res.status(200).json({ message: "Space deleted successfully!" });
    } catch (error) {
        console.error("Error deleting space:", error);
        res.status(500).json({ error: "Internal server error" });
    }
};

// Create a new space
export const createSpace = async (req: Request, res: Response): Promise<void> => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
        res.status(400).json({ errors: errors.array() });
        return;
    }

    const { spaceName, password } = req.body;
    const { id: userId } = req.user!;

    try {
        const hashedPassword = password ? await bcrypt.hash(password, 10) : null;

        const createdSpace = await prisma.space.create({
            data: {
                createdById: userId,
                uploadedById: userId,
                password: hashedPassword,
                name: spaceName,
            },
        });

        const newSpace = await prisma.space.findFirst({ 
            where: { id: createdSpace.id },
            include: { 
                createdBy: {
                    select: { id: true, username: true},
                }
            }, 
        });

        res.status(201).json({ message: "Space created successfully!", space: newSpace });
    } catch (error) {
        console.error("Error creating space:", error);
        res.status(500).json({ error: "Internal server error" });
    }
};

// Update a space's name
export const updateSpace = async (req: Request, res: Response): Promise<void> => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
        res.status(400).json({ errors: errors.array() });
        return;
    }

    const { spaceId } = req.params;
    const { newSpaceName } = req.body;

    try {
        const updatedSpace = await prisma.space.update({
            where: { id: spaceId },
            data: { name: newSpaceName },
        });

        res.status(200).json({ message: "Space updated successfully!", space: updatedSpace });
    } catch (error) {
        console.error("Error updating space:", error);
        res.status(500).json({ error: "Internal server error" });
    }
};

// Helper function to check if a file exists
const fileExists = async (filePath: string): Promise<boolean> => {
    try {
        await fs.access(filePath);
        return true;
    } catch {
        return false;
    }
};

// Controller for downloading all files in a space
export const downloadAllFiles = async (req: Request, res: Response): Promise<void> => {
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

        // Define the uploads directory
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
    } catch (error) {
        console.error("Error downloading all files:", error);
        res.status(500).json({ error: "Internal server error" });
    }
};

// Lock a space with a password
export const lockSpace = async (req: Request, res: Response): Promise<void> => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
        res.status(400).json({ errors: errors.array() });
        return;
    }

    const { spaceId } = req.params;
    const { password, repeatPassword } = req.body;

    if (password !== repeatPassword) {
        res.status(400).json({ error: "Passwords do not match" });
        return;
    }

    try {
        const hashedPassword = await bcrypt.hash(password, 10);
        const space = await prisma.space.findFirst({
            where: {
            id: spaceId,
            password: { not: null },
            },
        });

        if (space) {
            res.status(400).json({ error: "Space is already locked" });
            return;
        } else {
            await prisma.space.update({
                where: { id: spaceId },
                data: { password: hashedPassword },
            });
        }
        
        res.status(200).json({ message: "Space locked successfully!"});
    } catch (error) {
        console.error("Error locking space:", error);
        res.status(500).json({ error: "Internal server error" });
    }
};

// Unlock a space
export const unlockSpace = async (req: Request, res: Response): Promise<void> => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
        res.status(400).json({ errors: errors.array() });
        return;
    }

    const { spaceId } = req.params;
    const { password } = req.body;

    try {
        const space = await prisma.space.findUnique({ where: { id: spaceId } });
        if (!space) {
            res.status(404).json({ error: "Space not found" });
            return;
        }

        if (!space.password) {
            res.status(400).json({ error: "Space is not locked" });
            return;
        }

        const isPasswordValid = await bcrypt.compare(password, space.password);
        if (!isPasswordValid) {
            res.status(400).json({ error: "Incorrect password" });
            return;
        }

        const updatedSpace = await prisma.space.update({
            where: { id: spaceId },
            data: { password: null },
        });

        res.status(200).json({ message: "Space unlocked successfully!", space: updatedSpace });
    } catch (error) {
        console.error("Error unlocking space:", error);
        res.status(500).json({ error: "Internal server error" });
    }
};

// Get space information
export const getSpaceInfo = async (req: Request, res: Response): Promise<void> => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
        res.status(400).json({ errors: errors.array() });
        return;
    }

    const { spaceId } = req.params;

    try {
        const space = await prisma.space.findUnique({
            where: { id: spaceId },
            select: {
                id: true,
                name: true,
                createdAt: true,
                password: true, // Fetch raw `password` field
                createdBy: { select: { id: true, username: true, email: true } },
                files: {
                    select: {
                        id: true,
                        name: true,
                        storageUrl: true,
                        createdAt: true,
                        password: true, // Fetch raw `password` field
                    },
                },
                spaceLinks: {
                    select: {
                        id: true,
                        shareSecret: true,
                    },
                },
            },
        });
        
        if (!space) {
            res.status(404).json({ error: "Space not found" });
            return;
        }
        
        // Post-process the result
        const processedSpace = {
            ...space,
            password: space.password ? "Yes" : "No", // Replace `null` with `"No"`
            files: space.files.map((file) => ({
                ...file,
                password: file.password ? "Yes" : "No", 
            })),
        };
        res.status(200).json({ space: processedSpace });        
    } catch (error) {
        console.error("Error retrieving space info:", error);
        res.status(500).json({ error: "Internal server error" });
    }
};

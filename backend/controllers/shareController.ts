import { Request, Response } from "express";
import { validationResult } from "express-validator";
import { PrismaClient } from "@prisma/client";
import { fileExists } from "../utils/fileHelper";
import { generateShareSecret } from "../utils/shareHelper";
import crypto from "crypto";
import path from "path";
import archiver from "archiver";
import fs from "fs/promises";
import bcrypt from "bcryptjs";
import dotenv from "dotenv";


dotenv.config();
const prisma = new PrismaClient();

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
            url: process.env.FRONTEND_URL + "/shares/file/" + fileLink.shareSecret,
            maxDownloads: fileLink.maxDownloads ?? "unlimited",
            remainingDownloads: fileLink.maxDownloads ?? "unlimited",
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

    const { fileId, shareSecret } = req.params;
    const { expiresAt, maxDownloads } = req.body; // Time limit in minutes

    try {
        const file = await prisma.file.findFirst({ where: { id: fileId } });
        if (!file) {
            res.status(404).json({ error: "File not found" });
            return;
        }

        const fileLink = await prisma.fileLink.findFirst({ where: { fileId, shareSecret } });
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
            url: process.env.FRONTEND_URL + "/shares/file/" + fileLink.shareSecret,
            maxDownloads: fileLink.maxDownloads,
            remainingDownloads: fileLink.maxDownloads === null ? "unlimited" : fileLink.maxDownloads - (fileLink.downloads ?? 0),
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
        const space = await prisma.space.findUnique({ where: { id: spaceId }, 
            include: { files: true }
        });
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

        if (space.files){  // Create file share links for all files in the space
            for (const file of space.files){
                await prisma.fileLink.create({
                    data: {
                        fileId: file.id,
                        shareSecret: generateShareSecret(),
                        expiresAt,
                        spaceLinkId: spaceLink.id,
                    },
                });
            }
        }

        res.status(201).json({ 
            message: "Space share link created successfully!", 
            spaceId: spaceLink.spaceId,
            url: process.env.FRONTEND_URL + "/shares/space/" + spaceLink.shareSecret,
            expiresAt: spaceLink.expiresAt,
            maxDownloads: "unlimited",
            remainingDownloads: "unlimited",
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
    
    const { spaceId, shareSecret } = req.params;
    const { expiresAt } = req.body; // Time limit in minutes

    try {
        const space = await prisma.space.findFirst({ where: { id: spaceId } });
        if (!space) {
            res.status(404).json({ error: "Space not found" });
            return;
        }

        const spaceLink = await prisma.spaceLink.findFirst({ where: { spaceId, shareSecret },
            include: { fileLinks: true } 
        });
        if (!spaceLink) {
            res.status(404).json({ error: "Space link not found" });
            return;
        }

        await prisma.spaceLink.update({
            where: { id: spaceLink.id },
            data: { expiresAt },
        });

        for (const fileLink of spaceLink.fileLinks) {
            await prisma.fileLink.update({
                where: { id: fileLink.id },
                data: { expiresAt }
            });
        }

        res.status(200).json({ 
            message: "Space share modified successfully!", 
            spaceId: spaceLink.spaceId,
            url: process.env.FRONTEND_URL + "/shares/space/" + spaceLink.shareSecret,
            maxDownloads: "unlimited",
            remainingDownloads: "unlimited",
            expiresAt: spaceLink.expiresAt 
        });

    } catch (error) {
        console.error("Error modifying space share link:", error);
        res.status(500).json({ error: "Internal server error" });
    }
};
// Get All File share Links as user to administrator
export const getfileShareInfo = async (req: Request, res: Response): Promise<void> => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
        res.status(400).json({ errors: errors.array() });
        return;
    }
    const { fileId } = req.params;
    try {
        const fileLink = await prisma.fileLink.findFirst({ where: { fileId, spaceLinkId: null } }); // Only get file links that are not associated with a space
        if (!fileLink) {
            res.status(200).json({ message: "No file share links found" });
            return;
        }

        const linkInfo = {
            id: fileLink.id,
            url: process.env.FRONTEND_URL + "/shares/file/" + fileLink.shareSecret,
            expiresAt: fileLink.expiresAt,
            maxDownloads: fileLink.maxDownloads ?? "unlimited",
            remainingDownloads: fileLink.maxDownloads ? fileLink.maxDownloads - (fileLink.downloads ?? 0) : "unlimited",
        };

        res.status(200).json(linkInfo);
    } catch (error) {
        console.error("Error retrieving file share info:", error);
        res.status(500).json({ error: "Internal server error" });
    }
};

// Get space share info as user
export const getSpaceShareInfo = async (req: Request, res: Response): Promise<void> => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
        res.status(400).json({ errors: errors.array() });
        return;
    }
    const { spaceId } = req.params;
    try {
        const spaceLink = await prisma.spaceLink.findFirst({ where: { spaceId } });
        if (!spaceLink) {
            res.status(200).json([]);
            return;
        }

        const linksInfo = {
            id: spaceLink.id,
            url: process.env.FRONTEND_URL + "/shares/space/" + spaceLink.shareSecret,
            expiresAt: spaceLink.expiresAt,
            maxDownloads: "unlimited",
            remainingDownloads: "unlimited",
        };

        res.status(200).json(linksInfo);
    } catch (error) {
        console.error("Error retrieving space share info:", error);
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

    const { fileId, shareSecret } = req.params;

    try {
        const fileLink = await prisma.fileLink.findFirst({ where: { fileId, shareSecret } });
        if (!fileLink) {
            res.status(404).json({ error: "File share link not found" });
            return;
        }

        if (fileLink.spaceLinkId) {
            res.status(403).json({ error: "This shared link belongs the space, to remove this link please delete the space share link" });
        }

        await prisma.fileLink.delete({ where: { id: fileLink.id } });

        res.status(204).json({ message: "File share link removed successfully!" });
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

    const { spaceId, shareSecret } = req.params;

    try {
        const spaceLink = await prisma.spaceLink.findFirst({ where: { spaceId, shareSecret },
            include: { fileLinks: true } 
        });

        if (!spaceLink) {
            res.status(404).json({ error: "Space share link not found" });
            return;
        }

        await prisma.fileLink.deleteMany({ where: { spaceLinkId: spaceId } });

        await prisma.spaceLink.delete({ where: { id: spaceLink.id } });

        res.status(204).json({ message: "Space share link removed successfully!" });
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

    const { shareSecret } = req.query;

    try {
        const fileLink = await prisma.fileLink.findFirst({ where: { shareSecret: shareSecret as string } });
        if (!fileLink) {
            res.status(404).json({ error: "File share link not valid" });
            return;
        }

        const file = await prisma.file.findFirst({
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

    const { shareSecret }  = req.query;

    try {
        const spaceLink = await prisma.spaceLink.findFirst({ where: { shareSecret: shareSecret as string } });
    
        if (!spaceLink) {
            res.status(404).json({ error: "Space share link not valid" });
            return;
        }

        const space = await prisma.space.findFirst({
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
    const { shareSecret, password } = req.query;

    try {
        // Fetch the file metadata and file link in a single query
        const file = await prisma.file.findFirst({
            where: { id: fileId },
            include: {
            fileLinks: {
                where: {
                    shareSecret: shareSecret as string,
                    expiresAt: { gte: new Date() },
                },
            }
            }
        });

        if (!file) {
            res.status(404).json({ error: "File not found in the database or share link invalid" });
            return;
        }

        const fileLink = file.fileLinks.find(link => link.maxDownloads === null || (link.maxDownloads > (link.downloads ?? 0)));
        if (!fileLink) {
            res.status(404).json({ error: "File share link not valid" });
            return;
        }

        // Construct the absolute filesystem path
        const uploadsDir = path.join(__dirname, '../../uploads');
        const spaceDir = path.join(uploadsDir, String(file.spaceId));
        const filePath = path.join(spaceDir, file.name);

        // Check if the file exists on the server
        try {
            await fs.access(filePath);
        } catch {
            res.status(404).json({ error: "File not found on the server" });
            return;
        }

        // Check if the file is password-protected
        if (file.password && !(await bcrypt.compare(password as string, file.password))) {
            res.status(401).json({ error: "Incorrect password" });
            return;
        }

        // Send the file for download
        res.download(filePath, file.name, async (err) => {
            if (err) {
                console.error("Error downloading file:", err);
                if (!res.headersSent) {
                    res.status(500).json({ error: "Error occurred while downloading the file" });
                }
                return;
            }

            // Update the download count after successful download
            if (fileLink.maxDownloads !== null) {
                const updatedDownloads = (fileLink.downloads ?? 0) + 1;

                // Delete the link if max downloads are reached
                if (updatedDownloads >= fileLink.maxDownloads) {
                    await prisma.fileLink.delete({ where: { id: fileLink.id } });
                } else {
                    await prisma.fileLink.update({
                        where: { id: fileLink.id },
                        data: { downloads: updatedDownloads }
                    });
                }
            }
        });
    } catch (error) {
        console.error("Error downloading file:", error);
        if (!res.headersSent) {
            res.status(500).json({ error: "Internal server error" });
        }
    }
};


export const guestDownloadAllFiles = async (req: Request, res: Response): Promise<void> => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
        res.status(400).json({ errors: errors.array() });
        return;
    }

    const { spaceId } = req.params;
    const { shareSecret } = req.query;

    try {
        const space = await prisma.space.findFirst({
            where: { id: spaceId },
            select: { name: true },
        });

        if (!space) {
            res.status(404).json({ error: "Space not found" });
            return;
        }

        const spaceLink = await prisma.spaceLink.findFirst({
            where: { spaceId, shareSecret: shareSecret as string, expiresAt: { gte: new Date() } },
            include: { fileLinks: true },
        });

        if (!spaceLink) {
            res.status(404).json({ error: "Space share link not valid" });
            return;
        }

        const files = await prisma.file.findMany({ where: { spaceId } });

        if (files.length === 0) {
            res.status(200).json({ message: "No files associated with this space" });
            return;
        }

        const uploadsDir = path.join(__dirname, '../../uploads', spaceId);
        const tempDir = path.join(__dirname, 'temp');
        await fs.mkdir(tempDir, { recursive: true });

        const zipFileName = `space-${space.name}.zip`;
        const zipFilePath = path.join(tempDir, zipFileName);

        const lockedFiles: Array<{ id: string; name: string }> = [];

        // Create the writable file stream using fs.promises.open
        const zipFileHandle = await fs.open(zipFilePath, 'w');
        const writable = zipFileHandle.createWriteStream();

        // Create the archive
        const archive = archiver("zip", { zlib: { level: 9 } });

        // Handle archiver errors
        archive.on("error", async (err) => {
            console.error("Error creating archive:", err);
            await zipFileHandle.close();
            await fs.unlink(zipFilePath).catch(() => {});
            res.status(500).json({ error: "Failed to create zip archive" });
        });

        // Pipe the archive to the writable stream
        archive.pipe(writable);

        // Add files to the archive
        for (const file of files) {
            const filePath = path.join(uploadsDir, file.name);
            if (await fileExists(filePath) && file.password === null) {
                archive.file(filePath, { name: file.name });
            } else {
                lockedFiles.push({ id: file.id, name: file.name });
            }
        }

        // Finalize the archive
        await archive.finalize();

        // Wait for the archive to finish and send it as a response
        writable.on("finish", async () => {
            res.download(zipFilePath, zipFileName, async (err) => {
                // Clean up the temporary zip file
                await zipFileHandle.close();
                await fs.unlink(zipFilePath).catch(() => {});

                if (err) {
                    console.error("Error sending zip file:", err);
                }
            });

            // Update file link download counts
            for (const fileLink of spaceLink.fileLinks) {
                const isFileLocked = lockedFiles.some((lockedFile) => lockedFile.id === fileLink.fileId);

                if (!isFileLocked && fileLink.maxDownloads !== null) {
                    const newDownloads = (fileLink.downloads ?? 0) + 1;

                    await prisma.fileLink.update({
                        where: { id: fileLink.id },
                        data: { downloads: newDownloads },
                    });

                    if (newDownloads >= fileLink.maxDownloads) {
                        await prisma.fileLink.delete({ where: { id: fileLink.id } });
                    }
                }
            }
        });
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

    const { spaceId } = req.params;
    const { spacePassword, shareSecret } = req.query;

    try {
        const spaceLink = await prisma.spaceLink.findFirst({
            where: { spaceId, shareSecret: shareSecret as string, expiresAt: { gte: new Date() } },
            include: { fileLinks: true },
        });

        if (!spaceLink) {
            res.status(404).json({ error: "Space share link not valid" });
            return;
        }

        const space = await prisma.space.findFirst({
            where: { id: spaceId },
            include: {
                createdBy: { select: { username: true } },
                files: { select: { id: true, name: true, password: true } },
                spaceLinks: true,
            },
        });

        if (!space) {
            res.status(404).json({ error: "Space not found" });
            return;
        }

        if (space.password && !(await bcrypt.compare(spacePassword as string, space.password))) {
            res.status(401).json({ error: "Incorrect password" });
            return;
        }

        const filesWithLinks = space.files.map((file) => {
            const fileLink = spaceLink.fileLinks.find((link) => link.fileId === file.id);
            if (fileLink) {
                const { password, ...fileWithoutPassword } = file; // Remove password from response
                return {
                    ...fileWithoutPassword,
                    locked: !!file.password, // Convert to boolean
                    url: `${process.env.FRONTEND_URL}/shares/file/${fileLink.shareSecret}`,
                    expiresAt: fileLink.expiresAt,
                    downloadsRemaining:
                        fileLink.maxDownloads !== null
                            ? fileLink.maxDownloads - (fileLink.downloads ?? 0)
                            : "unlimited",
                };
            }
            return {
                id: file.id,
                name: file.name,
                locked: !!file.password,
            }; // Return file data without link if no fileLink is found
        });

        res.status(200).json({
            id: space.id,
            name: space.name,
            createdBy: space.createdBy.username,
            locked: !!space.password,
            files: filesWithLinks, // Correctly return the processed files
        });
    } catch (error) {
        console.error("Error retrieving space info:", error);
        res.status(500).json({ error: "Internal server error" });
    }
};

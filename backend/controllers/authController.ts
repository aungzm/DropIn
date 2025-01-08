import { Request, Response } from "express";
import { validationResult } from "express-validator";
import { PrismaClient } from "@prisma/client";
import jwt, { JsonWebTokenError } from "jsonwebtoken";
import bcrypt from "bcryptjs";
import dotenv from "dotenv";
import path from "path";

const prisma = new PrismaClient();
const envPath = path.resolve(__dirname, "../../.env");
dotenv.config({ path: envPath });

// Load both secrets from environment variables
const ACCESS_TOKEN_SECRET = process.env.ACCESS_TOKEN_SECRET as string;
const REFRESH_TOKEN_SECRET = process.env.REFRESH_TOKEN_SECRET as string;

// Generate Access Token
export const generateAccessToken = (user: { id: string; role: string }) => {
    return jwt.sign({ userId: user.id, role: user.role }, ACCESS_TOKEN_SECRET, { expiresIn: "15m" });
};

// Generate Refresh Token
export const generateRefreshToken = async (userId: string) => {
    const refreshToken = jwt.sign({ userId }, REFRESH_TOKEN_SECRET, { expiresIn: "7d" });

    // Store the refresh token in the database
    await prisma.refreshToken.create({
        data: {
            token: refreshToken,
            ownerId: userId,
            expiresAt: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000), // Expires in 7 days
        },
    });

    return refreshToken;
};

// Controller for registering a user
export const registerUser = async (req: Request, res: Response): Promise<void> => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
        res.status(400).json({ errors: errors.array() });
        return;
    }

    const { username, email, password, repeatPassword } = req.body;

    if (!email.includes("@") || !email.includes(".")) {
        res.status(400).json({ error: "Must be a valid email address" });
        return;
    }

    const usernameRegex = /^[a-zA-Z0-9]+$/;
    if (!usernameRegex.test(username)) {
        res.status(400).json({ error: "Username can only contain letters and numbers" });
        return;
    }

    if (password !== repeatPassword) {
        res.status(400).json({ error: "Passwords do not match" });
        return;
    }

    try {
        const existingUserEmail = await prisma.user.findUnique({ where: { email } });
        const existingUserUsername = await prisma.user.findFirst({ where: { username } });

        if (existingUserEmail || existingUserUsername) {
            res.status(400).json({ error: "Email or Username is already registered" });
            return;
        }

        const hashedPassword = await bcrypt.hash(password, 10);

        const newUser = await prisma.user.create({
            data: {
                username,
                email,
                password: hashedPassword,
                role: "user",
            },
        });

        // Generate Tokens
        const accessToken = generateAccessToken(newUser);
        const refreshToken = await generateRefreshToken(newUser.id);

        res.status(201).json({
            message: "User registered successfully!",
            tokens: { accessToken, refreshToken },
        });
    } catch (error) {
        console.error(error);
        res.status(500).json({ error: "Internal server error" });
    }
};


export const loginUser = async (req: Request, res: Response): Promise<void> => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
        res.status(400).json({ errors: errors.array() });
        return;
    }

    const { username, email, password } = req.body;

    try {
        const user = await prisma.user.findFirst({
            where: {
                OR: [
                    { email },
                    { username },
                ],
            },
        });

        if (!user) {
            res.status(400).json({ error: "Invalid username or email" });
            return;
        }

        const isPasswordValid = await bcrypt.compare(password, user.password);
        if (!isPasswordValid) {
            res.status(400).json({ error: "Invalid password" });
            return;
        }

        // Generate new tokens
        const accessToken = generateAccessToken(user);

        // Check for an existing refresh token
        const existingRefreshToken = await prisma.refreshToken.findUnique({
            where: { ownerId: user.id },
        });

        let refreshToken;
        if (existingRefreshToken) {
            // Check if the existing refresh token has expired
            if (existingRefreshToken.expiresAt < new Date()) {
                // Refresh token expired, generate a new one
                refreshToken = await generateRefreshToken(user.id);

                // Delete the old refresh token
                await prisma.refreshToken.delete({ where: { id: existingRefreshToken.id } });
            } else {
                // Use the existing refresh token
                refreshToken = existingRefreshToken.token;
            }
        } else {
            // No refresh token exists, generate a new one
            refreshToken = await generateRefreshToken(user.id);
        }

        res.status(200).json({
            message: "User logged in successfully!",
            tokens: { accessToken, refreshToken },
        });
    } catch (error) {
        console.error(error);
        res.status(500).json({ error: "Internal server error" });
    }
};


// Controller for refreshing access token
export const refreshAccessToken = async (req: Request, res: Response): Promise<void> => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
        res.status(400).json({ errors: errors.array() });
        return;
    }
    
    const { refreshToken } = req.query;

    try {
        // Verify the refresh token
        const decoded = jwt.verify(String(refreshToken), process.env.REFRESH_TOKEN_SECRET!) as { userId: string };
        if (!decoded) {
            res.status(400).json({ error: "Invalid refresh token" });
            return;
        }

        // Check if the refresh token exists in the database
        const existingRefreshToken = await prisma.refreshToken.findUnique({
            where: { token: String(refreshToken) },
        });

        if (!existingRefreshToken) {
            res.status(400).json({ error: "Invalid refresh token" });
            return;
        }

        // Check if the refresh token has expired
        if (new Date(existingRefreshToken.expiresAt) < new Date()) {
            await prisma.refreshToken.delete({ where: { token: String(refreshToken) } });
            res.status(400).json({ error: "Refresh token has expired" });
            return;
        }

        const user = await prisma.user.findUnique({ where: { id: decoded.userId } });
        if (!user) {
            res.status(400).json({ error: "User not found" });
            return;
        }

        // Generate a new access token
        const newAccessToken = generateAccessToken(user);
        res.status(200).json({
            message: "Access token refreshed successfully!",
            accessToken: newAccessToken,
        });
    } catch (error) {
        if (error instanceof JsonWebTokenError) {
            // Handle JWT verification errors
            res.status(400).json({ error: "Invalid refresh token" });
        } else {
            console.error("Error refreshing access token:", error);
            res.status(500).json({ error: "Internal server error" });
        }
    }
};


export const logoutUser = async (req: Request, res: Response): Promise<void> => {
    const userId = req.user?.id;
    if (!userId) {
        res.status(400).json({ error: "User not found" });
        return;
    }

    try {
        // Delete the refresh token from the database
        await prisma.refreshToken.deleteMany({ where: { ownerId: userId } });

        res.status(200).json({ message: "User logged out successfully!" });
    } catch (error) {
        console.error("Error logging out user:", error);
        res.status(500).json({ error: "Internal server error" });
    }
};
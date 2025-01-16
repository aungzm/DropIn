import crypto from "crypto";

// Helper function to generate a random share secret
export const generateShareSecret = (): string => {
    return crypto.randomBytes(5).toString("hex"); // Generates a 10-character string
};


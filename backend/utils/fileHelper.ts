import fs from 'fs/promises';

// Check if a file exists
export const fileExists = async (path: string): Promise<boolean> => {
    try {
        await fs.access(path);
        return true;
    } catch {
        return false;
    }
};

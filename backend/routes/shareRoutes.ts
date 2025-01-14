import express from "express";
import { body, query, param } from "express-validator";
import { authenticateToken } from "../middlewares/authenticateToken";
import { verifyAccountOwnershipOrAdmin } from "../middlewares/authMiddleware";
import {
    addFileShareLink,
    modifyFileShareLink,
    addSpaceShareLink,
    modifySpaceShareLink,
    getfileShareInfo,
    getSpaceShareInfo,
    removeFileShareLink,
    removeSpaceShareLink,
    verifyFileShareLink,
    verifySpaceShareLink,
    guestDownloadFile,
    getSpaceInfoGuest,
    guestDownloadAllFiles
} from "../controllers/shareController";

const router = express.Router();

// Public Routes
router.get(
    "/file/verify",
    [
        query("shareSecret", "Share Secret is required").notEmpty(),
    ],
    verifyFileShareLink
);

router.get(
    "/space/verify",
    [
        query("shareSecret", "Share Secret is required").notEmpty(),
    ],
    verifySpaceShareLink
);

router.get(
    "/space/:spaceId/access",
    [
        param("spaceId", "Space ID is required").notEmpty(),
        query("spacePassword").optional().isString().withMessage("Space Password must be a String"),
    ],
    getSpaceInfoGuest
);

router.get(
    "/file/:fileId/download",
    [
        param("fileId", "File ID is required").notEmpty(),
        query("filePassword").optional().isString().withMessage("File Password must be a String"),
    ],
    guestDownloadFile
);

router.get(
    "/space/:spaceId/downloadAll",
    [
        param("spaceId", "Space ID is required").notEmpty()
    ],
    guestDownloadAllFiles
);

// Protected Routes
router.get(
    "/file/:fileId",
    authenticateToken,
    verifyAccountOwnershipOrAdmin,
    [
        param("fileId", "File ID is required").notEmpty(),
    ],
    getfileShareInfo
);

router.get(
    "/space/:spaceId",
    authenticateToken,
    verifyAccountOwnershipOrAdmin,
    [
        param("spaceId", "Space ID is required").notEmpty(),
    ],
    getSpaceShareInfo
);

router.delete(
    "/file/:fileId",
    authenticateToken,
    verifyAccountOwnershipOrAdmin,
    [
        param("fileId", "File ID is required").notEmpty(),
    ],
    removeFileShareLink
);

router.delete(
    "/space/:spaceId",
    authenticateToken,
    verifyAccountOwnershipOrAdmin,
    [
        param("spaceId", "Space ID is required").notEmpty(),
    ],
    removeSpaceShareLink
);
router.post(
    "/file/:fileId",
    authenticateToken,
    verifyAccountOwnershipOrAdmin,
    [
        param("fileId", "File ID is required").notEmpty(),
        body("maxDownloads", "Max Downloads is required").optional({nullable: true}).isInt(),
        body("expiresAt", "Time Limit is in minutes")
            .optional({ nullable: true })
            .isISO8601()
    ],
    addFileShareLink
);

router.patch(
    "/file/:fileId",
    authenticateToken,
    verifyAccountOwnershipOrAdmin,
    [
        param("fileId", "File ID is required").notEmpty(),
        body("maxDownloads", "Max Downloads is required").optional({nullable: true}).isInt(),
        body("expiresAt", "Time Limit is in minutes")
            .optional({ nullable: true })
            .isISO8601()
    ],
    modifyFileShareLink
);

router.post(
    "/space/:spaceId",
    authenticateToken,
    verifyAccountOwnershipOrAdmin,
    [
        param("spaceId", "Space ID is required").notEmpty(),
        body("expiresAt", "Time Limit is in minutes")
            .optional({ nullable: true })
            .isISO8601()
    ],
    addSpaceShareLink
);

router.patch(
    "/space/:spaceId",
    authenticateToken,
    verifyAccountOwnershipOrAdmin,
    [
        param("spaceId", "Space ID is required").notEmpty(),
        body("expiresAt", "Time Limit is in minutes")
            .optional({ nullable: true })
            .isISO8601()
    ],
    modifySpaceShareLink
);

export default router;
import express from "express";
import { body, query, param } from "express-validator";
import { authenticateToken } from "../middlewares/authenticateToken";
import { verifyAccountOwnershipOrAdmin } from "../middlewares/authMiddleware";
import {
    // Public / guest usage
    verifyFileShareLink,
    verifySpaceShareLink,
    getSpaceInfoGuest,
    guestDownloadFile,
    guestDownloadAllFiles,

    // Protected routes for owners/admin
    addFileShareLink,
    modifyFileShareLink,
    addSpaceShareLink,
    modifySpaceShareLink,
    getfileShareInfo,
    getSpaceShareInfo,
    removeFileShareLink,
    removeSpaceShareLink,
} from "../controllers/shareController";

const router = express.Router();

/* ===========================
   PUBLIC (Guest) ROUTES
   =========================== */

// Verify file share link (no token needed)
router.get(
    "/file/verify",
    [ query("shareSecret", "Share Secret is required").notEmpty() ],
    verifyFileShareLink
);

// Verify space share link (no token needed)
router.get(
    "/space/verify",
    [ query("shareSecret", "Share Secret is required").notEmpty() ],
    verifySpaceShareLink
);

// Guest access space info (and list files) after verifying
router.get(
    "/space/:spaceId/access",
    [
        param("spaceId", "Space ID is required").notEmpty(),
        query("spacePassword").optional().isString().withMessage("Space Password must be a String"),
        query("shareSecret").optional().isString().withMessage("Share Secret must be a string"),
    ],
    getSpaceInfoGuest
);

// Guest download single file
router.get(
    "/file/:fileId/download",
    [
        param("fileId", "File ID is required").notEmpty(),
        query("filePassword").optional().isString().withMessage("File Password must be a String"),
        query("shareSecret").optional().isString().withMessage("Share Secret must be a string"),
    ],
    guestDownloadFile
);

// Guest download all files in a space
router.get(
    "/space/:spaceId/downloadAll",
    [
        param("spaceId", "Space ID is required").notEmpty(),
        query("shareSecret").optional().isString().withMessage("Share Secret must be a string"),
    ],
    guestDownloadAllFiles
);

/* ===========================
   PROTECTED ROUTES (Owners/Admin)
   =========================== */

// Get file share info (requires token)
router.get(
    "/file/:fileId",
    authenticateToken,
    verifyAccountOwnershipOrAdmin,
    [ param("fileId", "File ID is required").notEmpty() ],
    getfileShareInfo
);

// Get space share info (requires token)
router.get(
    "/space/:spaceId",
    authenticateToken,
    verifyAccountOwnershipOrAdmin,
    [ param("spaceId", "Space ID is required").notEmpty() ],
    getSpaceShareInfo
);

// Remove file share link
router.delete(
    "/file/:fileId/:shareSecret",
    authenticateToken,
    verifyAccountOwnershipOrAdmin,
    [ 
      param("fileId", "File ID is required").notEmpty(), 
      param("shareSecret", "Share Secret is required").notEmpty(),
    ],
    removeFileShareLink
);

// Remove space share link
router.delete(
    "/space/:spaceId/:shareSecret",
    authenticateToken,
    verifyAccountOwnershipOrAdmin,
    [ 
      param("spaceId", "Space ID is required").notEmpty(),
      param("shareSecret", "Share Secret is required").notEmpty(),
    ],
    removeSpaceShareLink
);

// Create file share link
router.post(
    "/file/:fileId",
    authenticateToken,
    verifyAccountOwnershipOrAdmin,
    [
        param("fileId", "File ID is required").notEmpty(),
        body("maxDownloads").optional({ nullable: true }).isInt().withMessage("Max Downloads must be an integer"),
        body("expiresAt").optional({ nullable: true }).isISO8601().withMessage("ExpiresAt must be ISO8601 date"),
        body("notes", "Notes must be a string").isString(),
    ],
    addFileShareLink
);

// Modify file share link
router.patch(
    "/file/:fileId/:shareSecret",
    authenticateToken,
    verifyAccountOwnershipOrAdmin,
    [
        param("fileId", "File ID is required").notEmpty(),
        param("shareSecret", "Share Secret is required").notEmpty(),
        body("maxDownloads").optional({ nullable: true }).isInt().withMessage("Max Downloads must be an integer"),
        body("expiresAt").optional({ nullable: true }).isISO8601().withMessage("ExpiresAt must be ISO8601 date"),
        body("notes", "Notes must be a string").isString(),
    ],
    modifyFileShareLink
);

// Create space share link
router.post(
    "/space/:spaceId",
    authenticateToken,
    verifyAccountOwnershipOrAdmin,
    [
        param("spaceId", "Space ID is required").notEmpty(),
        body("expiresAt").optional({ nullable: true }).isISO8601().withMessage("ExpiresAt must be ISO8601 date"),
        body("notes", "Notes must be a string").isString(),
    ],
    addSpaceShareLink
);

// Modify space share link
router.patch(
    "/space/:spaceId/:shareSecret",
    authenticateToken,
    verifyAccountOwnershipOrAdmin,
    [
        param("spaceId", "Space ID is required").notEmpty(),
        param("shareSecret", "Share Secret is required").notEmpty(),
        body("expiresAt").optional({ nullable: true }).isISO8601().withMessage("ExpiresAt must be ISO8601 date"),
        body("notes", "Notes must be a string").isString(),
        body("maxDownloads").optional({ nullable: true }).isInt().withMessage("Max Downloads must be an integer"),
    ],
    modifySpaceShareLink
);

export default router;

import express from "express";
import { body, param, query} from "express-validator";
import { authenticateToken } from "../middlewares/authenticateToken";
import { verifyAccountOwnershipOrAdmin } from "../middlewares/authMiddleware";
import { addFileShareLink, addSpaceShareLink, removeFileShareLink, removeSpaceShareLink, verifyFileShareLink, verifySpaceShareLink, 
    getSpaceInfoGuest, guestDownloadFile, guestDownloadAllFiles, modifySpaceShareLink, modifyFileShareLink, getSpaceShareInfo, getfileShareInfo
 } from "../controllers/shareController";

const router = express.Router();

// Route for adding a file share link
router.post(
    "/file/:fileId",
    authenticateToken,
    verifyAccountOwnershipOrAdmin,
    [
        param("fileId", "File ID is required").notEmpty(),
        body("maxDownloads", "Max Downloads is required").optional().isInt(),
        body("expiresAt", "Time Limit is in minutes")
            .optional({ nullable: true })
            .isISO8601()
    ],
    addFileShareLink
);

// Route to update the time limit and max downloads of a file share link
router.patch(
    "/file/:fileId",
    authenticateToken,
    verifyAccountOwnershipOrAdmin,
    [
        param("fileId", "File ID is required").notEmpty(),
        body("maxDownloads", "Max Downloads is required").optional().isInt(),
        body("expiresAt", "Time Limit is in minutes")
            .optional({ nullable: true })
            .isISO8601()
    ],
    modifyFileShareLink
);

// Route for adding a space share link
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
)


router.get(
    "/space/:spaceId",
    authenticateToken,
    verifyAccountOwnershipOrAdmin,
    getSpaceShareInfo
)

router.get(
    "/file/:fileId",
    authenticateToken,
    verifyAccountOwnershipOrAdmin,
    getfileShareInfo
)

// Route for removing a file share link
router.delete(
    "/file/:fileId",
    authenticateToken,
    verifyAccountOwnershipOrAdmin,
    [
        param("fileId", "File ID is required").notEmpty(),
    ],
    removeFileShareLink
);

// Route for removing a space share link
router.delete(
    "/space/:id",
    authenticateToken,
    verifyAccountOwnershipOrAdmin,
    [
        param("spaceId", "Space ID is required").notEmpty(),
    ],
    removeSpaceShareLink
);

// Route for verifying a file share link
router.get(
    "/file/verify",
    [
        query("shareUrl", "Share Secret is required").notEmpty(),
    ],
    verifyFileShareLink
);

router.get(
    "space/:spaceId/access",
    [
        query("spacePassword").optional().isString().withMessage("Space Password must be a String"),
    ],
    getSpaceInfoGuest
)

// Route for verifying a space share link
router.post(
    "/space/verify",
    [
        query("shareUrl", "Share Secret is required").notEmpty(),
    ],
    verifySpaceShareLink
);

// Route for guest downloading a file
router.get(
    "/file/:fileId/download",
    [
        param("fileId", "File ID is required").notEmpty(),
        query("filePassword").optional().isString().withMessage("File Password must be a String"),
    ],
    guestDownloadFile
);


// Route for guest downloading all files in a space
router.get(
    "/space/:spaceId/downloadAll",
    [
        param("spaceId", "Space ID is required").notEmpty()
    ],
    guestDownloadAllFiles
);
export default router;
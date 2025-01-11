import express from "express";
import { body, param } from "express-validator";
import multer from "multer";
import { authenticateToken } from "../middlewares/authenticateToken";
import { verifyFileOwnershipOrAdmin} from "../middlewares/authMiddleware";
import { fileUpload, fileDelete, fileRename, getFileInfo, lockFile, unlockFile, downloadFile} from "../controllers/fileController";

const router = express.Router();
const upload = multer({ dest: 'uploads/' });

// Route for uploading a file
router.post("/", authenticateToken, upload.single('file'),  [ body("spaceId", "Space ID is required")], fileUpload);

// Route for deleting a file
router.delete("/:fileId", authenticateToken, verifyFileOwnershipOrAdmin, fileDelete);

// Route for renaming a file
router.put(
    "/:fileId",
    [
        param("fileId", "File ID is required").not().isEmpty(),
        body("newFileName", "New File Name is required").not().isEmpty(),
    ],
    authenticateToken, verifyFileOwnershipOrAdmin, fileRename
);

// Route for getting file info
router.get(
    "/:fileId",
    [
        param("fileId", "File ID is required").not().isEmpty(),
    ], 
    authenticateToken, getFileInfo
);

router.patch(
    "/:fileId/lock",
    
    [
        param("fileId", "File ID is required").not().isEmpty(),
        body("password", "Password is required to lock the file").isString(),
        body("repeatPassword", "Repeat Password should not be blank").isString()
    ],
    authenticateToken,
    verifyFileOwnershipOrAdmin, 
    lockFile 
);

router.get(
    "/:fileId/download",
    [
        param("fileId", "File ID is required").not().isEmpty(),
    ],
    authenticateToken,
    verifyFileOwnershipOrAdmin,
    downloadFile
)

router.patch(
    "/:fileId/unlock",
    [
        param("fileId", "File ID is required").not().isEmpty(),
        body("password", "Password is required").isString(),
    ],
    authenticateToken, // Ensure the user is authenticated
    verifyFileOwnershipOrAdmin, // Ensure the user owns the file or is an admin
    unlockFile // Controller to handle unlocking
);

export default router;
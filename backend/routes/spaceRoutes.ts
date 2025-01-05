import express from "express";
import { body, param, query } from "express-validator";
import { authenticateToken } from "../middlewares/authenticateToken";
import { verifySpaceOwnershipOrAdmin} from "../middlewares/authMiddleware";
import { 
    deleteSpace,
    createSpace,
    updateSpace,
    downloadAllFiles,
    lockSpace,
    unlockSpace,
    getSpaceInfo,
} from "../controllers/spaceController";

const router = express.Router();

// Route for creating a space
router.post(
    "/",
    authenticateToken,
    [body("spaceName", "Space Name is required").not().isEmpty()],
    createSpace
);

// Route for deleting a space
router.delete(
    "/:spaceId",
    [
        param("spaceId", "Space ID is required").not().isEmpty(),
    ],
    authenticateToken,
    verifySpaceOwnershipOrAdmin,
    deleteSpace
);

router.get(
    "/:spaceId",
    authenticateToken,
    verifySpaceOwnershipOrAdmin,
    getSpaceInfo
);

// Route for updating a space
router.put(
    "/:spaceId",
    [
        param("spaceId", "Space ID is required").not().isEmpty(),
        body("newSpaceName", "New Space Name is required").not().isEmpty(),
    ],
    authenticateToken,
    verifySpaceOwnershipOrAdmin,
    updateSpace
);

// Route for downloading all files in a space
router.get(
    "/:spaceId/downloadAll",
    [
        param("spaceId", "Space ID is required").not().isEmpty(),
    ],
    authenticateToken,
    verifySpaceOwnershipOrAdmin,
    downloadAllFiles
);


// Route for locking a space
router.patch(
    "/:spaceId/lock",
    [
        param("spaceId", "Space ID is required").not().isEmpty(),
        body("password", "Password is required to lock the space").not().isEmpty(),
        body("repeatPassword", "Repeat Password is required").not().isEmpty(),
    ],
    authenticateToken, 
    verifySpaceOwnershipOrAdmin,
    lockSpace 
);

// Route for unlocking a space
router.patch(
    "/:spaceId/unlock",
    [
        param("spaceId", "Space ID is required").not().isEmpty(),
        body("password", "Password is required to unlock the space").not().isEmpty(),
    ],
    authenticateToken, 
    verifySpaceOwnershipOrAdmin, 
    unlockSpace 
);

export default router;

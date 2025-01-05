import express from "express";
import { body } from "express-validator";
import { authenticateToken } from "../middlewares/authenticateToken";
import { verifyAccountOwnershipOrAdmin, verifySpaceOwnershipOrAdmin } from "../middlewares/authMiddleware";
import { deleteAccount, resetPassword, changeUserName, changeProfilePic, getAllSpaces, getUserInfo} from "../controllers/userController";
import multer from "multer";

const router = express.Router();
const upload = multer({ dest: 'uploads/' });

// Route for deleting an account
router.delete("/deleteAccount", authenticateToken, verifyAccountOwnershipOrAdmin, deleteAccount);

// Route for resetting a password
router.put(
    "/password",
    authenticateToken,
    verifyAccountOwnershipOrAdmin,
    [
        body("currentPassword", "Current Password is required").notEmpty(),
        body("newPassword", "New Password must be 8 or more characters").isString().isLength({ min: 8 }),
        body("repeatPassword", "Repeat Password must be 8 or more characters").isString().isLength({ min: 8 }),
    ],
    resetPassword
);

// Route for changing a username
router.put(
    "/name",
    authenticateToken,
    verifyAccountOwnershipOrAdmin,
    [
        body("newUsername", "New Username is required").notEmpty(),
    ],
    changeUserName
);

// Route for changing a profile picture
router.put(
    "/profile",
    authenticateToken,
    verifyAccountOwnershipOrAdmin,
    upload.single("profilePic"), // Multer middleware to handle file upload
    changeProfilePic
);

// Route for getting user information
router.get(
    "/",
    authenticateToken,
    verifyAccountOwnershipOrAdmin,
    getUserInfo
)

// Route for getting space information
router.get(
    "/spaces",
    authenticateToken,
    verifyAccountOwnershipOrAdmin,
    getAllSpaces
)
export default router;

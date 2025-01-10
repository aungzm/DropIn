import express from "express";
import { param } from "express-validator";
import { authenticateToken } from "../middlewares/authenticateToken";
import { verifyAccountIsAdmin, notDemotingSelf, noteDeletingSelf } from "../middlewares/authMiddleware";
import { getAllUsers, deleteUser, promoteUser, getUserProfilePic, demoteUser } from "../controllers/adminController";

const router = express.Router();

// Route for getting all users (RESTful)
router.get("/users", authenticateToken, verifyAccountIsAdmin, getAllUsers);

router.get("/users/:userId/profile", [param("userId", "User ID is required").isUUID()], authenticateToken, verifyAccountIsAdmin, getUserProfilePic);

// Route for deleting a user by ID 
router.delete("/users/:userId",
    [param("userId", "User ID is required").isUUID()], 
    authenticateToken, 
    verifyAccountIsAdmin, 
    noteDeletingSelf,
    deleteUser
);

router.put("/users/:userId/promote", [param("id", "User ID is required").isUUID()], authenticateToken, verifyAccountIsAdmin, promoteUser);

router.put("/users/:userId/demote", [param("id", "User ID is required").isUUID()], authenticateToken, verifyAccountIsAdmin, notDemotingSelf, demoteUser);

export default router;

import express from "express";
import { param } from "express-validator";
import { authenticateToken } from "../middlewares/authenticateToken";
import { verifyAccountIsAdmin } from "../middlewares/authMiddleware";
import { getAllUsers, deleteUser, promoteUser } from "../controllers/adminController";

const router = express.Router();

// Route for getting all users (RESTful)
router.get("/users", authenticateToken, verifyAccountIsAdmin, getAllUsers);

// Route for deleting a user by ID 
router.delete("/users/:userId",
    [param("id", "User ID is required").isUUID()], 
    authenticateToken, 
    verifyAccountIsAdmin, 
    deleteUser
);

router.put("/users/:userId/promote", [param("id", "User ID is required").isUUID()], authenticateToken, verifyAccountIsAdmin, promoteUser);



export default router;

import express from "express";
import { body } from "express-validator";
import { authenticateToken, } from "../middlewares/authenticateToken";
import { registerUser, loginUser, refreshAccessToken, logoutUser}  from "../controllers/authController";

const router = express.Router();
// Route for registering a user
router.post(
"/register",
[
    body("username", "Username is required").not().isEmpty(),
    body("email", "Email is required").isEmail(),
    body("password", "Password must be 6 or more characters").isLength({
        min: 6,
    }),
    body("repeatPassword", "Repeat Password must be 6 or more characters").isLength({
        min: 6,
    }),
],
registerUser
);

// Route for logging in a user
router.post(
"/login",
[
    body("username", "Username or Email must be entered").not().isEmpty(),
    body("password", "Password is required").exists(),
],
loginUser
);

router.get("/access-token", refreshAccessToken);

router.post("/logout",authenticateToken,logoutUser)


export default router;
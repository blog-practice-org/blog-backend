import express from "express";
import {
  deleteAccount,
  getProfile,
  login,
  logout,
  signUp,
} from "../controllers/authController.js";
import { authenticateToken } from "../middleware/auth.js";

const router = express.Router();

router.post("/signup", signUp);
router.post("/login", login);
router.get("/profile", getProfile);
router.post("/logout", logout);
router.delete("/delete-account", authenticateToken, deleteAccount);

export default router;

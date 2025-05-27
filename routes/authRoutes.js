import express from "express";
import {
  getProfile,
  login,
  logout,
  signUp,
} from "../controllers/authController.js";

const router = express.Router();

router.post("/signup", signUp);
router.post("/login", login);
router.get("/profile", getProfile);
router.post("/logout", logout);

export default router;

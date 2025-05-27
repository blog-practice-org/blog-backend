import express from "express";
import {
  getUserComments,
  getUserInfo,
  getUserLikedPosts,
  getUserPosts,
  updateUser,
} from "../controllers/userController.js";
import { authenticateToken } from "../middleware/auth.js";

const router = express.Router();

router.get("/:id", getUserInfo);
router.get("/:id/posts", getUserPosts);
router.get("/:id/comments", getUserComments);
router.get("/:id/likes", getUserLikedPosts);
router.put("/update", authenticateToken, updateUser);

export default router;

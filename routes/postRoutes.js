import express from "express";
import { authenticateToken } from "../middleware/auth.js";
import { upload } from "../middleware/upload.js";
import {
  createPost,
  deletePost,
  getPostById,
  getPosts,
  toggleLike,
  updatePost,
} from "../controllers/postController.js";

const router = express.Router();

router.post("/", authenticateToken, upload.single("files"), createPost);
router.get("/", getPosts);
router.get("/:postId", getPostById);
router.put("/:postId", authenticateToken, upload.single("files"), updatePost);
router.delete("/:postId", authenticateToken, deletePost);
router.post("/:postId/like", authenticateToken, toggleLike);

export default router;

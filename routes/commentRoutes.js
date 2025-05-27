import express from "express";
import { authenticateToken } from "../middleware/auth.js";
import {
  createComment,
  deleteComment,
  getCommentByPostId,
  updateComment,
} from "../controllers/commentController.js";

const router = express.Router();

router.post("/", authenticateToken, createComment);
router.get("/:postId", getCommentByPostId);
router.put("/:commentId", authenticateToken, updateComment);
router.delete("/:commentId", authenticateToken, deleteComment);

export default router;

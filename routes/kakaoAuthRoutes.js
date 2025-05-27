import express from "express";
import {
  kakaoCallback,
  kakaoLogin,
} from "../controllers/kakaoAuthController.js";

const router = express.Router();

router.get("/login", kakaoLogin);
router.get("/callback", kakaoCallback);

export default router;

import express from "express";
import cors from "cors";
import dotenv from "dotenv";
import cookieParser from "cookie-parser";
import mongoose from "mongoose";
import bcrypt from "bcryptjs";
import jwt from "jsonwebtoken";
import { userModel } from "./model/user.js";

dotenv.config();

const app = express();
const port = process.env.PORT || 3000;

app.use(
  cors({
    origin: process.env.FRONTEND_URL || "http://localhost:5173",
    credentials: true, // 쿠키 전송 위함
    methods: ["GET", "POST", "PUT", "DELETE"],
    allowedHeaders: ["Content-Type", "Authorization"],
  })
);
app.use(express.json());
app.use(cookieParser());

mongoose
  .connect(process.env.MONGODB_URI, {
    dbName: process.env.MONGODB_DB_NAME,
  })
  .then(() => {
    console.log("MongoDB 연결됨");
  })
  .catch((err) => {
    console.log("MongoDB 연결 실패 ", err);
  });

const saltRounds = parseInt(process.env.BCRYPT_SALT_ROUNDS);
const secretKey = process.env.JWT_SECRET;
const tokenLife = process.env.JWT_EXPIRATION;

// ----------------------
// 회원가입
app.post("/signup", async (req, res) => {
  try {
    const { id, password } = req.body;

    const existingUser = await userModel.findOne({ id });
    if (existingUser) {
      return res.status(409).json({ error: "이미 존재하는 아이디입니다." });
    }

    const userDoc = new userModel({
      id,
      password: bcrypt.hashSync(password, saltRounds),
    });
    const savedUser = await userDoc.save();

    res.status(201).json({
      message: "회원가입 성공",
      userId: savedUser._id,
    });
  } catch (err) {
    console.log("회원가입 오류: ", err);
    res.status(500).json({ error: "서버 에러" });
  }
});

// 로그인
app.post("/login", async (req, res) => {
  try {
    const { id, password } = req.body;
    const userDoc = await userModel.findOne({ id });
    if (!userDoc) return res.status(401).json({ error: "없는 사용자입니다." });

    const passwordCheck = bcrypt.compareSync(password, userDoc.password);
    if (!passwordCheck) {
      return res.status(401).json({ error: "비밀번호가 틀렸습니다." });
    } else {
      const { _id, id } = userDoc;
      const payload = { _id, id };
      const token = jwt.sign(payload, secretKey, {
        expiresIn: tokenLife,
      });

      res
        .cookie("token", token, {
          httpOnly: true,
          maxAge: 1000 * 60 * 60,
        })
        .json({
          userId: userDoc.userId,
        });
    }
  } catch (error) {
    console.error("로그인 오류: ", error);
    res.status(500).json({ error: "로그인 실패" });
  }
});

// 회원 정보 조회
app.get("/profile", (req, res) => {
  const { token } = req.cookies;
  if (!token) return res.json({ error: "로그인이 필요합니다." });

  jwt.verify(token, secretKey, (err, info) => {
    if (err) return res.json({ error: "로그인이 필요합니다." });
    res.json(info);
  });
});

// 로그아웃
app.post("/logout", (req, res) => {
  res
    .cookie("token", "", {
      httpOnly: true,
      maxAge: 0,
    })
    .json({ message: "로그아웃 되었습니다." });
});

app.listen(port, () => {
  console.log(`${port}번 포트에서 실행 중`);
});

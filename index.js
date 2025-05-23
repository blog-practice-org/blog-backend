import express from "express";
import cors from "cors";
import dotenv from "dotenv";
import cookieParser from "cookie-parser";
import mongoose from "mongoose";
import bcrypt from "bcryptjs";
import jwt from "jsonwebtoken";

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
    dbName: process.env.MOGODB_DB_NAME,
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

app.listen(port, () => {
  console.log(`${port}번 포트에서 실행 중`);
});

import dotenv from "dotenv";
import express from "express";
import cors from "cors";
import cookieParser from "cookie-parser";
import path from "path";
import { fileURLToPath } from "url";

dotenv.config();

// 라우트 가져오기
import authRoutes from "./routes/authRoutes.js";
import postRoutes from "./routes/postRoutes.js";
import commentRoutes from "./routes/commentRoutes.js";
import userRoutes from "./routes/userRoutes.js";

// 데이터베이스 연결
import connectDB from "./config/db.js";

// 에러 핸들러
import { errorHandler } from "./utils/errorHandler.js";

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

// 정적 파일 제공 설정
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
app.use("/uploads", express.static(path.join(__dirname, "uploads")));

// 데이터베이스 연결
connectDB();

// 라우트 설정
app.use("/auth", authRoutes);
app.use("/posts", postRoutes);
app.use("/comments", commentRoutes);
app.use("/users", userRoutes);

// 기본 루트 경로 핸들러 추가
app.get("/", (req, res) => {
  res.send("백엔드 서버가 정상적으로 작동하고 있습니다.");
});

// 404 처리 - 정의되지 않은 경로에 대한 처리
app.use((req, res) => {
  res.status(404).json({ error: "요청한 페이지를 찾을 수 없습니다." });
});

// 에러 핸들러 미들웨어
app.use(errorHandler);

// 서버 시작
app.listen(port, () => {
  console.log(`${port}번 포트에서 실행 중`);
});

// 프로세스 종료 시 처리
process.on("SIGINT", () => {
  console.log("서버를 종료합니다.");
  process.exit(0);
});

// 예기치 않은 에러 처리
process.on("uncaughtException", (err) => {
  console.error("예기치 않은 에러:", err);
  process.exit(1);
});

export default app;

import express from "express";
import cors from "cors";
import dotenv from "dotenv";
import cookieParser from "cookie-parser";
import mongoose from "mongoose";
import bcrypt from "bcryptjs";
import jwt from "jsonwebtoken";
import multer from "multer";
import path from "path";
import fs from "fs";
import { fileURLToPath } from "url";
import { userModel } from "./model/user.js";
import { postModel } from "./model/post.js";
import { commentModel } from "./model/comment.js";

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

const cookieOptions = {
  httpOnly: true,
  maxAge: 1000 * 60 * 60, // 1시간
  secure: process.env.NODE_ENV === "production", // HTTPS에서만 쿠키 전송
  sameSite: "strict", // CSRF 방지
  path: "/", // 모든 경로에서 쿠키 접근 가능
};

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

      res.cookie("token", token, cookieOptions).json({
        userId: _id,
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
  const logoutCookieOptions = {
    ...cookieOptions,
    maxAge: 0,
  };

  res
    .cookie("token", "", logoutCookieOptions)
    .json({ message: "로그아웃 되었습니다." });
});

// ----------------------
// __dirname 설정 (ES 모듈에서는 __dirname이 기본적으로 제공되지 않음)
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const uploadDir = "uploads";

// uploads 폴더의 파일들을 /uploads 경로로 제공
app.use("/uploads", express.static(path.join(__dirname, "uploads")));

// 정적 파일 접근 시 CORS 오류를 방지하기 위한 설정
app.get("/uploads/:filename", (req, res) => {
  const { filename } = req.params;
  res.sendFile(path.join(__dirname, "uploads", filename));
});

// 업로드 디렉토리가 없으면 생성
if (!fs.existsSync(uploadDir)) {
  fs.mkdirSync(uploadDir);
}

// multer 스토리지 설정
const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    cb(null, "uploads/");
  },
  filename: (req, file, cb) => {
    const uniqueSuffix = Date.now() + "-" + Math.round(Math.random() * 1e9);
    cb(null, uniqueSuffix + path.extname(file.originalname));
  },
});

// 기본 multer 인스턴스
const multerUpload = multer({ storage });

// ----------------------
// 포스트 등록
app.post("/postWrite", multerUpload.single("files"), async (req, res) => {
  try {
    const { title, summary, content } = req.body;
    const { token } = req.cookies;
    if (!token) {
      return res.status(401).json({ error: "로그인이 필요합니다." });
    }

    const userInfo = jwt.verify(token, secretKey);

    const postData = {
      title,
      summary,
      content,
      cover: req.file ? req.file.path : null, // 파일 경로 저장
      author: userInfo.id,
    };
    await postModel.create(postData);

    res.json({ message: "포스트 글쓰기 성공" });
  } catch (err) {
    return res.status(500).json({ error: "서버 에러" });
  }
});

// 포스트 목록 조회
app.get("/postlist", async (req, res) => {
  try {
    const page = parseInt(req.query.page) || 0; // 페이지 번호 (0부터 시작)
    const limit = parseInt(req.query.limit) || 3; // 한 페이지당 게시물 수 (기본값 3)
    const skip = page * limit; // 건너뛸 게시물 수

    // 총 게시물 수 조회
    const total = await postModel.countDocuments();

    // 페이지네이션 적용하여 게시물 조회
    const posts = await postModel
      .find()
      .sort({ createdAt: -1 }) // 최신순 정렬
      .skip(skip)
      .limit(limit);

    // 마지막 페이지 여부 확인
    const hasMore = total > skip + posts.length;

    res.json({
      posts,
      hasMore,
      total,
    });
  } catch (err) {
    console.error("게시물 조회 오류:", err);
    res.status(500).json({ error: "게시물 조회에 실패했습니다." });
  }
});

// 포스트 상세 조회
app.get("/post/:postId", async (req, res) => {
  try {
    const { postId } = req.params;
    const post = await postModel.findById(postId);
    if (!post) {
      return res.status(404).json({ error: "게시물을 찾을 수 없습니다." });
    }
    res.json(post);
  } catch (err) {
    console.error("게시물 상세 조회 오류:", err);
    res.status(500).json({ error: "게시물 상세 조회에 실패했습니다." });
  }
});

// 포스트 수정
app.put("/post/:postId", multerUpload.single("files"), async (req, res) => {
  try {
    const { postId } = req.params;
    const { title, summary, content } = req.body;
    const { token } = req.cookies;

    // 로그인 확인
    if (!token) {
      return res.status(401).json({ error: "로그인이 필요합니다." });
    }

    // 토큰 검증
    const userInfo = jwt.verify(token, secretKey);

    // 게시물 조회
    const post = await postModel.findById(postId);

    // 게시물이 존재하지 않을 경우
    if (!post) {
      return res.status(404).json({ error: "게시물을 찾을 수 없습니다." });
    }

    // 작성자 확인 (자신의 글만 수정 가능)
    if (post.author !== userInfo.id) {
      return res.status(403).json({ error: "자신의 글만 수정할 수 있습니다." });
    }

    // 수정할 데이터 객체 생성
    const updateData = {
      title,
      summary,
      content,
    };

    // 새 파일이 업로드된 경우
    if (req.file) {
      //  파일 경로 업데이트
      updateData.cover = req.file.path;
      // 기존 이미지 삭제
      if (post.cover) {
        const oldImagePath = path.join(__dirname, post.cover);
        fs.unlink(oldImagePath, (err) => {
          if (err) {
            console.error("기존 이미지 삭제 실패:", err);
          }
        });
      }
    }

    // 게시물 업데이트
    const updatedPost = await postModel.findByIdAndUpdate(
      postId,
      updateData,
      { new: true } // 업데이트된 문서 반환
    );

    res.json({
      message: "게시물이 수정되었습니다.",
      post: updatedPost,
    });
  } catch (err) {
    console.error("게시물 수정 오류:", err);
    res.status(500).json({ error: "게시물 수정에 실패했습니다." });
  }
});

// 포스트 삭제
app.delete("/post/:postId", async (req, res) => {
  try {
    const { postId } = req.params;
    const post = await postModel.findByIdAndDelete(postId);
    if (!post) {
      return res.status(404).json({ error: "게시물을 찾을 수 없습니다." });
    }
    res.json({ message: "게시물이 삭제되었습니다." });
  } catch (err) {
    res.status(500).json({ error: "게시물 삭제에 실패했습니다." });
  }
});

// 포스트 좋아요 토글
app.post("/like/:postId", async (req, res) => {
  try {
    const { postId } = req.params;
    const { token } = req.cookies;

    // 로그인 확인
    if (!token) {
      return res.status(401).json({ error: "로그인이 필요합니다." });
    }

    // 토큰 검증
    const userInfo = jwt.verify(token, secretKey);

    const post = await postModel.findById(postId);
    if (!post) {
      return res.status(404).json({ error: "게시물을 찾을 수 없습니다." });
    }

    const likeIndex = post.likes.findIndex(
      (id) => id.toString() === userInfo._id
    );
    if (likeIndex > -1) {
      post.likes.splice(likeIndex, 1);
    } else {
      post.likes.push(userInfo._id);
    }

    await post.save();
    res.json(post);
  } catch (err) {
    res.status(500).json({ error: "좋아요 토글 기능 오류" });
  }
});

// ----------------------
// 댓글 등록
app.post("/comments", async (req, res) => {
  try {
    const { content, author, postId } = req.body;

    const newComment = await commentModel.create({
      content,
      author,
      postId,
    });

    res.status(201).json(newComment);
  } catch (error) {
    res.status(500).json({ error: "댓글 작성에 실패했습니다." });
  }
});

// 댓글 목록 조회
app.get("/comments/:postId", async (req, res) => {
  try {
    const { postId } = req.params;
    const comments = await commentModel
      .find({ postId })
      .sort({ createdAt: -1 });

    res.json(comments);
  } catch (err) {
    res.status(500).json({ error: "댓글 목록 조회에 실패했습니다." });
  }
});
app.listen(port, () => {
  console.log(`${port}번 포트에서 실행 중`);
});

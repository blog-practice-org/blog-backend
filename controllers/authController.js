import bcrypt from "bcryptjs";
import jwt from "jsonwebtoken";
import dotenv from "dotenv";
import { cookieOptions, secretKey, tokenLife } from "../config/jwt.js";
import { User } from "../models/User.js";
import { Post } from "../models/Post.js";
import { Comment } from "../models/Comment.js";

dotenv.config();

const saltRounds = parseInt(process.env.BCRYPT_SALT_ROUNDS);

// 회원가입
export const signUp = async (req, res) => {
  try {
    const { id, password } = req.body;

    const existingUser = await User.findOne({ id });
    if (existingUser) {
      return res.status(409).json({ error: "이미 존재하는 아이디입니다." });
    }

    const userDoc = new User({
      id,
      password: bcrypt.hashSync(password, saltRounds),
    });
    await userDoc.save();

    res.status(201).json({
      message: "회원가입 성공",
    });
  } catch (err) {
    res.status(500).json({ error: "회원가입에 실패했습니다." });
  }
};

// 로그인
export const login = async (req, res) => {
  try {
    const { id, password } = req.body;
    const userDoc = await User.findOne({ id });
    if (!userDoc)
      return res.status(401).json({ error: "존재하지 않는 사용자입니다." });

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
    res.status(500).json({ error: "로그인에 실패했습니다." });
  }
};

// 로그아웃
export const logout = (req, res) => {
  const logoutCookieOptions = {
    ...cookieOptions,
    maxAge: 0,
  };

  res
    .cookie("token", "", logoutCookieOptions)
    .json({ message: "로그아웃 되었습니다." });
};

// 본인 정보 조회
export const getProfile = (req, res) => {
  const { token } = req.cookies;
  if (!token) return res.json({ error: "로그인이 필요합니다." });

  jwt.verify(token, secretKey, (err, info) => {
    if (err) return res.json({ error: "로그인이 필요합니다." });
    res.json(info);
  });
};

// 회원 탈퇴
export const deleteAccount = async (req, res) => {
  try {
    const userId = req.user._id;
    const id = req.user.id;

    // 사용자가 작성한 댓글 삭제
    await Comment.deleteMany({ author: id });
    // 사용자가 작성한 게시물 삭제
    await Post.deleteMany({ author: id });
    // 사용자가 좋아요한 게시물에서 사용자 ID 제거
    await Post.updateMany({ likes: userId }, { $pull: { likes: userId } });
    // 사용자 계정 삭제
    await User.findByIdAndDelete(userId);

    // 쿠키 제거 (로그아웃 처리)
    const logoutCookieOptions = {
      ...cookieOptions,
      maxAge: 0,
    };

    res
      .cookie("token", "", logoutCookieOptions)
      .json({ message: "계정이 성공적으로 삭제되었습니다." });
  } catch (err) {
    console.log(err);
    res.status(500).json({ error: "회원 탈퇴에 실패했습니다." });
  }
};

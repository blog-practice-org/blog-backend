import bcrypt from "bcryptjs";
import dotenv from "dotenv";
import { User } from "../models/user.js";
import { Post } from "../models/post.js";
import { Comment } from "../models/comment.js";

dotenv.config();

const saltRounds = parseInt(process.env.BCRYPT_SALT_ROUNDS);

// 특정 사용자 정보 조회
export const getUserInfo = async (req, res) => {
  try {
    const { id } = req.params;

    const user = await User.findOne({ id }, { password: 0 });
    if (!user) {
      return res.status(404).json({ error: "사용자를 찾을 수 없습니다." });
    }

    res.json(user);
  } catch (err) {
    res.status(500).json({ error: "사용자 정보 조회에 실패했습니다." });
  }
};

// 특정 사용자가 작성한 포스트 조회
export const getUserPosts = async (req, res) => {
  try {
    const { id } = req.params;

    const posts = await Post.find({ author: id }).sort({ createdAt: -1 });
    res.json(posts);
  } catch (err) {
    res.status(500).json({ error: "사용자 게시물 조회에 실패했습니다." });
  }
};

// 특정 사용자가 작성한 댓글 조회
export const getUserComments = async (req, res) => {
  try {
    const { id } = req.params;

    const comments = await Comment.find({ author: id }).sort({ createdAt: -1 });
    res.json(comments);
  } catch (err) {
    res.status(500).json({ error: "사용자 댓글 조회에 실패했습니다." });
  }
};

// 특정 사용자가 좋아요 클릭한 포스트 조회
export const getUserLikedPosts = async (req, res) => {
  try {
    const { id } = req.params;

    const user = await User.findOne({ id });
    if (!user) {
      return res.status(404).json({ error: "사용자를 찾을 수 없습니다." });
    }

    // 사용자가 좋아요한 게시물 찾기
    const likedPosts = await Post.find({ likes: user._id }).sort({
      createdAt: -1,
    });

    res.json(likedPosts);
  } catch (err) {
    res
      .status(500)
      .json({ error: "사용자 좋아요 게시물 조회에 실패했습니다." });
  }
};

// 본인 정보 수정
export const updateUser = async (req, res) => {
  try {
    const { password } = req.body;
    const userId = req.user._id;
    const updateData = {};

    if (password) {
      updateData.password = bcrypt.hashSync(req.body.password, saltRounds);
    }

    const updatedUser = await User.findByIdAndUpdate(userId, updateData, {
      new: true,
      select: "-password",
    });

    res.json({
      message: "사용자 정보가 수정되었습니다.",
      user: updatedUser,
    });
  } catch (err) {
    res.status(500).json({ error: "사용자 정보 수정에 실패했습니다." });
  }
};

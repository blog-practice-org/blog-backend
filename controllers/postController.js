import path from "path";
import fs from "fs";
import { fileURLToPath } from "url";
import { Comment } from "../models/comment.js";
import { Post } from "../models/post.js";

// 포스트 등록
export const createPost = async (req, res) => {
  try {
    const { title, summary, content } = req.body;

    const postData = {
      title,
      summary,
      content,
      cover: req.file ? req.file.path : null, // 파일 경로 저장
      author: req.user.id,
    };

    await Post.create(postData);

    res.json({ message: "게시물 글쓰기 성공" });
  } catch (err) {
    console.log(err);
    return res.status(500).json({ error: "게시물 글쓰기에 실패했습니다." });
  }
};

// 포스트 목록 조회
export const getPosts = async (req, res) => {
  try {
    const page = parseInt(req.query.page) || 0; // 페이지 번호 (0부터 시작)
    const limit = parseInt(req.query.limit) || 3; // 한 페이지당 게시물 수 (기본값 3)
    const skip = page * limit; // 건너뛸 게시물 수

    // 총 게시물 수 조회
    const total = await Post.countDocuments();

    // 페이지네이션 적용하여 게시물 조회
    const posts = await Post.find()
      .sort({ createdAt: -1 }) // 최신순 정렬
      .skip(skip)
      .limit(limit);

    // 각 포스트의 댓글 수 조회
    const postsWithCommentCounts = await Promise.all(
      posts.map(async (post) => {
        const commentCount = await Comment.countDocuments({
          postId: post._id,
        });
        const postObject = post.toObject();
        postObject.commentCount = commentCount;
        return postObject;
      })
    );

    // 마지막 페이지 여부 확인
    const hasMore = total > skip + posts.length;

    res.json({
      posts: postsWithCommentCounts,
      hasMore,
      total,
    });
  } catch (err) {
    res.status(500).json({ error: "게시물 목록 조회에 실패했습니다." });
  }
};

// 포스트 상세 조회
export const getPostById = async (req, res) => {
  try {
    const { postId } = req.params;

    const post = await Post.findById(postId);
    if (!post) {
      return res.status(404).json({ error: "게시물을 찾을 수 없습니다." });
    }

    // 댓글 수 조회
    const commentCount = await Comment.countDocuments({ postId });

    // 응답 객체 생성
    const postWithCommentCount = post.toObject();
    postWithCommentCount.commentCount = commentCount;

    res.json(postWithCommentCount);
  } catch (err) {
    res.status(500).json({ error: "게시물 상세 조회에 실패했습니다." });
  }
};

// 포스트 수정
export const updatePost = async (req, res) => {
  try {
    const { postId } = req.params;
    const { title, summary, content } = req.body;

    // 게시물 조회
    const post = await Post.findById(postId);
    // 게시물이 존재하지 않을 경우
    if (!post) {
      return res.status(404).json({ error: "게시물을 찾을 수 없습니다." });
    }

    // 작성자 확인 (자신의 글만 수정 가능)
    if (post.author !== req.user.id) {
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
      const __filename = fileURLToPath(import.meta.url);
      const __dirname = path.dirname(__filename);
      const uploadDir = path.join(__dirname, "..");

      if (post.cover) {
        const oldImagePath = path.join(uploadDir, post.cover);
        fs.unlink(oldImagePath, (err) => {
          if (err) {
            console.error("기존 이미지 삭제에 실패: ", err);
          }
        });
      }
    }

    // 게시물 업데이트
    const updatedPost = await Post.findByIdAndUpdate(
      postId,
      updateData,
      { new: true } // 업데이트된 문서 반환
    );

    res.json({
      message: "게시물이 수정되었습니다.",
      post: updatedPost,
    });
  } catch (err) {
    res.status(500).json({ error: "게시물 수정에 실패했습니다." });
  }
};

// 포스트 삭제
export const deletePost = async (req, res) => {
  try {
    const { postId } = req.params;

    const post = await Post.findByIdAndDelete(postId);
    if (!post) {
      return res.status(404).json({ error: "게시물을 찾을 수 없습니다." });
    }

    res.json({ message: "게시물이 삭제되었습니다." });
  } catch (err) {
    res.status(500).json({ error: "게시물 삭제에 실패했습니다." });
  }
};

// 포스트 좋아요 토글
export const toggleLike = async (req, res) => {
  try {
    const { postId } = req.params;
    const userId = req.user._id;

    const post = await Post.findById(postId);
    if (!post) {
      return res.status(404).json({ error: "게시물을 찾을 수 없습니다." });
    }

    const likeIndex = post.likes.findIndex((id) => id.toString() === userId);
    if (likeIndex > -1) {
      post.likes.splice(likeIndex, 1);
    } else {
      post.likes.push(userId);
    }

    await post.save();
    res.json(post);
  } catch (err) {
    res.status(500).json({ error: "좋아요 토글 기능에 오류가 발생했습니다." });
  }
};

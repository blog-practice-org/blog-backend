import { Comment } from "../models/Comment.js";

// 댓글 등록
export const createComment = async (req, res) => {
  try {
    const { content, author, postId } = req.body;

    const newComment = await Comment.create({
      content,
      author,
      postId,
    });

    res.status(201).json(newComment);
  } catch (error) {
    res.status(500).json({ error: "댓글 작성 실패했습니다." });
  }
};

// 댓글 조회
export const getCommentByPostId = async (req, res) => {
  try {
    const { postId } = req.params;
    const comments = await Comment.find({ postId }).sort({ createdAt: -1 });

    res.json(comments);
  } catch (err) {
    res.status(500).json({ error: "댓글 조회에 실패했습니다." });
  }
};

// 댓글 수정
export const updateComment = async (req, res) => {
  try {
    const { commentId } = req.params;
    const { content } = req.body;

    // 댓글 조회
    const comment = await Comment.findById(commentId);
    // 댓글이 존재하지 않을 경우
    if (!comment) {
      return res.status(404).json({ error: "댓글을 찾을 수 없습니다." });
    }

    // 댓글 작성자만 수정할 수 있도록 권한 체크
    if (comment.author !== req.user.id) {
      return res
        .status(403)
        .json({ error: "자신의 댓글만 수정할 수 있습니다." });
    }

    // 댓글 업데이트
    const updatedComment = await Comment.findByIdAndUpdate(
      commentId,
      { content },
      { new: true }
    );

    res.json(updatedComment);
  } catch (err) {
    res.status(500).json({ error: "게시물 수정에 실패했습니다." });
  }
};

// 댓글 삭제
export const deleteComment = async (req, res) => {
  try {
    const { commentId } = req.params;

    const comment = await Comment.findById(commentId);
    if (!comment) {
      return res.status(404).json({ message: "댓글을 찾을 수 없습니다." });
    }

    // 댓글 작성자만 삭제할 수 있게 권한 체크
    if (comment.author !== req.user.id) {
      return res
        .status(403)
        .json({ error: "자신의 댓글만 삭제할 수 있습니다." });
    }

    await Comment.findByIdAndDelete(commentId);
    res.json({ message: "댓글이 삭제되었습니다." });
  } catch (err) {
    res.status(500).json({ error: "댓글 삭제에 실패했습니다." });
  }
};

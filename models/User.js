import mongoose from "mongoose";

const { Schema, model } = mongoose;

const userSchema = new Schema(
  {
    id: {
      type: String,
      required: true,
      unique: true,
    },
    password: {
      type: String,
      // 카카오 로그인 사용자는 password가 필요 없음
      required: function () {
        return !this.kakaoId;
      },
    },
    // 카카오 로그인을 위한 필드 추가
    kakaoId: {
      type: String,
      sparse: true,
      unique: true,
    },
    profileImage: String,
  },
  {
    timestamps: true,
  }
);

export const User = model("User", userSchema);

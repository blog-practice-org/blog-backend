import dotenv from "dotenv";

dotenv.config();

export const secretKey = process.env.JWT_SECRET;
export const tokenLife = process.env.JWT_EXPIRATION;

export const cookieOptions = {
  httpOnly: true,
  maxAge: 1000 * 60 * 60, // 1시간
  secure: true, // HTTPS에서만 쿠키 전송
  sameSite: "none", // 크로스 도메인 요청 허용
  path: "/", // 모든 경로에서 쿠키 접근 가능
};

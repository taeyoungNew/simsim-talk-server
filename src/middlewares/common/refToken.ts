import jwt, { SignOptions } from "jsonwebtoken";
// import dotenv from "dotenv";

// refToken생성
export const refreshToken = (userId: string, email: string) => {
  const refToken = jwt.sign(
    { userId, email },
    process.env.SECRET_REFTOKEN_KEY,
    { expiresIn: process.env.REFTOKEN_EXPIRE as SignOptions["expiresIn"] },
  );
  return refToken;
};

import jwt from "jsonwebtoken";
import dotenv from "dotenv";

// accToken생성
export const accessToken = (userId: string, email: string) => {
  dotenv.config();
  try {
    const accToken = jwt.sign(
      { userId, email },
      process.env.SECRET_ACCTOKEN_KEY,
      {
        expiresIn: process.env.ACCTOKEN_EXPIRE,
      },
    );
    return accToken;
  } catch (error) {
    throw error;
  }
};

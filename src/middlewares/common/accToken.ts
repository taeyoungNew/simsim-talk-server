import jwt, { SignOptions } from "jsonwebtoken";
// import dotenv from "dotenv";

// accToken생성
export const accessToken = (userId: string, email: string) => {
  const secretAcctokenKey = process.env.SECRET_ACCTOKEN_KEY;
  const acctokenExpire = process.env.ACCTOKEN_EXPIRE;
  if (!secretAcctokenKey || !acctokenExpire) {
    throw new Error("SECRET_ACCTOKEN_KEY is missing");
  }

  // dotenv.config();
  try {
    const accToken = jwt.sign({ userId, email }, secretAcctokenKey, {
      expiresIn: acctokenExpire as SignOptions["expiresIn"],
    });
    return accToken;
  } catch (error) {
    throw error;
  }
};

import logger from "../../config/logger";
import { tokenType } from "../../types/tokenType";
import jwt, { JwtPayload } from "jsonwebtoken";

interface AccessTokenPayload {
  userId: string;
  email: string;
  iat: number;
  exp: number;
}

// 토큰이 유효한지 확인
const verifyAccToken = (tokenPayment: tokenType) => {
  logger.info("", {
    layer: "middlewares/common",
    functionName: "verifyAccToken",
  });
  const { token, type } = tokenPayment;

  const secretKey =
    type === "accToken"
      ? process.env.SECRET_ACCTOKEN_KEY
      : process.env.SECRET_REFTOKEN_KEY;
  try {
    const decoded = jwt.verify(String(token), secretKey) as AccessTokenPayload;

    return decoded;
  } catch (error: any) {
    if (error.name === "TokenExpiredError") {
      return "jwt exired";
    }
  }
};

export default verifyAccToken;

import AuthRepository from "../repositories/authRepository";
import bcrypt from "bcrypt";
import errorCodes from "../constants/error-codes.json";
import { CustomError } from "../errors/customError";

class AuthService {
  authRepository = new AuthRepository();
  // refToken저장
  public saveRefToken = async (refToken: string, userId: string) => {
    try {
      await this.authRepository.saveRefToken(refToken, userId);
    } catch (error) {
      throw error;
    }
  };

  //
  public logoutUser = async (userId: string) => {
    try {
      await this.authRepository.logoutUser(userId);
    } catch (error) {
      throw error;
    }
  };

  /**
   * PW確認モジュール
   *
   * @param password 入力パスワード
   * @param exPassword DB上のパスワード
   *
   */
  public validPassword = (password: string, exPassword: string) => {
    const result = bcrypt.compareSync(password, exPassword);
    if (!result)
      throw new CustomError(
        errorCodes.AUTH.PASSWORD_INVALID.status,
        errorCodes.AUTH.PASSWORD_INVALID.code,
        "패스워드가 일치하지않습니다.",
      );
  };
}

export default AuthService;

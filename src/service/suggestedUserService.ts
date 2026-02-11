import SuggestedUserRepository from "../repositories/suggestedUserRepository";

class SuggestedUserService {
  private suggestedUserRepository = new SuggestedUserRepository();
  public getSuggestedUsers = async (userId: string) => {
    try {
      const getSuggestedUsersResult =
        await this.suggestedUserRepository.getSuggestedUsers(userId);

      const getPoplarUsersResult =
        await this.suggestedUserRepository.getPopularUsers(userId);
      const payment = {
        mutual: getSuggestedUsersResult,
        popular: getPoplarUsersResult,
      };
      return payment;
    } catch (error) {
      throw error;
    }
  };
}

export default SuggestedUserService;

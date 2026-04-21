import { postCache } from "../postCache";

export const deletePostsCache = async (postIds: any) => {
  if (postIds.length) {
    const keys = postIds.map((id: number) => `post:${id}`);
    await postCache.del(...keys);
  }
};

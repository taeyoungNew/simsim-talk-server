import { userPostsCache } from "../userPostsCache";

export const deleteUserPostsCache = async (userId: string) => {
  const key = `userPosts:${userId}:List`;
  const postIds = await userPostsCache.lRange(key, 0, -1);
  console.log("postIds = ", postIds);

  if (postIds.length) {
    const keys = postIds.map((id: number) => `post:${id}`);
    await userPostsCache.del(...keys);
  }
  await userPostsCache.del(key);
  return postIds;
};

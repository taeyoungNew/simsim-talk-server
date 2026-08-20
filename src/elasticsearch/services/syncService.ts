import { elasticClient } from "../../config/elasticClient";
import { POST_INDEX_NAME } from "../mappings/postMapping";
import { PostDocument } from "../documents/postDocument";
import PostService from "../../service/postService";
import Posts from "../../database/models/posts";

const BATCH_SIZE = 1000;

export const syncAllPostsToElastic = async () => {
  try {
    const postService = new PostService();
    const allPosts = await postService.getAllPosts();

    if (!allPosts || allPosts.length === 0) {
      console.log("ℹ️ [Bulk Sync] 동기화할 RDB 데이터가 존재하지 않습니다.");
      return;
    }

    console.log(
      `📦 총 ${allPosts.length}건의 데이터를 ${BATCH_SIZE}건씩 나누어 이관합니다.`,
    );

    for (let idx = 0; idx < allPosts.length; idx += BATCH_SIZE) {
      const chunk = allPosts.slice(idx, idx + BATCH_SIZE);

      const operations = chunk.flatMap((post: Posts) => [
        { index: { _index: POST_INDEX_NAME, _id: String(post.id) } },
        {
          id: post.id,
          userId: post.userId,
          content: post.content,
          createAt: post.createdAt,
        } as PostDocument,
      ]);

      const response = await elasticClient.bulk({
        refresh: true,
        operations,
      });

      if (response.errors) {
        console.error(
          `⚠️ [Chunk ${idx / BATCH_SIZE + 1}] 일부 문서 색인 중 에러 발생`,
        );
      } else {
        console.log(
          `✅ [Chunk ${idx / BATCH_SIZE + 1}] ${chunk.length}건 색인 완료`,
        );
      }
    }
    console.log("🎉 [Bulk Sync] 모든 데이터 동기화가 성공적으로 끝났습니다.");
  } catch (error) {
    console.error("❌ [Bulk Sync] 동기화 작업 중 치명적 에러 발생:", error);
    throw error;
  }
};

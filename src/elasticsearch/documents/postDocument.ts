import { elasticClient } from "../../config/elasticClient";
import { POST_INDEX_NAME } from "../mappings/postMapping";

export interface PostDocument {
  id: number;
  userId: string;
  content: string;
  createAt: Date | string;
}

// 1. 게시물 색인 (생성 및 전체 덮어쓰기)
export const indexPostDocument = async (post: PostDocument) => {
  return await elasticClient.index({
    index: POST_INDEX_NAME,
    id: String(post.id),
    document: post,
  });
};

// 2. 게시물 부분 수정 (수정된 필드만 업데이트)
export const updatePostDocument = async (
  id: number,
  updatedFields: Partial<Omit<PostDocument, "id">>,
) => {
  return await elasticClient.update({
    index: POST_INDEX_NAME,
    id: String(id),
    doc: updatedFields,
  });
};

// 3. 게시물 삭제
export const deletePostDocument = async (id: number) => {
  return await elasticClient.delete({
    index: POST_INDEX_NAME,
    id: String(id),
  });
};

// 4. 게시물 본문 검색 (페이징 포함)
export const searchPostsDocument = async (
  keyword: string,
  page = 1,
  size = 10,
) => {
  const from = (page - 1) * size;

  const response = await elasticClient.search<PostDocument>({
    index: POST_INDEX_NAME,
    from,
    size,
    query: {
      match: {
        content: {
          query: keyword,
        },
      },
    },
    sort: [
      { createAt: { order: "desc" } }, // 최신순 정렬
    ],
  });

  const totalHits =
    typeof response.hits.total === "number"
      ? response.hits.total
      : response.hits.total?.value || 0;

  const posts = response.hits.hits.map((hit) => hit._source as PostDocument);

  return {
    total: totalHits,
    page,
    size,
    posts,
  };
};

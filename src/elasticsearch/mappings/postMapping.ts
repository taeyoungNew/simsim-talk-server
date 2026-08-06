import {
  IndicesAddBlockRequest,
  IndicesCreateRequest,
} from "@elastic/elasticsearch/lib/api/types";

export const POST_INDEX_NAME = "simsimtalk_posts";

export const postIndexMapping: IndicesCreateRequest = {
  index: POST_INDEX_NAME,

  settings: {
    analysis: {
      tokenizer: {
        nori_user_dict: {
          type: "nori_tokenizer",
          decompound_mode: "mixed", // '심심톡' 같은 복합어를 단어별/합성어 둘 다 추출
        },
      },
      filter: {
        nori_pos_filter: {
          type: "nori_part_of_speech",
          // 불필요한 조사, 구두점, 접속사 등을 검색 대상에서 제외
          stoptags: [
            "E",
            "IC",
            "J",
            "MAG",
            "MAJ",
            "MM",
            "SP",
            "SSC",
            "SSO",
            "SC",
            "SE",
          ],
        },
      },
      analyzer: {
        korean_analyzer: {
          type: "custom",
          tokenizer: "nori_user_dict",
          filter: ["lowercase", "nori_pos_filter"],
        },
      },
    },
  },
  mappings: {
    properties: {
      id: { type: "integer" },
      userId: { type: "text" },
      content: { type: "text" },
      createAt: { type: "date" },
    },
  },
};

import {} from "@elastic/elasticsearch";

export const POST_INDEX_NAME = "simsimtalk_posts";

export const postIndexMapping = {
  index: POST_INDEX_NAME,

  settings: {
    analysis: {
      tokenizer: {
        nori_user_dict: {
          type: "nori_tokenizer",
          decompound_mode: "mixed", // '심심톡' 같은 복합어를 단어별/합성어 둘 다 추출
        },
        // 2 ~ 10글자단위로 자르는 ngram토크나이저 추가
        custom_ngram_tokenizer: {
          type: "ngram",
          min_gram: 1,
          max_gram: 10,
          token_chars: ["letter", "digit"],
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
        // 💡 부분 검색용 ngram 분석기
        ngram_analyzer: {
          type: "custom",
          tokenizer: "custom_ngram_tokenizer",
          filter: ["lowercase"],
        },
      },
    },
  },
  mappings: {
    properties: {
      id: { type: "integer" },
      userId: { type: "keyword" },
      content: {
        type: "text",
        analyzer: "korean_analyzer",
        fields: {
          ngram: {
            type: "text",
            analyzer: "ngram_analyzer", // 색인할 때: 글자를 조각내서 저장
            search_analyzer: "lowercase", // 💡 검색할 때: 검색어를 쪼개지 않고 검색
          },
        },
      },
      createAt: { type: "date" },
    },
  },
};

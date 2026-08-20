import { connectElastic } from "../elasticSearchConnect";
import { syncAllPostsToElastic } from "../services/syncService";

const run = async () => {
  try {
    // 1. 엘라스틱서치 연결 및 인덱스 상태 체크
    await connectElastic();

    // 2. 벌크 동기화 실행
    await syncAllPostsToElastic();

    console.log("🚀 작업 완료. 프로세스를 종료합니다.");
    process.exit(0);
  } catch (error) {
    console.error("💥 동기화 실패로 프로세스를 종료합니다.", error);
    process.exit(1);
  }
};

run();

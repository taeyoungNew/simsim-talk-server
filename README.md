# 1. Server Overview

실시간 채팅 및 SNS기능을 포함한 웹서비스입니다.
Socket.io기반 이벤트 아키텍처로 채팅, 알람, 온라인 상태를 실시간 동기화하며
멀티 디바이스 환경에서도 일관된 사용자 경험을 제공하도록 설계했습니다.

# 2. Tech Stack

- Node.js + Express + TypeScript
- Sequelize
- MySQL
- Redis
- Socket.io
- R2 cloud

# 3. Architecture / System Flow

![Architecture](docs/architecture.svg)

# 4. Key Features

- HttpOnly Cookie JWT
- Socket.io realtime chatting
- Socket.io realtime alarms
- Redis Cache memories
- Suggested Self Join SQL
- Socket Authorization
- PairKey chatroom duplicate prevention

# 5. Database Design

https://www.erdcloud.com/d/w9njzRfzpWvDmivwm

# 6. API Overview

POST /auth/login
GET /auth/me
POST /posts
GET /chatrooms
POST /alarms/read

# 7. Socket Events

joinChatRoom
sendMessage
receiveMessage
loginJoinOnlineRoom
heartbeat
sendAlarm

# 8. Environment Variables

PORT=""

## cors

CORS_ORIGIN=""

## DB

DB_USERNAME=""
DB_PASSWORD=""
DB_DATABASE=""
DB_HOST=""
DB_DIALECT=""
DB_PORT=""

## JWT

SECRET_ACCTOKEN_KEY=""
SECRET_REFTOKEN_KEY=""
ACCTOKEN_EXPIRE=""
REFTOKEN_EXPIRE=""

## bcrypt

SALT_ROUND=10

## Redis

REDIS_HOST=""
REDIS_PORT=""
REDIS_PASSWORD=""
REDIS_NAME=""

## R2

R2_PUBLIC_URL=""
R2_END_POINT=""
R2_ACCESS_KEY_ID=""
R2_SECRET_ACCESS_KEY=""

R2_ACCOUNT_ID=""
R2_BUCKET_NAME=""

POST_DEFUALT_TTL=""

# 9. Getting Started

npm install
npm run dev

# 10. Deployment

Railway Server

Railway MySQL

Railway Redis

# 11. Troubleshooting

## 1) 유저 페이지 재방문 시 게시물이 로드되지 않는 문제 — 2025-11-06

### 이슈 상황

같은 유저 페이지에 연속으로 접속할 경우 게시물이 로드되지 않는 문제가 발생했다.
특히 홀수 번째 접속은 정상, 짝수 번째 접속은 빈 결과가 반환되는 패턴을 보였다.

### 증상

서버 요청 및 Redis 캐시는 정상 동작

페이지 진입 직후 isLast = true 상태가 됨

postLastId가 이전 방문의 마지막 게시물 ID를 유지

서버가 “마지막 페이지”로 판단하여 게시물을 반환하지 않음

### 원인 분석

유저 페이지 이탈 후 재진입 과정에서 다음 타이밍 문제가 발생했다.

Redux store의 getUserPostDatas를 페이지 진입 시 초기화

그러나 초기화 완료 전에 postLastId가 먼저 계산됨

React 렌더 타이밍과 상태 비동기 갱신 타이밍 불일치 발생

이전 페이지의 마지막 게시물 ID가 서버로 전달됨

let postLastId =
getUserPostDatas[getUserPostDatas.length - 1]?.id ?? null;

결과적으로 서버는 이미 마지막 페이지까지 조회된 것으로 판단했다.

### 시도한 해결 방법

resetPosts 시 isLast까지 초기화 → 실패

페이지 진입 시 posts 배열 강제 초기화 → 실패

렌더/상태 갱신 타이밍 경쟁 조건 지속

### 해결 방법

유저 페이지 상태 초기화 시점을 페이지 진입 시점 → 페이지 이탈 시점(unmount) 으로 변경했다.

이를 통해:

다음 페이지 진입 전에 store가 완전히 초기화됨

첫 렌더에서 postLastId = null 보장

pagination 상태 일관성 확보

### 회고

React 상태 초기화는 “언제 초기화할 것인가”가 중요하다.
페이지 진입 시 초기화는 렌더 타이밍과 경쟁할 수 있으며,
페이지 이탈 시 cleanup이 더 안전한 상태 초기화 전략이 될 수 있다.

# 12. Design Decisions

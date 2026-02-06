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

![simsimtalk.drawio.svg](attachment:888465ec-093c-4b7a-b706-75b6c87d9d8d:simsimtalk.drawio.svg)

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

PORT=

## cors

CORS_ORIGIN=""

## DB

DB_USERNAME=
DB_PASSWORD=
DB_DATABASE=
DB_HOST=
DB_DIALECT=""
DB_PORT=

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

POST_DEFUALT_TTL=

# 9. Getting Started

npm install
npm run dev

# 10. Deployment

Railway Server

Railway MySQL

Railway Redis

# 11. Troubleshooting

# 12. Design Decisions

# 📘 SimSimTalk Backend

リアルタイムチャットおよびSNS機能を提供するバックエンドサーバーです。
Socket.ioベースのイベントアーキテクチャにより、チャット・通知・オンライン状態をリアルタイム同期し、
マルチデバイス環境でも一貫したユーザー状態を維持できるよう設計しています。

# 🛠 Tech Stack

Node.js + Express + TypeScript
Sequelize
MySQL
Redis
Socket.io
Cloudflare R2

# 🏗 Architecture / System Flow

![Architecture](docs/architecture.svg)

# ✨ Key Features

- HttpOnly Cookie JWT認証
- リフレッシュトークン再発行
- Socket.io リアルタイムチャット
- Socket.io リアルタイム通知
- オンラインユーザー管理
- Redis キャッシュ戦略
- カーソルベース無限スクロール
- 双方向ユーザーブロック機能
- PairKeyによるチャットルーム重複防止
- Cloudflare R2画像ストレージ
- Socket認証

# 🗄 Database Design

https://www.erdcloud.com/d/w9njzRfzpWvDmivwm

# 🔌 API Overview

POST /auth/login
GET /auth/me
POST /posts
GET /chatrooms
POST /alarms/read

# 🔄 Socket Events

joinChatRoom
sendMessage
receiveMessage
loginJoinOnlineRoom
heartbeat
sendAlarm

# ⚙️ Environment Variables

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

# 🚀 Getting Started

npm install
npm run dev

# ☁️ Deployment

Railway Server
Railway MySQL
Railway Redis

# 🐞 Troubleshooting

## 1️⃣ ユーザーページ再訪問時に投稿が取得できない問題 — 2025-11-06

問題状況

同じユーザーページに連続でアクセスすると投稿が取得できない問題が発生。
特に「奇数回は正常・偶数回は空結果」というパターンが確認された。

### 症状

サーバーリクエストおよびRedisキャッシュは正常

ページ遷移直後に isLast = true

前回訪問時の最後の投稿IDが postLastId に残存

サーバーが「最終ページ」と判断し投稿を返さない

### 原因

ページ再訪問時に以下のタイミング競合が発生していた。

Redux store の投稿配列をページ 入場時 に初期化

しかし初期化完了前に postLastId が計算される

Reactレンダーと状態更新の非同期タイミング不一致

前回ページの最後のIDがサーバーに送信

let postLastId =
getUserPostDatas[getUserPostDatas.length - 1]?.id ?? null;

### 解決

状態初期化タイミングを
ページ入場時 → ページ離脱時（unmount） に変更。

次回入場前にstore完全初期化

初回レンダーで postLastId=null 保証

ページネーション整合性確保

### 学び

Reactの状態初期化は「いつ行うか」が重要。
入場時初期化はレンダーと競合しやすく、
離脱時cleanupの方が安全なケースがある。

## 2️⃣ Access Token再発行時のRedisキャッシュ不整合 — 2025-11-07

問題状況

Access Token期限切れ後、Refresh Tokenで再発行すると
トークンは発行されるが認証ユーザー取得に失敗。

### 症状

Refresh Token有効

Access Token再発行成功

Redisユーザーキャッシュ取得結果がnull

CookieのTokenとRedisキーが不一致

### 原因

ログイン時、Access TokenをキーにRedisへユーザー情報を保存していたが、
再発行時にキャッシュキー更新を行っていなかった。

新Access Token発行

Redisキーは旧Tokenのまま

新Tokenで検索 → キャッシュミス

### 解決

トークン再発行時にキャッシュ同期処理を追加。

旧Tokenキー削除

新Tokenキーで再キャッシュ

トークンとキャッシュキーの一致を保証。

### 学び

トークンベースキャッシュでは
トークン再発行＝キャッシュキー更新必須。
認証状態とキャッシュ寿命はセットで管理すべき。

## 3️⃣ 初回ログイン時のオンラインソケットイベント未受信 — 2026-01-19

### 問題状況

サーバー起動後の最初のログインのみ
オンライン状態が表示されない。

### 症状

loginJoinOnlineRoom送信

サーバー未受信

ソケット接続は存在

client側 socket.id = undefined

### 原因

ログイン時のソケット再接続処理が非同期で、
接続完了前にイベント送信していた。

### 既存フロー:

reconnectSocket()

即loginイベント送信

未接続状態

サーバー未受信

### 解決

connect完了後にログインイベント送信へ変更。

socket.disconnect();
socket.connect();

socket.once("connect", () => {
loginSocket(userId);
});

接続完了状態でのみイベント送信保証。

### 学び

WebSocketは単純イベントではなく
接続状態依存の非同期システム。
イベント送信は接続完了後に保証すべき。

export interface Post {
  id: number;
  profileUrl: string;
  userId: string;
  userNickname: string;
  content: string;
  likeCnt: number;
  isLiked: boolean;
  commentCnt: number;
  Comments: Comment[];
}

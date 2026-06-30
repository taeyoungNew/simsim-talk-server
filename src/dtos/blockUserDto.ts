import Post from "../database/models/posts";

export interface BlockUserDto {
  blockerId: string;
  blockedId: string;
}

export interface UnBlockUserDto {
  blockerId: string;
  blockedId: string;
}

export interface BlockUserListDto {
  userId: string;
}

export interface FilterBlockedPostsDto {
  userId: string;
  posts: Post[];
  limit?: number;
  lastPostId?: number;
}

export interface filterBlockedCommtDto {
  post: Post;
  blockedIds?: Set<any>;
  userId?: string;
}

export interface FindBlockRelationDto {
  myId: string;
  userId: string;
}

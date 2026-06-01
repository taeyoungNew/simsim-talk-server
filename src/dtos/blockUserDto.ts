import { Post } from "../types/postType";

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
}

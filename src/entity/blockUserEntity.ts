export interface BlockUserEntity {
  blockerId: string;
  blockedId: string;
}

export interface UnBlockUserEntity {
  blockerId: string;
  blockedId: string;
}

export interface BlockUserListEntity {
  userId: string;
}

export interface FindBlockRelationEntity {
  myId: string;
  userId: string;
}

export interface FollowingEntity {
  userId?: string;
  followingId: string;
}

export interface StopFollowingEntity {
  userId: string;
  followingId: string;
}

export interface GetFollowingsEntity {
  userId: string;
}

export interface GetFollowersEntity {
  userId: string;
}

export interface RemoveRelationshipEntity {
  userId1: string;
  userId2: string;
}

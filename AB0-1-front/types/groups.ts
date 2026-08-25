export type GroupVisibility = 'public' | 'private' | 'private_visible' | 'private_hidden' | string;
export type GroupMembershipMode = 'open' | 'approval' | 'invite_only' | string;
export type GroupStatus = 'draft' | 'active' | 'archived' | 'suspended' | string;
export type GroupMembershipStatus = 'pending' | 'active' | 'rejected' | 'left' | 'banned' | string;
export type GroupMembershipRole = 'member' | 'moderator' | 'admin' | 'owner' | string;

export interface GroupMembership {
  id: number;
  group_id: number;
  user_id: number;
  role: GroupMembershipRole;
  status: GroupMembershipStatus;
  joined_at: string | null;
  approved_at: string | null;
  notifications_level: string;
}

export interface GroupPermissions {
  can_join: boolean;
  can_leave: boolean;
  can_post: boolean;
  can_invite: boolean;
  can_moderate: boolean;
  can_manage_members: boolean;
}

export interface GroupStats {
  members: number;
  posts: number;
}

export interface Group {
  id: number;
  name: string;
  slug: string;
  short_description: string | null;
  visibility: GroupVisibility;
  official: boolean;
  verified: boolean;
  featured: boolean;
  stats: GroupStats;
  membership: GroupMembership | null;
  permissions: GroupPermissions;
  description?: string | null;
  membership_mode?: GroupMembershipMode;
  posting_mode?: string;
  status?: GroupStatus;
  category_id?: number | null;
  created_at?: string | null;
  updated_at?: string | null;
}

export interface GroupMember {
  id: number;
  user: {
    id: number;
    name: string | null;
    avatar_url: string | null;
  };
  role: GroupMembershipRole;
  joined_at: string | null;
}

export interface GroupTopic {
  id: number;
  group_id: number;
  name: string;
  slug: string;
  description: string | null;
  position: number;
  posts_count: number;
}

export interface GroupRule {
  id: number;
  group_id: number;
  title: string;
  description: string | null;
  position: number;
}

export interface GroupPost {
  id: number;
  title: string | null;
  body: string;
  status: 'published' | 'hidden' | 'removed' | string;
  pinned: boolean;
  comments_enabled: boolean;
  created_at: string;
  updated_at: string;
  author: {
    id: number;
    name: string | null;
    avatar_url: string | null;
  };
  topic: {
    id: number;
    name: string;
    slug: string;
  } | null;
  permissions: {
    can_edit: boolean;
    can_delete: boolean;
    can_moderate: boolean;
  };
}

export interface GroupsQuery {
  search?: string;
  category?: number;
  featured?: boolean;
  view?: 'active' | 'featured' | 'new';
}
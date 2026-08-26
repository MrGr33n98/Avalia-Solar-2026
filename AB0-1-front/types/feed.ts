export interface FeedFollowable {
  type: 'ReviewerProfile' | 'Company' | 'Category';
  id: number;
}

export interface FeedActor {
  id: number;
  type: 'user' | 'company' | 'creator' | string;
  name: string;
  display_name?: string;
  avatar_url?: string | null;
  logo_url?: string | null;
  headline?: string | null;
  slug?: string | null;
  verified?: boolean;
  followable?: FeedFollowable | null;
}

export interface FeedSubject {
  id: number;
  title?: string;
  slug?: string;
  excerpt?: string;
  body?: string;
  cover_image_url?: string;
  publication_type?: string;
  views_count?: number;
  shares_count?: number;
  category?: string | null;
  share_url?: string;
  og_image_url?: string;
  rating?: number;
  headline?: string;
  comment?: string;
  group?: { id: number; name?: string; slug?: string; visibility?: string };
  topic?: { id: number; name: string; slug?: string } | null;
  comments_enabled?: boolean;
  company?: {
    id: number;
    name: string;
    slug?: string;
    logo_url?: string;
    rating?: number;
    category_name?: string;
  };
}

export interface PublicationEntityItem {
  relation_type: 'mentioned' | 'used' | 'recommended' | 'related' | 'sponsored';
  entity_type: 'company' | 'product' | 'category' | string;
  entity: {
    id: number;
    name: string;
    slug?: string;
  };
}

export interface FeedEngagement {
  reactions_count: number;
  comments_count: number;
  viewer_reaction?: string | null;
  saved: boolean;
  viewer_following: boolean;
}

export interface FeedItem {
  id: string;
  type: 'reviewer_publication' | 'review' | 'group_post' | string;
  verb: string;
  published_at: string;
  actor: FeedActor;
  author?: FeedActor;
  subject: FeedSubject;
  entities: PublicationEntityItem[];
  engagement: FeedEngagement;
}

export interface FeedResponse {
  data: FeedItem[];
  meta: {
    next_cursor: string | null;
    has_more: boolean;
    trending_topics?: string[];
  };
}

export interface CommentItem {
  id: number;
  body: string;
  status: string;
  created_at: string;
  user: {
    id: number;
    name: string;
  };
  replies?: CommentItem[];
}

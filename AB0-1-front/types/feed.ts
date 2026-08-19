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
}

export interface FeedSubject {
  id: number;
  title?: string;
  slug?: string;
  excerpt?: string;
  body?: string;
  cover_image_url?: string;
  rating?: number;
  headline?: string;
  comment?: string;
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
}

export interface FeedItem {
  id: string;
  type: 'reviewer_publication' | 'review' | string;
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

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
  source_name?: string;
  source_url?: string | null;
  reading_time_minutes?: number;
  poll_ends_at?: string | null;
  viewer_vote_id?: number | null;
  total_votes?: number;
  options?: PollOptionDTO[];
}

export interface PollOptionDTO {
  id: number;
  text?: string;
  label?: string;
  votes_count: number;
  percentage?: number;
  selected?: boolean;
}

export type NewsFeedSubject = FeedSubject & { source_name: string; summary?: string };
export type PollFeedSubject = FeedSubject & { options: PollOptionDTO[]; viewer_vote_id?: number | null };

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
  visibility?: string;
  ranking_metadata?: { mode: string; score?: number };
  actor: FeedActor;
  author?: FeedActor;
  subject: FeedSubject;
  entities: PublicationEntityItem[];
  engagement: FeedEngagement;
  recommendation_reason?: { code: string; label: string };
}

export interface FeedResponse {
  data: FeedItem[];
  meta: {
    next_cursor: string | null;
    has_more: boolean;
    trending_topics?: TrendingTopic[];
    suggested_creators?: { id: number; name: string; slug?: string; avatar_url?: string | null }[];
    suggested_companies?: { id: number; name: string; slug?: string; logo_url?: string | null; rating?: number | string }[];
    suggested_groups?: { id: number; name: string; slug?: string }[];
  };
}

export interface TrendingTopic {
  slug: string;
  label: string;
  publications_count: number;
  velocity?: number;
  category?: string;
}

export interface CommentItem {
  id: number;
  body: string;
  status: string;
  created_at: string;
  user: {
    id: number;
    name: string;
    avatar_url?: string;
  };
  replies?: CommentItem[];
}

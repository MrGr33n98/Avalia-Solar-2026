export interface ArticleCategory {
  id: number;
  name: string;
  seo_url?: string | null;
}

export interface ArticleAuthor {
  id?: number | null;
  name?: string | null;
  email?: string | null;
  avatar_url?: string | null;
  bio?: string | null;
}

export interface Article {
  id: number;
  title: string;
  slug: string;
  excerpt?: string | null;
  content: string;
  status?: string | null;
  published_at?: string | null;
  published_date?: string | null;
  views_count?: number | null;
  image_url?: string | null;
  cover_image_url?: string | null;
  reading_time_minutes?: number | null;
  sponsored?: boolean;
  sponsored_label?: string | null;
  category?: ArticleCategory | null;
  company_id?: number | null;
  author?: ArticleAuthor | null;
  author_name?: string | null;
  author_email?: string | null;
  author_avatar_url?: string | null;
  author_bio?: string | null;
  meta_title?: string | null;
  meta_description?: string | null;
  created_at?: string;
  updated_at?: string;
}

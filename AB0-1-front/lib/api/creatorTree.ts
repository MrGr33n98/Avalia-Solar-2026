import { fetchApi } from '@/lib/api';

const trackPublicEvent = async (path: string) => {
  if (typeof window === 'undefined') return;

  try {
    await fetch(`/api/v1${path}`, {
      method: 'POST',
      headers: { Accept: 'application/json' },
      credentials: 'same-origin',
      keepalive: true,
    });
  } catch {
    // Analytics failure must never affect public navigation.
  }
};

export type CreatorTreeBlockType = 'external_link' | 'whatsapp' | 'social' | 'company' | 'publication' | 'download' | 'lead_form' | 'separator';

export type CreatorTreeBlock = {
  id: number;
  block_type: CreatorTreeBlockType;
  type?: CreatorTreeBlockType;
  title: string;
  subtitle?: string | null;
  url?: string | null;
  company_id?: number | null;
  publication_id?: number | null;
  position: number;
  active: boolean;
  metadata?: Record<string, unknown>;
  clicks_count?: number;
};

export type PublicCreatorTreeBlock = Pick<CreatorTreeBlock, 'id' | 'title' | 'subtitle' | 'position' | 'metadata'> & {
  type: CreatorTreeBlockType;
  url: string | null;
};

export type PublicCreatorTreeResponse = {
  creator: {
    name: string;
    headline?: string | null;
    bio?: string | null;
    slug: string;
    avatar_url?: string | null;
    banner_url?: string | null;
    city?: string | null;
    state?: string | null;
    linkedin_url?: string | null;
    instagram_url?: string | null;
    youtube_url?: string | null;
    website_url?: string | null;
  };
  blocks: PublicCreatorTreeBlock[];
  appearance?: any; // Will use CreatorTreeAppearance from types
  theme_key?: string;
};

export function creatorTreeUrl(slug: string, origin?: string): string {
  const base = origin || (typeof window !== 'undefined' ? window.location.origin : '');
  return `${base}/creators/${encodeURIComponent(slug)}/tree`;
}

export type CreatorTreeListResponse = {
  profile: {
    public_slug?: string | null;
    creator_enabled?: boolean;
    tree_views_count?: number;
  };
  blocks: CreatorTreeBlock[];
};

export type CreatorTreeListResult = CreatorTreeListResponse | CreatorTreeBlock[];

export const creatorTreeApi = {
  list: () => fetchApi<CreatorTreeListResult>('/reviewer/tree/blocks'),
  create: (block: Partial<CreatorTreeBlock>) =>
    fetchApi<CreatorTreeBlock>('/reviewer/tree/blocks', {
      method: 'POST',
      body: JSON.stringify({ block }),
    }),
  update: (id: number, block: Partial<CreatorTreeBlock>) =>
    fetchApi<CreatorTreeBlock>(`/reviewer/tree/blocks/${id}`, {
      method: 'PATCH',
      body: JSON.stringify({ block }),
    }),
  remove: (id: number) => fetchApi<void>(`/reviewer/tree/blocks/${id}`, { method: 'DELETE' }),
  reorder: (ids: number[]) =>
    fetchApi<CreatorTreeListResult>('/reviewer/tree/blocks/reorder', {
      method: 'PATCH',
      body: JSON.stringify({ ids }),
    }),
};

export const publicCreatorTreeApi = {
  get: (slug: string) =>
    fetchApi<PublicCreatorTreeResponse>(
      `/creator_tree/${encodeURIComponent(slug)}`,
      { skipAuthRefresh: true }
    ),
  trackView: (slug: string) =>
    trackPublicEvent(`/creator_tree/${encodeURIComponent(slug)}/view`),
  trackClick: (slug: string, blockId: number) =>
    trackPublicEvent(`/creator_tree/${encodeURIComponent(slug)}/blocks/${blockId}/click`),
};

export const reviewerTreeSettingsApi = {
  get: () => fetchApi<any>('/reviewer/tree/settings'),
  update: (settings: { theme_key: string; appearance: any, config?: any }, signal?: AbortSignal) =>
    fetchApi<any>('/reviewer/tree/settings', {
      method: 'PATCH',
      body: JSON.stringify({ settings }),
      signal,
    }),
  uploadBackgroundImage: async (file: File) => {
    const formData = new FormData();
    formData.append('image', file);
    return fetchApi<{ url: string }>('/reviewer/tree/settings/background_image', {
      method: 'POST',
      body: formData,
    });
  },
};
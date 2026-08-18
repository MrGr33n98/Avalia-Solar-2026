import { fetchApi } from '@/lib/api';

export type CreatorTreeBlock = {
  id: number;
  block_type?: 'external_link' | 'whatsapp' | 'social' | 'company' | 'publication' | 'download' | 'lead_form' | 'separator';
  type?: 'external_link' | 'whatsapp' | 'social' | 'company' | 'publication' | 'download' | 'lead_form' | 'separator';
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

export type CreatorTreeListResponse = {
  profile: {
    public_slug?: string | null;
    creator_enabled?: boolean;
    tree_views_count?: number;
  };
  blocks: CreatorTreeBlock[];
};

export const creatorTreeApi = {
  list: () => fetchApi<CreatorTreeListResponse>('/reviewer/tree/blocks'),
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
    fetchApi<CreatorTreeBlock[]>('/reviewer/tree/blocks/reorder', {
      method: 'PATCH',
      body: JSON.stringify({ ids }),
    }),
};

export const publicCreatorTreeApi = {
  get: (slug: string) =>
    fetchApi<{ creator: Record<string, unknown>; blocks: CreatorTreeBlock[] }>(
      `/creator_tree/${encodeURIComponent(slug)}`,
      { skipAuthRefresh: true }
    ),
  trackClick: (slug: string, blockId: number) =>
    fetchApi(`/creator_tree/${encodeURIComponent(slug)}/blocks/${blockId}/click`, {
      method: 'POST',
      skipAuthRefresh: true,
      silent: true,
    }),
};
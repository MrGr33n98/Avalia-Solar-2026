import { fetchApi } from '@/lib/api';
import type { PublicationListResponse, ReviewerPublication } from '@/types/reviewer-publication';
export const reviewerPublicationsApi = {
  list: (params?: { status?: string; query?: string }) =>
    fetchApi<PublicationListResponse>('/reviewer/publications', { params, noCache: true }),
  get: (id: number | string) =>
    fetchApi<ReviewerPublication>(`/reviewer/publications/${id}`, { noCache: true }),
  create: (payload: Record<string, unknown>, files?: { cover?: File; attachments?: File[] }) =>
    request('POST', '/reviewer/publications', payload, files),
  update: (
    id: number | string,
    payload: Record<string, unknown>,
    files?: { cover?: File; attachments?: File[] }
  ) => request('PATCH', `/reviewer/publications/${id}`, payload, files),
  publish: (id: number | string) =>
    fetchApi<ReviewerPublication>(`/reviewer/publications/${id}/publish`, {
      method: 'POST',
      body: {},
    }),
  archive: (id: number | string) =>
    fetchApi<ReviewerPublication>(`/reviewer/publications/${id}/archive`, {
      method: 'POST',
      body: {},
    }),
  remove: (id: number | string) =>
    fetchApi<void>(`/reviewer/publications/${id}`, { method: 'DELETE' }),
};
async function request(
  method: string,
  endpoint: string,
  payload: Record<string, unknown>,
  files?: { cover?: File; attachments?: File[] }
) {
  const body = new FormData();
  Object.entries(payload).forEach(([key, value]) => {
    if (value !== undefined && value !== null) body.append(`publication[${key}]`, String(value));
  });
  if (files?.cover) body.append('cover_image', files.cover);
  files?.attachments?.forEach((file) => body.append('attachments[]', file));
  return fetchApi<ReviewerPublication>(endpoint, { method, body });
}

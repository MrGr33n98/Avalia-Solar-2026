import { buildApiUrl, getApiRequestHeaders } from '../api-config';
import { FeedResponse, CommentItem } from '@/types/feed';

async function fetchWithAuth(urlPath: string, options: RequestInit = {}): Promise<Response> {
  const fullUrl = buildApiUrl(urlPath.replace(/^\/api\/v1\//, ''));
  const headers = {
    ...getApiRequestHeaders(),
    ...(options.headers || {}),
  };
  return fetch(fullUrl, { ...options, headers });
}

export async function getFeed(params?: { view?: string; cursor?: string; limit?: number }): Promise<FeedResponse> {
  const query = new URLSearchParams();
  if (params?.view) query.append('view', params.view);
  if (params?.cursor) query.append('cursor', params.cursor);
  if (params?.limit) query.append('limit', params.limit.toString());

  const res = await fetchWithAuth(`/api/v1/feed?${query.toString()}`);
  if (!res.ok) {
    throw new Error('Falha ao carregar feed');
  }
  return res.json();
}

export async function toggleReaction(reactableType: string, reactableId: number, active: boolean): Promise<void> {
  const res = active ? await fetchWithAuth('/api/v1/reactions', { method: 'DELETE', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ reactable_type: reactableType, reactable_id: reactableId }) }) : await fetchWithAuth('/api/v1/reactions', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ reactable_type: reactableType, reactable_id: reactableId, reaction_type: 'useful' }) });
  if (!res.ok) throw new Error('Falha ao atualizar reação');
}

export async function toggleSave(saveableType: string, saveableId: number, saved: boolean): Promise<void> {
  const res = await fetchWithAuth('/api/v1/saved_items', { method: saved ? 'DELETE' : 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ saveable_type: saveableType, saveable_id: saveableId }) });
  if (!res.ok) throw new Error('Falha ao atualizar item salvo');
}

export async function toggleFollow(followableType: string, followableId: number, following: boolean): Promise<void> {
  const res = await fetchWithAuth('/api/v1/follows', { method: following ? 'DELETE' : 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ followable_type: followableType, followable_id: followableId }) });
  if (!res.ok) throw new Error('Falha ao atualizar follow');
}

export async function getComments(commentableType: string, commentableId: number): Promise<CommentItem[]> {
  const res = await fetchWithAuth(`/api/v1/comments?commentable_type=${commentableType}&commentable_id=${commentableId}`);
  if (!res.ok) throw new Error('Falha ao carregar comentários');
  const json = await res.json();
  return json.data;
}

export async function postComment(commentableType: string, commentableId: number, body: string, parentId?: number): Promise<CommentItem> {
  const res = await fetchWithAuth('/api/v1/comments', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      commentable_type: commentableType,
      commentable_id: commentableId,
      body,
      parent_id: parentId,
    }),
  });
  if (!res.ok) throw new Error('Falha ao publicar comentário');
  const json = await res.json();
  return json.data;
}

export async function deleteComment(commentId: number): Promise<void> {
  const res = await fetchWithAuth(`/api/v1/comments/${commentId}`, {
    method: 'DELETE',
  });
  if (!res.ok) throw new Error('Falha ao excluir comentário');
}

export async function createReport(reportableType: string, reportableId: number, reason: string, details?: string): Promise<void> {
  const res = await fetchWithAuth('/api/v1/content_reports', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      reportable_type: reportableType,
      reportable_id: reportableId,
      reason,
      details,
    }),
  });
  if (!res.ok) throw new Error('Falha ao enviar denúncia');
}

import { buildApiUrl, getApiRequestHeaders } from '@/lib/api-config';
import type {
  Group,
  GroupMember,
  GroupMembership,
  GroupPost,
  GroupRule,
  GroupsQuery,
  GroupTopic,
  ContentReport,
} from '@/types/groups';

export class GroupsApiError extends Error {
  status: number;
  code?: string;

  constructor(message: string, status: number, code?: string) {
    super(message);
    this.name = 'GroupsApiError';
    this.status = status;
    this.code = code;
  }
}

async function request<T>(path: string, init: RequestInit = {}): Promise<T> {
  const response = await fetch(buildApiUrl(path), {
    ...init,
    cache: 'no-store',
    credentials: 'include',
    headers: {
      ...getApiRequestHeaders(),
      ...(init.body ? { 'Content-Type': 'application/json' } : {}),
      ...init.headers,
    },
  });

  const payload = await response.json().catch(() => null);
  if (!response.ok) {
    const error = payload?.error || payload;
    throw new GroupsApiError(
      error?.message || 'Não foi possível carregar esta comunidade',
      response.status,
      error?.code
    );
  }

  return payload?.data as T;
}

export async function getGroups(params: GroupsQuery = {}): Promise<Group[]> {
  const query = new URLSearchParams();
  if (params.search) query.set('search', params.search);
  if (params.category !== undefined) query.set('category', String(params.category));
  if (params.featured !== undefined) query.set('featured', String(params.featured));
  if (params.view) query.set('view', params.view);
  const suffix = query.toString();
  const data = await request<Group[]>(`groups${suffix ? `?${suffix}` : ''}`);

  if (!Array.isArray(data)) {
    throw new GroupsApiError(
      'Resposta inválida da API de comunidades: esperava uma lista',
      500,
      'INVALID_RESPONSE'
    );
  }

  return data;
}

export function createGroup(group: {
  name: string;
  slug: string;
  description: string;
  short_description?: string;
  visibility: string;
  membership_mode: string;
  posting_mode: string;
  category_id?: number | null;
}): Promise<Group> {
  return request<Group>('groups', {
    method: 'POST',
    body: JSON.stringify({ group }),
  });
}

export function getGroup(slug: string, headers?: HeadersInit): Promise<Group> {
  return request<Group>(`groups/${encodeURIComponent(slug)}`, { headers });
}

export async function getMembership(slug: string): Promise<GroupMembership | null> {
  try {
    return await request<GroupMembership | null>(`groups/${encodeURIComponent(slug)}/membership`);
  } catch (error) {
    if (error instanceof GroupsApiError && error.status === 401) return null;
    throw error;
  }
}

export function joinGroup(slug: string): Promise<GroupMembership> {
  return request<GroupMembership>(`groups/${encodeURIComponent(slug)}/join`, { method: 'POST' });
}

export function leaveGroup(slug: string): Promise<GroupMembership | null> {
  return request<GroupMembership | null>(`groups/${encodeURIComponent(slug)}/join`, { method: 'DELETE' });
}

export function getMembers(slug: string, headers?: HeadersInit): Promise<GroupMember[]> {
  return request<GroupMember[]>(`groups/${encodeURIComponent(slug)}/members`, { headers });
}

export function getTopics(slug: string, headers?: HeadersInit): Promise<GroupTopic[]> {
  return request<GroupTopic[]>(`groups/${encodeURIComponent(slug)}/topics`, { headers });
}

export function getRules(slug: string, headers?: HeadersInit): Promise<GroupRule[]> {
  return request<GroupRule[]>(`groups/${encodeURIComponent(slug)}/rules`, { headers });
}

export function getGroupPosts(slug: string, params: { topic?: number; sort?: 'recent' | 'oldest'; page?: number; per_page?: number } = {}, headers?: HeadersInit): Promise<GroupPost[]> {
  const query = new URLSearchParams();
  Object.entries(params).forEach(([key, value]) => { if (value !== undefined) query.set(key, String(value)); });
  const suffix = query.toString();
  return request<GroupPost[]>(`groups/${encodeURIComponent(slug)}/posts${suffix ? `?${suffix}` : ''}`, { headers });
}
export function getGroupPost(slug: string, postId: string | number, headers?: HeadersInit): Promise<GroupPost> {
  return request<GroupPost>(`groups/${encodeURIComponent(slug)}/posts/${encodeURIComponent(postId)}`, { headers });
}

export function createGroupPost(slug: string, post: { title?: string; body: string; group_topic_id?: number }): Promise<GroupPost> {
  return request<GroupPost>(`groups/${encodeURIComponent(slug)}/posts`, { method: 'POST', body: JSON.stringify({ post }) });
}

export function pinGroupPost(slug: string, postId: number): Promise<void> {
  return request<void>(`groups/${encodeURIComponent(slug)}/posts/${postId}/pin`, { method: 'POST' });
}

export function unpinGroupPost(slug: string, postId: number): Promise<void> {
  return request<void>(`groups/${encodeURIComponent(slug)}/posts/${postId}/pin`, { method: 'DELETE' });
}

export function closeGroupPostComments(slug: string, postId: number): Promise<void> {
  return request<void>(`groups/${encodeURIComponent(slug)}/posts/${postId}/close_comments`, { method: 'POST' });
}

export function openGroupPostComments(slug: string, postId: number): Promise<void> {
  return request<void>(`groups/${encodeURIComponent(slug)}/posts/${postId}/open_comments`, { method: 'POST' });
}

export function hideGroupPost(slug: string, postId: number): Promise<void> {
  return request<void>(`groups/${encodeURIComponent(slug)}/posts/${postId}/hide`, { method: 'POST' });
}

export function deleteGroupPost(slug: string, postId: number): Promise<void> {
  return request<void>(`groups/${encodeURIComponent(slug)}/posts/${postId}`, { method: 'DELETE' });
}

export function getPendingRequests(slug: string): Promise<GroupMember[]> {
  return request<GroupMember[]>(`groups/${encodeURIComponent(slug)}/requests`);
}

export function approveMembershipRequest(slug: string, id: number): Promise<void> {
  return request<void>(`groups/${encodeURIComponent(slug)}/requests/${id}/approve`, { method: 'POST' });
}

export function rejectMembershipRequest(slug: string, id: number): Promise<void> {
  return request<void>(`groups/${encodeURIComponent(slug)}/requests/${id}/reject`, { method: 'POST' });
}

export function updateMemberRole(slug: string, id: number, role: 'member' | 'moderator'): Promise<void> {
  return request<void>(`groups/${encodeURIComponent(slug)}/members/${id}`, {
    method: 'PATCH',
    body: JSON.stringify({ role }),
  });
}

export function suspendMember(slug: string, id: number): Promise<void> {
  return request<void>(`groups/${encodeURIComponent(slug)}/members/${id}/suspend`, { method: 'POST' });
}

export function restoreMember(slug: string, id: number): Promise<void> {
  return request<void>(`groups/${encodeURIComponent(slug)}/members/${id}/restore`, { method: 'POST' });
}

export function createTopic(slug: string, topic: { name: string; position?: number }): Promise<GroupTopic> {
  return request<GroupTopic>(`groups/${encodeURIComponent(slug)}/topics`, {
    method: 'POST',
    body: JSON.stringify(topic),
  });
}

export function updateTopic(slug: string, id: number, topic: { name: string; position?: number; active?: boolean }): Promise<GroupTopic> {
  return request<GroupTopic>(`groups/${encodeURIComponent(slug)}/topics/${id}`, {
    method: 'PATCH',
    body: JSON.stringify(topic),
  });
}

export function deleteTopic(slug: string, id: number): Promise<void> {
  return request<void>(`groups/${encodeURIComponent(slug)}/topics/${id}`, { method: 'DELETE' });
}

export function createRule(slug: string, rule: { title: string; description?: string; position?: number }): Promise<GroupRule> {
  return request<GroupRule>(`groups/${encodeURIComponent(slug)}/rules`, {
    method: 'POST',
    body: JSON.stringify(rule),
  });
}

export function updateRule(slug: string, id: number, rule: { title: string; description?: string; position?: number; active?: boolean }): Promise<GroupRule> {
  return request<GroupRule>(`groups/${encodeURIComponent(slug)}/rules/${id}`, {
    method: 'PATCH',
    body: JSON.stringify(rule),
  });
}

export function deleteRule(slug: string, id: number): Promise<void> {
  return request<void>(`groups/${encodeURIComponent(slug)}/rules/${id}`, { method: 'DELETE' });
}

export function getGroupAnalytics(
  slug: string,
  period?: number
): Promise<{
  total_members: number;
  new_members: number;
  posts_count: number;
  comments_count: number;
  reactions_count: number;
  active_contributors: number;
  period_days: number;
}> {
  return request<{
    total_members: number;
    new_members: number;
    posts_count: number;
    comments_count: number;
    reactions_count: number;
    active_contributors: number;
    period_days: number;
  }>(`groups/${encodeURIComponent(slug)}/analytics${period ? `?period=${period}` : ''}`);
}

export function getContentReports(groupId?: number, status?: string): Promise<ContentReport[]> {
  const params = new URLSearchParams();
  if (groupId) params.set('group_id', String(groupId));
  if (status) params.set('status', status);
  return request<ContentReport[]>(`content_reports?${params.toString()}`);
}

export function resolveContentReport(id: number, status: 'resolved' | 'dismissed'): Promise<void> {
  return request<void>(`content_reports/${id}`, {
    method: 'PATCH',
    body: JSON.stringify({ status }),
  });
}

export function getGroupRecommendations(limit?: number): Promise<Group[]> {
  return request<Group[]>(`groups/recommendations${limit ? `?limit=${limit}` : ''}`);
}
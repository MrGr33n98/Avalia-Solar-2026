import { buildApiUrl, getApiRequestHeaders } from '@/lib/api-config';
import type {
  Group,
  GroupMember,
  GroupMembership,
  GroupRule,
  GroupsQuery,
  GroupTopic,
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
  return request<Group[]>(`groups${suffix ? `?${suffix}` : ''}`);
}

export function getGroup(slug: string): Promise<Group> {
  return request<Group>(`groups/${encodeURIComponent(slug)}`);
}

export async function getMembership(slug: string): Promise<GroupMembership | null> {
  try {
    return await request<GroupMembership | null>(`groups/${encodeURIComponent(slug)}/membership`);
  } catch (error) {
    if (error instanceof GroupsApiError && (error.status === 401 || error.status === 404)) return null;
    throw error;
  }
}

export function joinGroup(slug: string): Promise<GroupMembership> {
  return request<GroupMembership>(`groups/${encodeURIComponent(slug)}/join`, { method: 'POST' });
}

export function leaveGroup(slug: string): Promise<GroupMembership | null> {
  return request<GroupMembership | null>(`groups/${encodeURIComponent(slug)}/join`, { method: 'DELETE' });
}

export function getMembers(slug: string): Promise<GroupMember[]> {
  return request<GroupMember[]>(`groups/${encodeURIComponent(slug)}/members`);
}

export function getTopics(slug: string): Promise<GroupTopic[]> {
  return request<GroupTopic[]>(`groups/${encodeURIComponent(slug)}/topics`);
}

export function getRules(slug: string): Promise<GroupRule[]> {
  return request<GroupRule[]>(`groups/${encodeURIComponent(slug)}/rules`);
}
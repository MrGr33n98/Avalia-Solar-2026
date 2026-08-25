import { cookies } from 'next/headers';

export function getGroupsServerHeaders(): HeadersInit {
  const cookieHeader = cookies().toString();
  return cookieHeader ? { cookie: cookieHeader } : {};
}
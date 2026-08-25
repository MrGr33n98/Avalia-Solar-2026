export function isGroupsEnabled(): boolean {
  return process.env.NEXT_PUBLIC_GROUPS_ENABLED === 'true';
}
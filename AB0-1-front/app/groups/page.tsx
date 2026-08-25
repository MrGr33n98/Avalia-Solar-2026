import type { Metadata } from 'next';
import { notFound } from 'next/navigation';

import { GroupsDiscovery } from '@/components/groups/GroupsDiscovery';
import { isGroupsEnabled } from '@/lib/features/groups';

export const metadata: Metadata = {
  title: 'Comunidades | Avalia Solar',
  description: 'Descubra comunidades e conversas relevantes sobre energia solar.',
};

export default function GroupsPage() {
  if (!isGroupsEnabled()) notFound();
  return <GroupsDiscovery />;
}
import type { Metadata } from 'next';
import { notFound } from 'next/navigation';

import { GroupsDiscovery } from '@/components/groups/GroupsDiscovery';

export const metadata: Metadata = {
  title: 'Comunidades | Avalia Solar',
  description: 'Descubra comunidades e conversas relevantes sobre energia solar.',
};

function groupsEnabled() {
  return process.env.NEXT_PUBLIC_FEATURE_GROUPS !== 'false' && process.env.NEXT_PUBLIC_GROUPS_ENABLED !== 'false';
}

export default function GroupsPage() {
  if (!groupsEnabled()) notFound();
  return <GroupsDiscovery />;
}
'use client';

import { SocialCardBase, type SocialTemplateProps } from './SocialCardBase';

export function OpenGraphTemplate({ resource }: { resource: SocialTemplateProps['resource'] }) {
  return <SocialCardBase resource={resource} width={1200} height={630} formatLabel="Open Graph" />;
}

'use client';

import { SocialCardBase, type SocialTemplateProps } from './SocialCardBase';

export function XTemplate({ resource }: { resource: SocialTemplateProps['resource'] }) {
  return <SocialCardBase resource={resource} width={1600} height={900} formatLabel="X" />;
}

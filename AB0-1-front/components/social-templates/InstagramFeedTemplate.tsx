'use client';

import { SocialCardBase, type SocialTemplateProps } from './SocialCardBase';

export function InstagramFeedTemplate({ resource }: { resource: SocialTemplateProps['resource'] }) {
  return <SocialCardBase resource={resource} width={1080} height={1350} formatLabel="Instagram Feed" />;
}

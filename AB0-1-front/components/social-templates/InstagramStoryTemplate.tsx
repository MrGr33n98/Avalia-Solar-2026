'use client';

import { SocialCardBase, type SocialTemplateProps } from './SocialCardBase';

export function InstagramStoryTemplate({ resource }: { resource: SocialTemplateProps['resource'] }) {
  return <SocialCardBase resource={resource} width={1080} height={1920} formatLabel="Instagram Story" />;
}

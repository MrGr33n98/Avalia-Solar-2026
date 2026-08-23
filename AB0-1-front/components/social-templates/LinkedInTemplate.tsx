'use client';

import { SocialCardBase, type SocialTemplateProps } from './SocialCardBase';

export function LinkedInTemplate({ resource }: { resource: SocialTemplateProps['resource'] }) {
  return <SocialCardBase resource={resource} width={1200} height={627} formatLabel="LinkedIn" />;
}

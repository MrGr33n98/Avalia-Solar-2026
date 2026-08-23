import type { ShareContext, SharePlatform, ShareResource } from './shareTypes';
import { track } from '@/lib/analytics/lazy';

export function trackShare(resource: ShareResource, platform: SharePlatform, context: ShareContext) {
  const subjectId = String(resource.resourceId);
  track('creator_share_clicked', {
    resource_type: resource.resourceType,
    resource_id: subjectId,
    subject_type: resource.resourceType === 'publication' ? 'ReviewerPublication' : resource.resourceType,
    subject_id: subjectId,
    platform,
    format: context.format || 'link',
    placement: context.placement,
  });
}

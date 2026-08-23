import type { ShareContext, SharePlatform, ShareResource } from './shareTypes';
import { track } from '@/lib/analytics/lazy';

export function trackShare(resource: ShareResource, platform: SharePlatform, context: ShareContext) {
  track('creator_share_clicked', {
    resource_type: resource.resourceType,
    resource_id: String(resource.resourceId),
    platform,
    format: context.format || 'link',
    placement: context.placement,
  });
}

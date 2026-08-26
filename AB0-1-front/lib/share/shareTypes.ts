export type ShareResourceType = 'publication' | 'creator' | 'review' | 'company' | 'tree' | 'group_post';

export type SharePlatform =
  | 'instagram'
  | 'whatsapp'
  | 'linkedin'
  | 'x'
  | 'facebook'
  | 'copy'
  | 'native_share';

export type ShareFormat = 'feed' | 'story' | 'card' | 'link' | 'og';

export interface ShareResource {
  resourceType: ShareResourceType;
  resourceId: string | number;
  title: string;
  description?: string;
  imageUrl?: string;
  canonicalUrl: string;
  author?: {
    name: string;
    avatarUrl?: string;
  };
}

export interface ShareContext {
  placement: 'feed' | 'creator_profile' | 'creator_studio' | 'tree' | 'post_page' | 'review' | 'company';
  format?: ShareFormat;
}

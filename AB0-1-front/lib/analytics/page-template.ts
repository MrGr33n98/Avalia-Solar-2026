export type PageTemplate =
  | 'home'
  | 'category'
  | 'company'
  | 'company_review'
  | 'company_claim'
  | 'company_quote'
  | 'local'
  | 'blog'
  | 'blog_article'
  | 'dashboard'
  | 'search'
  | 'compare'
  | 'product'
  | 'auth'
  | 'conversion'
  | 'static'
  | 'other';

export type DeviceClass = 'mobile' | 'tablet' | 'desktop' | 'unknown';

export type PageTemplateInfo = {
  template: PageTemplate;
  normalizedPath: string;
};

const trimPath = (value: string): string => {
  const withoutOrigin = value.startsWith('http')
    ? new URL(value).pathname
    : value.split('#')[0]?.split('?')[0] ?? value;
  const normalized = withoutOrigin.replace(/\/+$/, '');
  return normalized || '/';
};

export function getDeviceClass(width?: number): DeviceClass {
  if (typeof width !== 'number' || Number.isNaN(width) || width <= 0) return 'unknown';
  if (width < 768) return 'mobile';
  if (width < 1024) return 'tablet';
  return 'desktop';
}

export function getPageTemplateInfo(pathname: string): PageTemplateInfo {
  const path = trimPath(pathname);
  const segments = path.split('/').filter(Boolean);

  if (path === '/') return { template: 'home', normalizedPath: '/' };

  if (segments[0] === 'categories' && segments.length >= 2) {
    return { template: 'category', normalizedPath: '/categories/:slug' };
  }

  if (segments[0] === 'companies') {
    if (segments.length === 4) {
      return {
        template: 'local',
        normalizedPath: '/companies/:vertical/:state/:city',
      };
    }

    if (segments.length >= 3 && segments[2] === 'review') {
      return { template: 'company_review', normalizedPath: '/companies/:company/review' };
    }

    if (segments.length >= 3 && segments[2] === 'claim') {
      return { template: 'company_claim', normalizedPath: '/companies/:company/claim' };
    }

    if (segments.length >= 3 && segments[2] === 'quote') {
      return { template: 'company_quote', normalizedPath: '/companies/:company/quote' };
    }

    if (segments.length >= 2) {
      return { template: 'company', normalizedPath: '/companies/:company' };
    }

    return { template: 'search', normalizedPath: '/companies' };
  }

  if (segments[0] === 'blog') {
    if (segments.length >= 2) return { template: 'blog_article', normalizedPath: '/blog/:slug' };
    return { template: 'blog', normalizedPath: '/blog' };
  }

  if (segments[0] === 'dashboard' || segments[0] === 'company-dashboard') {
    return { template: 'dashboard', normalizedPath: `/${segments[0]}` };
  }

  if (segments[0] === 'search') return { template: 'search', normalizedPath: '/search' };
  if (segments[0] === 'compare') return { template: 'compare', normalizedPath: '/compare' };
  if (segments[0] === 'products' || segments[0] === 'produtos') {
    return { template: 'product', normalizedPath: `/${segments[0]}/:slug` };
  }
  if (segments[0] === 'login' || segments[0] === 'signup') {
    return { template: 'auth', normalizedPath: `/${segments[0]}` };
  }
  if (segments[0] === 'checkout' || segments[0] === 'quote' || segments[0] === 'diagnostico-solar') {
    return { template: 'conversion', normalizedPath: `/${segments[0]}` };
  }
  if (['about', 'contact', 'help', 'privacy', 'terms'].includes(segments[0] ?? '')) {
    return { template: 'static', normalizedPath: `/${segments[0]}` };
  }

  return { template: 'other', normalizedPath: path };
}

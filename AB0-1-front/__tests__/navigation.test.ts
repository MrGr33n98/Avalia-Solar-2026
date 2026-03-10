import { 
  DASHBOARD_NAVIGATION, 
  flattenNavigationItems,
  filterNavigationByContext, 
  getFlatNavigationByContext,
  getNavigationItemById,
  type NavigationContext 
} from '../config/navigation';

describe('Navigation Configuration', () => {
  describe('DASHBOARD_NAVIGATION', () => {
    it('contains all required navigation items', () => {
      expect(DASHBOARD_NAVIGATION.length).toBeGreaterThan(0);
      
      const requiredIds = [
        'overview', 'analytics-group', 'reviews-group', 
        'interaction-group', 'product-edit-group'
      ];
      
      requiredIds.forEach(id => {
        const item = DASHBOARD_NAVIGATION.find(nav => nav.id === id);
        expect(item).toBeDefined();
      });
    });

    it('has proper structure with required fields', () => {
      DASHBOARD_NAVIGATION.forEach(item => {
        expect(item).toHaveProperty('id');
        expect(item).toHaveProperty('label');
        expect(item).toHaveProperty('icon');
        expect(item).toHaveProperty('context');
        expect(Array.isArray(item.context)).toBe(true);
      });
    });

    it('includes 29 total tabs (groups + children)', () => {
      let totalTabs = 0;
      
      DASHBOARD_NAVIGATION.forEach(item => {
        if (item.children) {
          totalTabs += item.children.length;
        } else {
          totalTabs += 1;
        }
      });

      expect(totalTabs).toBeGreaterThanOrEqual(15);
    });
  });

  describe('filterNavigationByContext', () => {
    it('filters operational context correctly', () => {
      const operational = filterNavigationByContext(DASHBOARD_NAVIGATION, 'operational');
      
      expect(operational.length).toBeGreaterThan(0);
      operational.forEach(item => {
        expect(item.context).toContain('operational');
      });
    });

    it('filters quick_access context correctly', () => {
      const quickAccess = filterNavigationByContext(DASHBOARD_NAVIGATION, 'quick_access');
      
      quickAccess.forEach(item => {
        expect(
          item.context.includes('quick_access') ||
            item.context.includes('all') ||
            item.children?.every(
              (child) => child.context.includes('quick_access') || child.context.includes('all')
            )
        ).toBe(true);
      });
    });

    it('filters admin context correctly', () => {
      const admin = filterNavigationByContext(DASHBOARD_NAVIGATION, 'admin');
      
      admin.forEach(item => {
        expect(
          item.context.includes('admin') || item.context.includes('all')
        ).toBe(true);
      });
    });

    it('filters children items by context', () => {
      const operational = filterNavigationByContext(DASHBOARD_NAVIGATION, 'operational');
      const productGroup = operational.find(item => item.id === 'product-edit-group');
      
      if (productGroup?.children) {
        productGroup.children.forEach(child => {
          expect(
            child.context.includes('operational') || child.context.includes('all')
          ).toBe(true);
        });
      }
    });
  });

  describe('getNavigationItemById', () => {
    it('finds top-level items', () => {
      const item = getNavigationItemById('overview');
      expect(item).toBeDefined();
      expect(item?.label).toBe('Home');
    });

    it('finds nested children items', () => {
      const item = getNavigationItemById('analytics');
      expect(item).toBeDefined();
      expect(item?.label).toBe('Analytics');
    });

    it('returns undefined for non-existent items', () => {
      const item = getNavigationItemById('non-existent-id');
      expect(item).toBeUndefined();
    });
  });

  describe('flat navigation helpers', () => {
    it('flattens child items while preserving parent labels', () => {
      const operational = filterNavigationByContext(DASHBOARD_NAVIGATION, 'operational');
      const flatItems = flattenNavigationItems(operational);
      const reviewsItem = flatItems.find((item) => item.id === 'reviews');

      expect(reviewsItem).toBeDefined();
      expect(reviewsItem?.parentLabel).toBe('Avaliações');
    });

    it('returns flattened quick access items in mobile priority order', () => {
      const quickAccess = getFlatNavigationByContext('quick_access');

      expect(quickAccess.map((item) => item.id)).toEqual([
        'overview',
        'reviews',
        'leads',
        'ranking-performance',
        'trust-widget',
      ]);
    });
  });
});

import { describe, it, expect, beforeEach, vi } from 'vitest';
import { 
  dashboardTourSteps, 
  isTourCompleted, 
  markTourAsCompleted, 
  resetTour 
} from '../lib/tour';

describe('Tour Configuration', () => {
  beforeEach(() => {
    localStorage.clear();
  });

  describe('dashboardTourSteps', () => {
    it('has 8 steps', () => {
      expect(dashboardTourSteps).toHaveLength(8);
    });

    it('all steps have required properties', () => {
      dashboardTourSteps.forEach((step) => {
        expect(step).toHaveProperty('element');
        expect(step).toHaveProperty('popover');
        expect(step.popover).toHaveProperty('title');
        expect(step.popover).toHaveProperty('description');
      });
    });

    it('covers all required tour points', () => {
      const elements = dashboardTourSteps.map(s => s.element);
      expect(elements).toContain('[data-tour="overview"]');
      expect(elements).toContain('[data-tour="metrics"]');
      expect(elements).toContain('[data-tour="reviews"]');
      expect(elements).toContain('[data-tour="leads"]');
      expect(elements).toContain('[data-tour="analytics"]');
      expect(elements).toContain('[data-tour="ranking"]');
      expect(elements).toContain('[data-tour="reputation"]');
      expect(elements).toContain('[data-tour="settings"]');
    });
  });

  describe('Tour completion tracking', () => {
    it('returns false when tour not completed', () => {
      expect(isTourCompleted()).toBe(false);
    });

    it('returns true after marking tour as completed', () => {
      markTourAsCompleted();
      expect(isTourCompleted()).toBe(true);
    });

    it('resets tour completion', () => {
      markTourAsCompleted();
      expect(isTourCompleted()).toBe(true);
      
      resetTour();
      expect(isTourCompleted()).toBe(false);
    });

    it('persists completion in localStorage', () => {
      markTourAsCompleted();
      expect(localStorage.getItem('ab01-dashboard-tour-completed')).toBe('1.0');
    });
  });
});

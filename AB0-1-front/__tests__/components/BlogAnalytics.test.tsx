import React from 'react';
import { render, screen, fireEvent, act } from '@testing-library/react';
import { track } from '@/lib/analytics/lazy';
import ShareButtons from '@/components/blog/ShareButtons';
import { ReadingProgress } from '@/components/blog/ReadingProgress';
import { BlogTimeTracker } from '@/components/blog/BlogTimeTracker';
import ArticleConversionSection from '@/components/ArticleConversionSection';
import { CategoryHighlights } from '@/components/blog/CategoryHighlights';
import { useParams } from 'next/navigation';

// Mock the analytics module
jest.mock('@/lib/analytics/lazy', () => ({
  track: jest.fn(),
}));

// Mock next/navigation
jest.mock('next/navigation', () => ({
  useParams: jest.fn(),
  usePathname: jest.fn(() => '/blog/test-post'),
  useRouter: jest.fn(() => ({
    push: jest.fn(),
  })),
  useSearchParams: jest.fn(() => new URLSearchParams()),
}));

// Mock lucide-react to avoid icon rendering issues in tests
jest.mock('lucide-react', () => ({
  Facebook: () => <div data-testid="facebook-icon" />,
  Linkedin: () => <div data-testid="linkedin-icon" />,
  Twitter: () => <div data-testid="twitter-icon" />,
  Share2: () => <div data-testid="share2-icon" />,
  Link: () => <div data-testid="link-icon" />,
  MessageCircle: () => <div data-testid="whatsapp-icon" />,
  Sun: () => <div data-testid="sun-icon" />,
  Wallet: () => <div data-testid="wallet-icon" />,
  Leaf: () => <div data-testid="leaf-icon" />,
  ShieldCheck: () => <div data-testid="shield-icon" />,
  MessageSquare: () => <div data-testid="message-icon" />,
  Wrench: () => <div data-testid="wrench-icon" />,
  Banknote: () => <div data-testid="banknote-icon" />,
  Calendar: () => <div data-testid="calendar-icon" />,
  Clock: () => <div data-testid="clock-icon" />,
  Bookmark: () => <div data-testid="bookmark-icon" />,
  User: () => <div data-testid="user-icon" />,
  ChevronRight: () => <div data-testid="chevron-right-icon" />,
  ChevronLeft: () => <div data-testid="chevron-left-icon" />,
  X: () => <div data-testid="x-icon" />,
  Search: () => <div data-testid="search-icon" />,
  ArrowUpDown: () => <div data-testid="arrow-up-down-icon" />,
  List: () => <div data-testid="list-icon" />,
  ArrowRight: () => <div data-testid="arrow-right-icon" />,
}));

// Mock hooks to avoid act warnings and async updates
jest.mock('@/hooks/useBanners', () => ({
  useBanners: () => ({ banners: [], loading: false }),
}));

jest.mock('@/hooks/useBannerGlobal', () => ({
  useBannerGlobal: () => ({ bannerGlobal: null, loading: false }),
}));

// Mock navigator.clipboard
Object.assign(navigator, {
  clipboard: {
    writeText: jest.fn().mockImplementation(() => Promise.resolve()),
  },
});

Object.defineProperty(window, 'open', {
  writable: true,
  value: jest.fn(),
});

describe('Blog Analytics Integration', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    (useParams as jest.Mock).mockReturnValue({ slug: 'test-post' });
  });

  describe('ShareButtons', () => {
    it('should track blog_share_click when a platform is clicked', () => {
      render(<ShareButtons title="Test Post" slug="test-post" />);
      
      const linkedinButton = screen.getByText('LinkedIn').closest('button');
      fireEvent.click(linkedinButton!);
      
      expect(track).toHaveBeenCalledWith('blog_share_click', expect.objectContaining({
        post_id: 'test-post',
        post_title: 'Test Post',
        platform: 'linkedin'
      }));
    });

    it('should track blog_share_click when copy link is clicked', () => {
      render(<ShareButtons title="Test Post" slug="test-post" />);
      
      const copyButton = screen.getByText('Copiar Link').closest('button');
      fireEvent.click(copyButton!);
      
      expect(track).toHaveBeenCalledWith('blog_share_click', expect.objectContaining({
        platform: 'copy'
      }));
      expect(navigator.clipboard.writeText).toHaveBeenCalled();
    });
  });

  describe('ReadingProgress', () => {
    it('should track blog_scroll_depth when thresholds are reached', () => {
      // Mock scroll behavior
      const originalInnerHeight = window.innerHeight;
      const originalScrollHeight = document.documentElement.scrollHeight;
      
      Object.defineProperty(window, 'innerHeight', { writable: true, value: 500 });
      Object.defineProperty(document.documentElement, 'scrollHeight', { writable: true, value: 1500 });
      
      render(<ReadingProgress />);
      
      // Simulate scroll to 50% (500px / (1500px - 500px) = 0.5)
      (window as any).scrollY = 500;
      fireEvent.scroll(window);
      
      expect(track).toHaveBeenCalledWith('blog_scroll_depth', expect.objectContaining({
        post_slug: 'test-post',
        scroll_percentage: 50
      }));

      // Cleanup
      Object.defineProperty(window, 'innerHeight', { value: originalInnerHeight });
      Object.defineProperty(document.documentElement, 'scrollHeight', { value: originalScrollHeight });
    });
  });

  describe('ArticleConversionSection', () => {
    const mockArticle = {
      id: 1,
      title: 'Test Article',
      slug: 'test-article',
      category: { name: 'Energy', slug: 'energy' }
    };

    it('should track blog_cta_click when CTA buttons are clicked', () => {
      render(<ArticleConversionSection article={mockArticle} />);
      
      const budgetButton = screen.getByText('Pedir orçamento').closest('a');
      fireEvent.click(budgetButton!);
      
      expect(track).toHaveBeenCalledWith('blog_cta_click', expect.objectContaining({
        cta_text: 'Pedir orçamento',
        cta_target: 'categories'
      }));

      const simulatorButton = screen.getByText('Simular economia').closest('a');
      fireEvent.click(simulatorButton!);
      
      expect(track).toHaveBeenCalledWith('blog_cta_click', expect.objectContaining({
        cta_text: 'Simular economia',
        cta_target: 'simulador'
      }));
    });
  });

  describe('CategoryHighlights', () => {
    it('should track blog_category_click when a category highlight is clicked', () => {
      render(<CategoryHighlights />);
      
      const economyCard = screen.getByText('Economia').closest('a');
      fireEvent.click(economyCard!);
      
      expect(track).toHaveBeenCalledWith('blog_category_click', expect.objectContaining({
        category_name: 'Economia',
        element_type: 'highlight_card'
      }));
    });
  });

  describe('BlogTimeTracker', () => {
    beforeEach(() => {
      jest.useFakeTimers();
    });

    afterEach(() => {
      jest.useRealTimers();
    });

    it('should track blog_time_milestone after 30 seconds', () => {
      render(<BlogTimeTracker />);
      
      act(() => {
        jest.advanceTimersByTime(31000);
      });
      
      expect(track).toHaveBeenCalledWith('blog_time_milestone', expect.objectContaining({
        time_seconds: 30,
        milestone: '30s'
      }));
    });
  });
});

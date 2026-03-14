// Learn more: https://github.com/testing-library/jest-dom
require('@testing-library/jest-dom');

// Mock QueryClient for React Query tests
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { render } from '@testing-library/react';

// Create a custom render method that includes providers
const customRender = (ui, options = {}) => {
  const queryClient = new QueryClient({
    defaultOptions: {
      queries: {
        retry: false, // Disable retries for tests
        gcTime: 0, // Disable cache for tests
      },
    },
  });

  const AllTheProviders = ({ children }) => {
    return (
      <QueryClientProvider client={queryClient}>
        {children}
      </QueryClientProvider>
    );
  };

  return render(ui, { wrapper: AllTheProviders, ...options });
};

// Re-export everything
export * from '@testing-library/react';

// Override render method
export { customRender as render };

// Mock for IntersectionObserver
class IntersectionObserver {
  constructor(callback, options) {
    this.callback = callback;
    this.options = options;
    this.elements = new Set();
  }

  observe(element) {
    this.elements.add(element);
    // Simulate element is immediately visible
    this.callback([{ isIntersecting: true, target: element }]);
  }

  unobserve(element) {
    this.elements.delete(element);
  }

  disconnect() {
    this.elements.clear();
  }
}

// Define IntersectionObserver in the global window object for the test environment
Object.defineProperty(window, 'IntersectionObserver', {
  writable: true,
  configurable: true,
  value: IntersectionObserver,
});

// Mock for ResizeObserver (common in UI libraries)
class ResizeObserver {
  observe() {}
  unobserve() {}
  disconnect() {}
}
Object.defineProperty(window, 'ResizeObserver', {
  writable: true,
  configurable: true,
  value: ResizeObserver,
});

// Mock for matchMedia (used by some libs for media queries)
Object.defineProperty(window, 'matchMedia', {
  writable: true,
  configurable: true,
  value: jest.fn(query => ({
    matches: false, // Can be overwritten in specific tests if needed
    media: query,
    onchange: null,
    addListener: jest.fn(), // Deprecated
    removeListener: jest.fn(), // Deprecated
    addEventListener: jest.fn(),
    removeEventListener: jest.fn(),
    dispatchEvent: jest.fn(),
  })),
});

Object.defineProperty(window, 'scrollTo', {
  writable: true,
  configurable: true,
  value: jest.fn(),
});

// Polyfill TransformStream for libraries that expect Web Streams API in JSDOM
try {
  const { TransformStream } = require('node:stream/web');
  if (typeof global.TransformStream === 'undefined') {
    global.TransformStream = TransformStream;
  }
} catch (err) {
  // ignore if not available
}

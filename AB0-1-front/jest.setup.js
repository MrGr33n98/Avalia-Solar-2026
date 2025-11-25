// Learn more: https://github.com/testing-library/jest-dom
require('@testing-library/jest-dom');

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
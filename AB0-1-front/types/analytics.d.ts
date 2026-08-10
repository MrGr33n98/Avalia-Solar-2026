export {};

declare global {
  interface Window {
    __analyticsPosthog?: {
      alias: (newId: string) => void;
      capture: (eventName: string, properties?: Record<string, unknown>) => void;
      identify: (userId: string, traits?: Record<string, unknown>) => void;
      isLoaded: () => boolean;
      reset: () => void;
    };
  }
}

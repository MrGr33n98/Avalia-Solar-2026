declare module '*.css' {
  const content: Record<string, string>;
  export default content;
}

declare module '*.module.css' {
  const content: Record<string, string>;
  export default content;
}

declare module '@rails/actioncable' {
  export type Subscription = {
    unsubscribe: () => void;
  };

  export type Consumer = {
    subscriptions: {
      create: (params: Record<string, unknown>, callbacks: Record<string, (...args: any[]) => void>) => Subscription;
    };
  };

  export function createConsumer(url?: string): Consumer;
}

declare module '@tanstack/react-query-devtools' {
  import { ComponentType } from 'react';
  export const ReactQueryDevtools: ComponentType<{
    initialIsOpen?: boolean;
    position?: 'top-left' | 'top-right' | 'bottom-left' | 'bottom-right';
    buttonPosition?: 'top-left' | 'top-right' | 'bottom-left' | 'bottom-right';
  }>;
}

import React from 'react';
import { createRoot } from 'react-dom/client';
import '../design/tokens.css';
import '../design/motion.css';
import { HostProvider } from '../bridge/host-adapter';
import { BridgeErrorBoundary } from '../design/primitives';

export function mountWidget(
  appName: string,
  WidgetComponent: React.ComponentType,
  fallbackOutput?: unknown
): void {
  const rootEl = document.getElementById('root');
  if (!rootEl) return;

  createRoot(rootEl).render(
    <React.StrictMode>
      <BridgeErrorBoundary>
        <HostProvider appName={appName} fallbackOutput={fallbackOutput}>
          <WidgetComponent />
        </HostProvider>
      </BridgeErrorBoundary>
    </React.StrictMode>
  );
}


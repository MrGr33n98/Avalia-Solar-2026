// TASK-006: Sentry Client-side Configuration
// This file configures Sentry for the browser/client-side
// Documentation: https://docs.sentry.io/platforms/javascript/guides/nextjs/

import * as Sentry from "@sentry/nextjs";

Sentry.init({
  // Your Sentry DSN (Data Source Name)
  dsn: process.env.NEXT_PUBLIC_SENTRY_DSN,

  // Environment
  environment: process.env.NEXT_PUBLIC_ENV || process.env.NODE_ENV || "development",

  // Adjust this value in production, or use tracesSampler for greater control
  tracesSampleRate: process.env.NODE_ENV === "production" ? 0.1 : 1.0,

  // Setting this option to true will print useful information to the console while you're setting up Sentry.
  debug: false,

  // Replay configuration for session replay feature
  replaysOnErrorSampleRate: process.env.NODE_ENV === "production" ? 1.0 : 0.0,
  replaysSessionSampleRate: process.env.NODE_ENV === "production" ? 0.1 : 0.0,

  integrations: [
    // Enable Replay for session recording
    Sentry.replayIntegration({
      maskAllText: true,
      blockAllMedia: true,
    }),
    // Browser tracing
    Sentry.browserTracingIntegration({
      // Set sampling rate for performance monitoring
      tracePropagationTargets: [
        "localhost",
        /^\//,
        process.env.NEXT_PUBLIC_API_BASE_URL || "",
      ].filter(Boolean),
    } as any),
  ],

  // Filter out specific errors
  ignoreErrors: [
    // Browser extensions
    /^chrome-extension:\/\//i,
    /^moz-extension:\/\//i,
    // Random network errors
    "Network request failed",
    "NetworkError",
    "Failed to fetch",
    // Random browser errors
    "ResizeObserver loop limit exceeded",
    "Non-Error promise rejection captured",
  ],

  // Beforehook to add custom data or filter events
  beforeSend(event, hint) {
    // Filter out errors from browser extensions
    if (event.exception) {
      const error = hint.originalException;
      if (error && typeof error === "object" && "message" in error) {
        const message = String(error.message);
        if (
          message.includes("chrome-extension://") ||
          message.includes("moz-extension://")
        ) {
          return null;
        }
      }
    }

    // Add custom context
    event.contexts = {
      ...event.contexts,
      app: {
        version: process.env.NEXT_PUBLIC_APP_VERSION || "unknown",
        build: process.env.NEXT_PUBLIC_BUILD_ID || "unknown",
      },
    };

    return event;
  },

  // Release tracking
  release: process.env.NEXT_PUBLIC_SENTRY_RELEASE || process.env.NEXT_PUBLIC_VERCEL_GIT_COMMIT_SHA,
});

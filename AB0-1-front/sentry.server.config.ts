// TASK-006: Sentry Server-side Configuration
// This file configures Sentry for the server-side (Node.js)
// Documentation: https://docs.sentry.io/platforms/javascript/guides/nextjs/

import * as Sentry from "@sentry/nextjs";

Sentry.init({
  // Your Sentry DSN (Data Source Name)
  dsn: process.env.SENTRY_DSN,

  // Environment
  environment: process.env.NODE_ENV || "development",

  // Adjust this value in production
  tracesSampleRate: process.env.NODE_ENV === "production" ? 0.1 : 1.0,

  // Setting this option to true will print useful information to the console while you're setting up Sentry.
  debug: false,

  // Filter out specific errors
  ignoreErrors: [
    // Common Next.js errors that are not actionable
    "ECONNRESET",
    "EPIPE",
    "ETIMEDOUT",
  ],

  // Note: Profiling integration removed - install @sentry/profiling-node if needed
  integrations: [],

  // Beforehook to add custom data or filter events
  beforeSend(event, hint) {
    // Don't send errors from development
    if (process.env.NODE_ENV === "development") {
      console.error(hint.originalException || hint.syntheticException);
      return null;
    }

    // Add custom server context
    event.contexts = {
      ...event.contexts,
      server: {
        node_version: process.version,
        platform: process.platform,
        arch: process.arch,
      },
    };

    return event;
  },

  // Release tracking
  release: process.env.SENTRY_RELEASE || process.env.VERCEL_GIT_COMMIT_SHA,
});

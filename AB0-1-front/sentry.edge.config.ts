// TASK-006: Sentry Edge Runtime Configuration
// This file configures Sentry for Edge Runtime (middleware, edge functions)
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

  // Release tracking
  release: process.env.SENTRY_RELEASE || process.env.VERCEL_GIT_COMMIT_SHA,
});

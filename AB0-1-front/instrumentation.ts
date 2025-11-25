// instrumentation.ts - Next.js 13+ Instrumentation API
// This file is automatically loaded by Next.js before the application starts
// Documentation: https://nextjs.org/docs/app/building-your-application/optimizing/instrumentation

export const runtime = 'experimental-edge'

export async function register() {
  // Only run on server-side
  if (process.env.NEXT_RUNTIME === 'nodejs') {
    // Initialize Sentry for server-side
    await import('./sentry.server.config');
  }

  // Only run on edge runtime
  if (process.env.NEXT_RUNTIME === 'edge') {
    // Initialize Sentry for edge runtime
    await import('./sentry.edge.config');
  }
}

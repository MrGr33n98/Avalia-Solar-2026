/**
 * Environment variables validation safeguard.
 * This file is imported in the root layout to ensure required server-side 
 * environment variables are present at runtime.
 */

const isServer = typeof window === 'undefined';
const isBuildTime = process.env.NODE_ENV === 'production' && !!process.env.NEXT_PHASE;

if (isServer && !isBuildTime) {
  const requiredServerEnvs = {
    NEXT_SERVER_ACTIONS_ENCRYPTION_KEY: process.env.NEXT_SERVER_ACTIONS_ENCRYPTION_KEY,
    BETTER_AUTH_SECRET: process.env.BETTER_AUTH_SECRET,
  };

  for (const [key, value] of Object.entries(requiredServerEnvs)) {
    if (!value && process.env.NODE_ENV === 'production') {
      throw new Error(`CRITICAL ERROR: Missing required environment variable: ${key}. Build or Runtime cannot proceed safely.`);
    } else if (!value) {
      console.warn(`[ENV WARNING]: Missing environment variable ${key}. This is required for security in production.`);
    }
  }
}

export const env = {
  NEXT_SERVER_ACTIONS_ENCRYPTION_KEY: process.env.NEXT_SERVER_ACTIONS_ENCRYPTION_KEY,
  BETTER_AUTH_SECRET: process.env.BETTER_AUTH_SECRET,
};

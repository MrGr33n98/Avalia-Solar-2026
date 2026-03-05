// Simple Jest mock for better-auth/client to avoid ESM parsing in node_modules during tests.
const noop = async () => ({});

export const createAuthClient = () => ({
  signIn: noop,
  signOut: noop,
  currentSession: noop,
  refreshSession: noop,
});

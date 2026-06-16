// Mock all native modules
jest.mock('@react-native-async-storage/async-storage', () => require('@react-native-async-storage/async-storage/jest/async-storage-mock'));
jest.mock('expo-secure-store', () => ({
  getItemAsync: jest.fn(),
  setItemAsync: jest.fn(),
  deleteItemAsync: jest.fn(),
}));
jest.mock('apollo3-cache-persist', () => ({
  persistCache: jest.fn(() => Promise.resolve()),
}));

const mockLogout = jest.fn();

// Mock store directly at the path errorLink expects it
jest.mock('../../store/auth', () => ({
  useAuthStore: {
    getState: () => ({
      logout: mockLogout,
    }),
  },
}));

// Now import the handler under test
import { authErrorHandler } from '../apolloClient';

describe('Apollo Client Auth Error Interceptor', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('triggers logout when GraphQL returns UNAUTHENTICATED error code', () => {
    authErrorHandler({
      graphQLErrors: [{ message: 'Unauthorized', extensions: { code: 'UNAUTHENTICATED' } } as any],
    });

    expect(mockLogout).toHaveBeenCalledTimes(1);
  });

  it('triggers logout when network returns 401 status code', () => {
    authErrorHandler({
      networkError: { statusCode: 401 } as any,
    });

    expect(mockLogout).toHaveBeenCalledTimes(1);
  });
});


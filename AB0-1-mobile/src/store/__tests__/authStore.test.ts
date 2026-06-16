import { useAuthStore } from '../auth';
import { authApi, setStoredToken, removeStoredToken, getStoredToken } from '../../lib/api';

jest.mock('../../lib/api', () => ({
  authApi: {
    login: jest.fn(),
    register: jest.fn(),
    getCurrentUser: jest.fn(),
  },
  setStoredToken: jest.fn(),
  removeStoredToken: jest.fn(),
  getStoredToken: jest.fn(),
}));

describe('authStore', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    useAuthStore.setState({
      user: null,
      token: null,
      isLoading: false,
    });
  });

  describe('login', () => {
    it('should login successfully and set user and token', async () => {
      const mockResponse = {
        token: 'fake-token',
        user: { id: 1, name: 'Test', email: 'test@test.com', role: 'consumer' as const },
      };
      (authApi.login as jest.Mock).mockResolvedValueOnce(mockResponse);
      
      const loginPromise = useAuthStore.getState().login('test@test.com', 'password');
      
      expect(useAuthStore.getState().isLoading).toBe(true);
      
      await loginPromise;
      
      expect(setStoredToken).toHaveBeenCalledWith('fake-token');
      expect(useAuthStore.getState().user).toEqual(mockResponse.user);
      expect(useAuthStore.getState().token).toEqual('fake-token');
      expect(useAuthStore.getState().isLoading).toBe(false);
    });

    it('should handle login error', async () => {
      (authApi.login as jest.Mock).mockRejectedValueOnce(new Error('Login failed'));
      
      await expect(useAuthStore.getState().login('test@test.com', 'password')).rejects.toThrow('Login failed');
      expect(useAuthStore.getState().isLoading).toBe(false);
      expect(useAuthStore.getState().user).toBeNull();
    });
  });

  describe('logout', () => {
    it('should logout successfully and clear state', async () => {
      useAuthStore.setState({ user: { id: 1, name: 'Test', email: 'test@test.com', role: 'consumer' as const }, token: 'fake-token' });
      
      await useAuthStore.getState().logout();
      
      expect(removeStoredToken).toHaveBeenCalled();
      expect(useAuthStore.getState().user).toBeNull();
      expect(useAuthStore.getState().token).toBeNull();
      expect(useAuthStore.getState().isLoading).toBe(false);
    });
  });

  describe('initialize', () => {
    it('should initialize with user if token exists', async () => {
      (getStoredToken as jest.Mock).mockResolvedValueOnce('fake-token');
      const mockUser = { id: 1, name: 'Test', email: 'test@test.com', role: 'consumer' as const };
      (authApi.getCurrentUser as jest.Mock).mockResolvedValueOnce(mockUser);
      
      await useAuthStore.getState().initialize();
      
      expect(useAuthStore.getState().user).toEqual(mockUser);
      expect(useAuthStore.getState().token).toEqual('fake-token');
      expect(useAuthStore.getState().isLoading).toBe(false);
    });

    it('should initialize empty if no token exists', async () => {
      (getStoredToken as jest.Mock).mockResolvedValueOnce(null);
      
      await useAuthStore.getState().initialize();
      
      expect(useAuthStore.getState().user).toBeNull();
      expect(useAuthStore.getState().token).toBeNull();
      expect(useAuthStore.getState().isLoading).toBe(false);
    });

    it('should logout if getCurrentUser fails', async () => {
      (getStoredToken as jest.Mock).mockResolvedValueOnce('fake-token');
      (authApi.getCurrentUser as jest.Mock).mockRejectedValueOnce(new Error('Token invalid'));
      
      await useAuthStore.getState().initialize();
      
      expect(removeStoredToken).toHaveBeenCalled();
      expect(useAuthStore.getState().user).toBeNull();
      expect(useAuthStore.getState().token).toBeNull();
      expect(useAuthStore.getState().isLoading).toBe(false);
    });
  });
});

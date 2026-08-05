import { useAuthStore } from '../auth';
import { authApi, setStoredToken, removeStoredToken, getStoredToken } from '../../lib/api';

jest.mock('../../lib/api', () => ({
  authApi: {
    login: jest.fn(),
    register: jest.fn(),
    getCurrentUser: jest.fn(),
    logout: jest.fn(),
    forgotPassword: jest.fn(),
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
      authNotice: null,
    });
  });

  describe('login', () => {
    it('should login successfully and set user and token', async () => {
      const mockResponse = {
        token: 'fake-token',
        state: 'authenticated',
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

      await expect(useAuthStore.getState().login('test@test.com', 'password')).rejects.toThrow(
        'Login failed'
      );
      expect(useAuthStore.getState().isLoading).toBe(false);
      expect(useAuthStore.getState().user).toBeNull();
    });
  });

  describe('register', () => {
    it('mantém usuário sem sessão enquanto aguarda confirmação', async () => {
      (authApi.register as jest.Mock).mockResolvedValueOnce({
        state: 'confirmation_required',
        code: 'EMAIL_NOT_CONFIRMED',
      });

      await useAuthStore
        .getState()
        .register('Pessoa Teste', 'pessoa@example.com', 'review', 'Password123', true, 'São Paulo');

      expect(setStoredToken).not.toHaveBeenCalled();
      expect(useAuthStore.getState().user).toBeNull();
      expect(useAuthStore.getState().authNotice).toContain('Confirme seu e-mail');
    });
  });

  describe('logout', () => {
    it('should logout successfully and clear state', async () => {
      useAuthStore.setState({
        user: { id: 1, name: 'Test', email: 'test@test.com', role: 'consumer' as const },
        token: 'fake-token',
      });

      (authApi.logout as jest.Mock).mockResolvedValueOnce(undefined);
      await useAuthStore.getState().logout();

      expect(authApi.logout).toHaveBeenCalled();
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

    it('preserva o token se a validação falhar por rede', async () => {
      (getStoredToken as jest.Mock)
        .mockResolvedValueOnce('fake-token')
        .mockResolvedValueOnce('fake-token');
      (authApi.getCurrentUser as jest.Mock).mockRejectedValueOnce({
        status: 0,
        message: 'Offline',
      });

      await useAuthStore.getState().initialize();

      expect(removeStoredToken).not.toHaveBeenCalled();
      expect(useAuthStore.getState().token).toBe('fake-token');
      expect(useAuthStore.getState().authNotice).toContain('Sem conexão');
    });

    it('should logout if getCurrentUser fails', async () => {
      (getStoredToken as jest.Mock).mockResolvedValueOnce('fake-token');
      (authApi.getCurrentUser as jest.Mock).mockRejectedValueOnce({
        status: 401,
        message: 'Token invalid',
      });

      await useAuthStore.getState().initialize();

      expect(removeStoredToken).toHaveBeenCalled();
      expect(useAuthStore.getState().user).toBeNull();
      expect(useAuthStore.getState().token).toBeNull();
      expect(useAuthStore.getState().isLoading).toBe(false);
    });
  });
});

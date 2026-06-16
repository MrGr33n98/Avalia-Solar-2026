import * as SecureStore from 'expo-secure-store';
import { getStoredToken, setStoredToken, removeStoredToken } from '../authStorage';

jest.mock('expo-secure-store', () => ({
  getItemAsync: jest.fn(),
  setItemAsync: jest.fn(),
  deleteItemAsync: jest.fn(),
}));

describe('authStorage', () => {
  const originalConsoleError = console.error;

  beforeEach(() => {
    jest.clearAllMocks();
    console.error = jest.fn(); // Suppress console.error in tests
  });

  afterAll(() => {
    console.error = originalConsoleError;
  });

  describe('getStoredToken', () => {
    it('should return the token when available', async () => {
      (SecureStore.getItemAsync as jest.Mock).mockResolvedValueOnce('mock_token');
      const token = await getStoredToken();
      expect(token).toBe('mock_token');
      expect(SecureStore.getItemAsync).toHaveBeenCalledWith('auth_token');
    });

    it('should return null when there is an error', async () => {
      (SecureStore.getItemAsync as jest.Mock).mockRejectedValueOnce(new Error('Test error'));
      const token = await getStoredToken();
      expect(token).toBeNull();
      expect(console.error).toHaveBeenCalled();
    });
  });

  describe('setStoredToken', () => {
    it('should set the token successfully', async () => {
      (SecureStore.setItemAsync as jest.Mock).mockResolvedValueOnce(undefined);
      await setStoredToken('new_token');
      expect(SecureStore.setItemAsync).toHaveBeenCalledWith('auth_token', 'new_token');
    });

    it('should log an error when set fails', async () => {
      (SecureStore.setItemAsync as jest.Mock).mockRejectedValueOnce(new Error('Test error'));
      await setStoredToken('new_token');
      expect(console.error).toHaveBeenCalled();
    });
  });

  describe('removeStoredToken', () => {
    it('should remove the token successfully', async () => {
      (SecureStore.deleteItemAsync as jest.Mock).mockResolvedValueOnce(undefined);
      await removeStoredToken();
      expect(SecureStore.deleteItemAsync).toHaveBeenCalledWith('auth_token');
    });

    it('should log an error when remove fails', async () => {
      (SecureStore.deleteItemAsync as jest.Mock).mockRejectedValueOnce(new Error('Test error'));
      await removeStoredToken();
      expect(console.error).toHaveBeenCalled();
    });
  });
});

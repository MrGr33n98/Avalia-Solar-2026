import { create } from 'zustand';
import { authApi, getStoredToken, setStoredToken, removeStoredToken, User } from '../lib/api';

interface AuthState {
  user: User | null;
  token: string | null;
  isLoading: boolean;
  login: (email: string, password?: string, code?: string) => Promise<void>;
  register: (name: string, email: string, role: string, password?: string) => Promise<void>;
  logout: () => Promise<void>;
  initialize: () => Promise<void>;
}

export const useAuthStore = create<AuthState>((set) => ({
  user: null,
  token: null,
  isLoading: true,

  login: async (email, password, code) => {
    set({ isLoading: true });
    try {
      const response = await authApi.login({ email, password, code });
      await setStoredToken(response.token);
      set({ user: response.user, token: response.token, isLoading: false });
    } catch (error) {
      set({ isLoading: false });
      throw error;
    }
  },

  register: async (name, email, role, password) => {
    set({ isLoading: true });
    try {
      const response = await authApi.register({ name, email, role, password });
      await setStoredToken(response.token);
      set({ user: response.user, token: response.token, isLoading: false });
    } catch (error) {
      set({ isLoading: false });
      throw error;
    }
  },

  logout: async () => {
    set({ isLoading: true });
    try {
      await removeStoredToken();
      set({ user: null, token: null, isLoading: false });
    } catch (error) {
      set({ isLoading: false });
      console.error('[AuthStore] Erro durante o logout:', error);
    }
  },

  initialize: async () => {
    set({ isLoading: true });
    try {
      const token = await getStoredToken();
      if (token) {
        // Tenta obter o usuário logado para validar o token
        const user = await authApi.getCurrentUser();
        set({ user, token, isLoading: false });
      } else {
        set({ user: null, token: null, isLoading: false });
      }
    } catch (error) {
      console.warn('[AuthStore] Falha ao inicializar a sessão:', error);
      // Se der erro de token expirado/inválido, removemos o token salvo
      await removeStoredToken();
      set({ user: null, token: null, isLoading: false });
    }
  },
}));

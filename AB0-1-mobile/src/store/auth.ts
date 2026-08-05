import { create } from 'zustand';
import { authApi, getStoredToken, setStoredToken, removeStoredToken, User } from '../lib/api';

interface AuthState {
  user: User | null;
  token: string | null;
  isLoading: boolean;
  authNotice: string | null;
  login: (email: string, password?: string, code?: string) => Promise<void>;
  register: (
    name: string,
    email: string,
    role: 'review' | 'company',
    password: string,
    termsAccepted: boolean,
    city: string
  ) => Promise<void>;
  logout: () => Promise<void>;
  initialize: () => Promise<void>;
}

export const useAuthStore = create<AuthState>((set) => ({
  user: null,
  token: null,
  isLoading: true,
  authNotice: null,

  login: async (email, password, code) => {
    set({ isLoading: true });
    try {
      const response = await authApi.login({ email, password, code });
      if (!response.token || !response.user)
        throw new Error('A API não retornou uma sessão autenticada.');
      await setStoredToken(response.token);
      set({
        user: response.user,
        token: response.token,
        isLoading: false,
        authNotice: null,
      });
    } catch (error) {
      set({ isLoading: false });
      throw error;
    }
  },

  register: async (name, email, role, password, termsAccepted, city) => {
    set({ isLoading: true, authNotice: null });
    try {
      const response = await authApi.register({
        name,
        email,
        role,
        password,
        password_confirmation: password,
        terms_accepted: termsAccepted,
        city,
      });
      if (response.token && response.user && response.state === 'authenticated') {
        await setStoredToken(response.token);
        set({ user: response.user, token: response.token, isLoading: false });
        return;
      }
      const notice =
        response.state === 'pending_approval'
          ? 'Cadastro enviado. Aguarde a aprovação da sua empresa.'
          : 'Cadastro enviado. Confirme seu e-mail para acessar a conta.';
      set({ user: null, token: null, isLoading: false, authNotice: notice });
    } catch (error) {
      set({ isLoading: false });
      throw error;
    }
  },

  logout: async () => {
    set({ isLoading: true });
    try {
      try {
        await authApi.logout();
      } catch (error) {
        console.warn('[AuthStore] Não foi possível revogar a sessão remotamente:', error);
      }
      await removeStoredToken();
      set({ user: null, token: null, isLoading: false, authNotice: null });
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
        // Tenta obter o usuário logado com timeout de 5 segundos
        const userPromise = authApi.getCurrentUser();
        const timeoutPromise = new Promise((_, reject) =>
          setTimeout(() => reject(new Error('Timeout fetching user')), 5000)
        );

        const user = (await Promise.race([userPromise, timeoutPromise])) as User;
        set({ user, token, isLoading: false });
      } else {
        set({ user: null, token: null, isLoading: false, authNotice: null });
      }
    } catch (error: any) {
      console.warn('[AuthStore] Falha ao inicializar a sessão:', error);
      const status = error?.status ?? error?.details?.status;
      if (status === 401 || status === 403) {
        await removeStoredToken();
        set({ user: null, token: null, isLoading: false, authNotice: null });
      } else {
        set({
          user: null,
          token: await getStoredToken(),
          isLoading: false,
          authNotice: 'Sem conexão. Tente novamente para validar sua sessão.',
        });
      }
    }
  },
}));

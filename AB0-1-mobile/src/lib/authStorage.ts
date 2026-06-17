import * as SecureStore from 'expo-secure-store';

const TOKEN_KEY = 'auth_token';

export const getStoredToken = async (): Promise<string | null> => {
  try {
    return await SecureStore.getItemAsync(TOKEN_KEY);
  } catch (error) {
    console.error('[API] Erro ao ler token do SecureStore:', error);
    return null;
  }
};

export const setStoredToken = async (token: string): Promise<void> => {
  try {
    await SecureStore.setItemAsync(TOKEN_KEY, token);
  } catch (error) {
    console.error('[API] Erro ao salvar token no SecureStore:', error);
  }
};

export const removeStoredToken = async (): Promise<void> => {
  try {
    await SecureStore.deleteItemAsync(TOKEN_KEY);
  } catch (error) {
    console.error('[API] Erro ao remover token do SecureStore:', error);
  }
};

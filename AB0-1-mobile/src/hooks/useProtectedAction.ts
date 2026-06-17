import { useRouter } from 'expo-router';
import { useAuthStore } from '../store/auth';
import { Alert } from 'react-native';

export function useProtectedAction() {
  const router = useRouter();
  const { user } = useAuthStore();

  return <TArgs extends any[], TReturn>(
    action: (...args: TArgs) => TReturn,
    options?: { requireCompany?: boolean; fallbackMessage?: string }
  ) => {
    return (...args: TArgs): TReturn | void => {
      if (!user) {
        Alert.alert(
          'Login Necessário',
          options?.fallbackMessage || 'Você precisa estar logado para realizar esta ação.',
          [
            { text: 'Cancelar', style: 'cancel' },
            { text: 'Fazer Login', onPress: () => router.push('/profile') }
          ]
        );
        return;
      }

      if (options?.requireCompany && user.role !== 'company') {
        Alert.alert('Acesso Restrito', 'Esta ação é exclusiva para parceiros.');
        return;
      }

      return action(...args);
    };
  };
}

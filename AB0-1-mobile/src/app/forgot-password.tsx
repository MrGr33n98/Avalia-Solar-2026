import React, { useState } from 'react';
import {
  StyleSheet,
  View,
  TextInput,
  TouchableOpacity,
  ActivityIndicator,
  useColorScheme,
  Alert,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';
import { ArrowLeft, Mail, KeyRound } from 'lucide-react-native';

import { ThemedText } from '@/components/themed-text';
import { ThemedView } from '@/components/themed-view';
import { Colors, Spacing } from '@/constants/theme';

import { authApi } from '@/lib/api';
export default function ForgotPasswordScreen() {
  const scheme = useColorScheme();
  const colors = Colors[scheme === 'unspecified' || !scheme ? 'light' : scheme];
  const router = useRouter();

  const [contact, setContact] = useState('');
  const [loading, setLoading] = useState(false);
  const [isSent, setIsSent] = useState(false);

  const handleResetPassword = async () => {
    const email = contact.trim();
    if (!email) {
      Alert.alert('E-mail obrigatório', 'Informe seu e-mail para receber o link de recuperação.');
      return;
    }

    setLoading(true);
    try {
      await authApi.forgotPassword(email);
      setIsSent(true);
      Alert.alert(
        'Solicitação recebida',
        'Se o e-mail existir na nossa base, enviaremos um link de redefinição.'
      );
    } catch (error: any) {
      const message =
        error?.status === 429
          ? 'Muitas tentativas. Aguarde alguns minutos e tente novamente.'
          : error?.message || 'Não foi possível solicitar a recuperação. Tente novamente.';
      Alert.alert('Não foi possível enviar', message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <ThemedView style={styles.container}>
      <SafeAreaView style={styles.safeArea}>
        {/* Header */}
        <View style={styles.header}>
          <TouchableOpacity
            accessibilityRole="button"
            accessibilityLabel="Voltar"
            style={[styles.backButton, { backgroundColor: colors.surfaceSubtle }]}
            onPress={() => router.back()}
          >
            <ArrowLeft color={colors.backgroundElement} size={24} />
          </TouchableOpacity>
          <ThemedText style={[styles.headerTitle, { color: colors.backgroundElement }]}>
            Recuperar Senha
          </ThemedText>
          <View style={{ width: 40 }} />
        </View>

        <View style={styles.content}>
          {!isSent ? (
            <>
              <View style={[styles.iconContainer, { backgroundColor: colors.tint + '1A' }]}>
                <KeyRound size={40} color={colors.tint} />
              </View>

              <ThemedText style={styles.description} themeColor="textSecondary">
                Esqueceu sua senha? Não se preocupe. Digite seu e-mail e enviaremos um link para
                redefinição.
              </ThemedText>

              <View style={[styles.inputContainer, { backgroundColor: colors.backgroundElement }]}>
                <Mail size={18} color={colors.textSecondary} />
                <TextInput
                  accessibilityLabel="E-mail"
                  placeholder="e-mail"
                  placeholderTextColor={colors.textSecondary}
                  keyboardType="email-address"
                  autoCapitalize="none"
                  style={[styles.inputField, { color: colors.text }]}
                  value={contact}
                  onChangeText={setContact}
                />
              </View>

              <TouchableOpacity
                accessibilityRole="button"
                accessibilityLabel="Enviar link de recuperação"
                style={[styles.submitButton, { backgroundColor: colors.brandDarkBlue }]}
                onPress={handleResetPassword}
                disabled={loading}
              >
                {loading ? (
                  <ActivityIndicator color={colors.backgroundElement} />
                ) : (
                  <ThemedText
                    style={[styles.submitButtonText, { color: colors.backgroundElement }]}
                  >
                    Enviar link
                  </ThemedText>
                )}
              </TouchableOpacity>
            </>
          ) : (
            <View style={styles.successContainer}>
              <View style={[styles.iconContainer, { backgroundColor: colors.success + '1A' }]}>
                <KeyRound size={40} color={colors.success} />
              </View>

              <ThemedText type="subtitle" style={styles.successTitle}>
                Verifique seu e-mail
              </ThemedText>

              <ThemedText style={styles.successDesc} themeColor="textSecondary">
                Enviamos instruções detalhadas para você criar uma nova senha. Caso não receba em
                alguns minutos, verifique a pasta de spam.
              </ThemedText>

              <TouchableOpacity
                accessibilityRole="button"
                accessibilityLabel="Voltar para o login"
                style={[styles.submitButton, { backgroundColor: colors.tint }]}
                onPress={() => router.replace('/profile')}
              >
                <ThemedText style={[styles.submitButtonText, { color: colors.backgroundElement }]}>
                  Voltar para o Login
                </ThemedText>
              </TouchableOpacity>
            </View>
          )}
        </View>
      </SafeAreaView>
    </ThemedView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  safeArea: {
    flex: 1,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingVertical: 12,
  },
  backButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    justifyContent: 'center',
    alignItems: 'center',
  },
  headerTitle: {
    fontSize: 16,
    fontWeight: '700',
  },
  content: {
    flex: 1,
    paddingHorizontal: 24,
    paddingTop: 40,
    alignItems: 'center',
    gap: 20,
  },
  iconContainer: {
    width: 80,
    height: 80,
    borderRadius: 40,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 10,
  },
  description: {
    fontSize: 14,
    textAlign: 'center',
    lineHeight: 22,
    marginBottom: 10,
  },
  inputContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    height: 50,
    borderRadius: 12,
    paddingHorizontal: 16,
    gap: 12,
    width: '100%',
  },
  inputField: {
    flex: 1,
    fontSize: 14,
    height: '100%',
  },
  submitButton: {
    height: 50,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
    width: '100%',
    marginTop: 10,
  },
  submitButtonText: {
    fontSize: 15,
    fontWeight: 'bold',
  },
  successContainer: {
    alignItems: 'center',
    gap: 16,
    width: '100%',
  },
  successTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    textAlign: 'center',
  },
  successDesc: {
    fontSize: 14,
    textAlign: 'center',
    lineHeight: 22,
  },
});

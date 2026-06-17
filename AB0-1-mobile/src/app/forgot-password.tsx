import React, { useState } from 'react';
import { Colors } from '@/constants/theme';
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
import { ArrowLeft, Mail, Phone, KeyRound } from 'lucide-react-native';

import { ThemedText } from '@/components/themed-text';
import { ThemedView } from '@/components/themed-view';
import { Colors, Spacing } from '@/constants/theme';

export default function ForgotPasswordScreen() {
  const scheme = useColorScheme();
  const colors = Colors[scheme === 'unspecified' || !scheme ? 'light' : scheme];
  const router = useRouter();

  const [contact, setContact] = useState('');
  const [loading, setLoading] = useState(false);
  const [isSent, setIsSent] = useState(false);

  const handleResetPassword = () => {
    if (!contact.trim()) {
      Alert.alert('Erro', 'Por favor, informe seu E-mail ou WhatsApp.');
      return;
    }

    setLoading(true);
    // Simular chamada de API
    setTimeout(() => {
      setLoading(false);
      setIsSent(true);
      Alert.alert(
        'Código Enviado',
        `Um link de redefinição de senha foi enviado para ${contact}.`
      );
    }, 1500);
  };

  return (
    <ThemedView style={styles.container}>
      <SafeAreaView style={styles.safeArea}>
        
        {/* Header */}
        <View style={styles.header}>
          <TouchableOpacity style={styles.backButton} onPress={() => router.back()}>
            <ArrowLeft color={colors.backgroundElement} size={24} />
          </TouchableOpacity>
          <ThemedText style={styles.headerTitle}>Recuperar Senha</ThemedText>
          <View style={{ width: 40 }} />
        </View>

        <View style={styles.content}>
          {!isSent ? (
            <>
              <View style={[styles.iconContainer, { backgroundColor: 'rgba(32, 138, 239, 0.1)' }]}>
                <KeyRound size={40} color={colors.tint} />
              </View>

              <ThemedText style={styles.description} themeColor="textSecondary">
                Esqueceu sua senha? Não se preocupe. Digite seu E-mail ou número de WhatsApp cadastrado e enviaremos um código para redefinição.
              </ThemedText>

              <View style={[styles.inputContainer, { backgroundColor: colors.backgroundElement }]}>
                <Mail size={18} color={colors.textSecondary} />
                <TextInput
                  placeholder="E-mail ou WhatsApp"
                  placeholderTextColor={colors.textSecondary}
                  keyboardType="email-address"
                  autoCapitalize="none"
                  style={[styles.inputField, { color: colors.text }]}
                  value={contact}
                  onChangeText={setContact}
                />
              </View>

              <TouchableOpacity
                style={[styles.submitButton, { backgroundColor: colors.brandDarkBlue }]}
                onPress={handleResetPassword}
                disabled={loading}
              >
                {loading ? (
                  <ActivityIndicator color={colors.backgroundElement} />
                ) : (
                  <ThemedText style={styles.submitButtonText}>Enviar Código</ThemedText>
                )}
              </TouchableOpacity>
            </>
          ) : (
            <View style={styles.successContainer}>
              <View style={[styles.iconContainer, { backgroundColor: 'rgba(16, 185, 129, 0.1)' }]}>
                <KeyRound size={40} color={colors.success} />
              </View>

              <ThemedText type="subtitle" style={styles.successTitle}>
                Verifique seu e-mail/WhatsApp
              </ThemedText>
              
              <ThemedText style={styles.successDesc} themeColor="textSecondary">
                Enviamos instruções detalhadas para você criar uma nova senha. Caso não receba em alguns minutos, verifique a pasta de spam.
              </ThemedText>

              <TouchableOpacity
                style={[styles.submitButton, { backgroundColor: colors.tint }]}
                onPress={() => router.replace('/profile')}
              >
                <ThemedText style={styles.submitButtonText}>Voltar para o Login</ThemedText>
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
    backgroundColor: colors.surfaceSubtle,
    justifyContent: 'center',
    alignItems: 'center',
  },
  headerTitle: {
    fontSize: 16,
    fontWeight: '700',
    color: colors.backgroundElement,
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
    color: colors.backgroundElement,
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

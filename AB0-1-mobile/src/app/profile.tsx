import React, { useState } from 'react';
import {
  StyleSheet,
  View,
  TextInput,
  TouchableOpacity,
  ActivityIndicator,
  useColorScheme,
  ScrollView,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';
import {
  User,
  Mail,
  Lock,
  LogOut,
  ShieldCheck,
  ClipboardCheck,
  ArrowRight,
  UserPlus,
} from 'lucide-react-native';

import { ThemedText } from '@/components/themed-text';
import { ThemedView } from '@/components/themed-view';
import { Colors, Spacing } from '@/constants/theme';
import { useAuthStore } from '@/store/auth';

export default function ProfileScreen() {
  const scheme = useColorScheme();
  const colors = Colors[scheme === 'unspecified' || !scheme ? 'light' : scheme];
  const router = useRouter();

  // Estados de Sessão
  const { user, login, register, logout, isLoading, authNotice } = useAuthStore();
  const canUseP2PChat = user?.role === 'review';

  // Estados dos Formulários
  const [isRegistering, setIsRegistering] = useState(false);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [name, setName] = useState('');
  const [city, setCity] = useState('');
  const [termsAccepted, setTermsAccepted] = useState(false);
  const [role, setRole] = useState<'review' | 'company'>('review');

  // Tratamento de erros e loading local
  const [errorMsg, setErrorMsg] = useState('');
  const [formLoading, setFormLoading] = useState(false);

  const handleSubmit = async () => {
    setErrorMsg('');
    if (!email || !password || (isRegistering && (!name || !city || !termsAccepted))) {
      setErrorMsg('Preencha os campos obrigatórios e aceite os termos.');
      return;
    }

    if (
      password.length < 8 ||
      !/[A-Z]/.test(password) ||
      !/[a-z]/.test(password) ||
      !/\d/.test(password)
    ) {
      setErrorMsg('Use 8 ou mais caracteres, com maiúscula, minúscula e número.');
      return;
    }

    setFormLoading(true);
    try {
      if (isRegistering) {
        await register(name, email, role, password, termsAccepted, city);
      } else {
        await login(email, password);
      }
    } catch (err: any) {
      console.error('[Profile] Erro ao submeter formulário:', err);
      setErrorMsg(err?.message || 'Ocorreu um erro. Verifique suas credenciais e tente novamente.');
    } finally {
      setFormLoading(false);
    }
  };

  const handleLogout = async () => {
    setFormLoading(true);
    try {
      await logout();
    } catch (err) {
      console.error('[Profile] Erro no logout:', err);
    } finally {
      setFormLoading(false);
    }
  };

  // 1. Estado de Carregamento Geral (Inicializando sessão)
  if (isLoading && !formLoading) {
    return (
      <ThemedView style={styles.centerContainer}>
        <ActivityIndicator size="large" color={colors.tint} />
        <ThemedText style={{ marginTop: Spacing.three }}>Carregando perfil...</ThemedText>
      </ThemedView>
    );
  }

  // 2. Tela de Usuário Logado
  if (user) {
    return (
      <ThemedView style={styles.container}>
        <SafeAreaView style={styles.safeArea}>
          <ScrollView contentContainerStyle={styles.scrollContent}>
            {/* Cabeçalho do Perfil */}
            <View style={styles.profileHeader}>
              <View
                style={[styles.avatarContainer, { backgroundColor: colors.backgroundSelected }]}
              >
                <User size={40} color={colors.tint} />
              </View>
              <ThemedText type="subtitle" style={styles.profileName}>
                {user.name}
              </ThemedText>
              <ThemedText style={styles.profileEmail} themeColor="textSecondary">
                {user.email}
              </ThemedText>

              <View
                style={[
                  styles.roleBadge,
                  {
                    backgroundColor:
                      user.role === 'company' ? colors.success + '20' : colors.tint + '20',
                  },
                ]}
              >
                <ThemedText
                  style={[
                    styles.roleBadgeText,
                    {
                      color: user.role === 'company' ? colors.success : colors.tint,
                    },
                  ]}
                >
                  {user.role === 'company' ? 'Parceiro Solar' : 'Consumidor'}
                </ThemedText>
              </View>
            </View>

            {/* Ações e Links rápidos */}
            <View style={styles.actionSection}>
              <ThemedText style={[styles.sectionTitle, { color: colors.textSecondary }]}>
                Opções da Conta
              </ThemedText>

              {canUseP2PChat && (
                <TouchableOpacity
                  style={[styles.menuItem, { backgroundColor: colors.backgroundElement }]}
                  onPress={() => router.push('/p2p_chat')}
                >
                  <View style={styles.menuItemLeft}>
                    <ClipboardCheck size={20} color={colors.tint} />
                    <ThemedText style={styles.menuItemText}>Minhas Negociações</ThemedText>
                  </View>
                  <ArrowRight size={16} color={colors.textSecondary} />
                </TouchableOpacity>
              )}

              {user.role === 'company' && (
                <TouchableOpacity
                  style={[styles.menuItem, { backgroundColor: colors.backgroundElement }]}
                  onPress={() => router.push('/dashboard')}
                >
                  <View style={styles.menuItemLeft}>
                    <ShieldCheck size={20} color={colors.success} />
                    <ThemedText style={styles.menuItemText}>Dashboard da Empresa</ThemedText>
                  </View>
                  <ArrowRight size={16} color={colors.textSecondary} />
                </TouchableOpacity>
              )}
            </View>

            {/* Logout */}
            <TouchableOpacity
              style={[styles.logoutButton, { borderColor: colors.danger }]}
              onPress={handleLogout}
              disabled={formLoading}
            >
              {formLoading ? (
                <ActivityIndicator color={colors.danger} />
              ) : (
                <>
                  <LogOut size={18} color={colors.danger} />
                  <ThemedText style={[styles.logoutButtonText, { color: colors.danger }]}>
                    Sair da Conta
                  </ThemedText>
                </>
              )}
            </TouchableOpacity>
          </ScrollView>
        </SafeAreaView>
      </ThemedView>
    );
  }

  // 3. Formulário de Login / Registro
  return (
    <ThemedView style={styles.container}>
      <SafeAreaView style={styles.safeArea}>
        <ScrollView
          contentContainerStyle={styles.scrollContent}
          keyboardShouldPersistTaps="handled"
        >
          <View style={styles.authHeader}>
            <ThemedText type="title" style={styles.authTitle}>
              {isRegistering ? 'Criar uma Conta' : 'Olá novamente!'}
            </ThemedText>
            <ThemedText style={styles.authSubtitle} themeColor="textSecondary">
              {isRegistering
                ? 'Registre-se para cotar e avaliar instaladores solares'
                : 'Faça login para gerenciar suas solicitações de energia solar'}
            </ThemedText>
          </View>

          {/* Form */}
          <View style={styles.formContainer}>
            {authNotice ? (
              <View
                style={[
                  styles.noticeBox,
                  {
                    backgroundColor: colors.success + '10',
                    borderColor: colors.success + '30',
                  },
                ]}
              >
                <ThemedText style={[styles.errorText, { color: colors.success }]}>
                  {authNotice}
                </ThemedText>
              </View>
            ) : null}

            {errorMsg ? (
              <View
                style={[
                  styles.errorBox,
                  {
                    backgroundColor: colors.danger + '10',
                    borderColor: colors.danger + '20',
                  },
                ]}
              >
                <ThemedText style={[styles.errorText, { color: colors.danger }]}>
                  {errorMsg}
                </ThemedText>
              </View>
            ) : null}

            {isRegistering && (
              <View
                style={[
                  styles.inputContainer,
                  {
                    backgroundColor: colors.backgroundElement,
                    borderColor: colors.border,
                    borderWidth: 1,
                  },
                ]}
              >
                <User size={18} color={colors.textSecondary} />
                <TextInput
                  accessibilityLabel="Nome completo"
                  placeholder="Nome Completo"
                  placeholderTextColor={colors.textSecondary}
                  style={[styles.inputField, { color: colors.text }]}
                  value={name}
                  onChangeText={setName}
                />
              </View>
            )}

            {isRegistering && (
              <View
                style={[
                  styles.inputContainer,
                  {
                    backgroundColor: colors.backgroundElement,
                    borderColor: colors.border,
                    borderWidth: 1,
                  },
                ]}
              >
                <User size={18} color={colors.textSecondary} />
                <TextInput
                  accessibilityLabel="Cidade"
                  placeholder="Cidade"
                  placeholderTextColor={colors.textSecondary}
                  style={[styles.inputField, { color: colors.text }]}
                  value={city}
                  onChangeText={setCity}
                />
              </View>
            )}

            <View
              style={[
                styles.inputContainer,
                {
                  backgroundColor: colors.backgroundElement,
                  borderColor: colors.border,
                  borderWidth: 1,
                },
              ]}
            >
              <Mail size={18} color={colors.textSecondary} />
              <TextInput
                accessibilityLabel="E-mail"
                placeholder="E-mail"
                placeholderTextColor={colors.textSecondary}
                keyboardType="email-address"
                autoCapitalize="none"
                style={[styles.inputField, { color: colors.text }]}
                value={email}
                onChangeText={setEmail}
              />
            </View>

            <View
              style={[
                styles.inputContainer,
                {
                  backgroundColor: colors.backgroundElement,
                  borderColor: colors.border,
                  borderWidth: 1,
                },
              ]}
            >
              <Lock size={18} color={colors.textSecondary} />
              <TextInput
                accessibilityLabel="Senha"
                placeholder="Senha"
                placeholderTextColor={colors.textSecondary}
                secureTextEntry
                autoCapitalize="none"
                style={[styles.inputField, { color: colors.text }]}
                value={password}
                onChangeText={setPassword}
              />
            </View>

            {!isRegistering && (
              <TouchableOpacity
                style={styles.forgotPasswordContainer}
                onPress={() => router.push('/forgot-password')}
              >
                <ThemedText style={[styles.forgotPasswordText, { color: colors.tint }]}>
                  Esqueceu sua senha?
                </ThemedText>
              </TouchableOpacity>
            )}

            {/* Seletor de Tipo de Perfil (Apenas no Registro) */}
            {isRegistering && (
              <View style={styles.roleSelectorContainer}>
                <ThemedText style={[styles.roleSelectorLabel, { color: colors.textSecondary }]}>
                  Tipo de Conta:
                </ThemedText>
                <View style={styles.roleButtonsRow}>
                  <TouchableOpacity
                    style={[
                      styles.roleButton,
                      {
                        backgroundColor: colors.backgroundElement,
                        borderColor: colors.border,
                        borderWidth: 1,
                      },
                      role === 'review' && {
                        backgroundColor: colors.tint + '15',
                        borderColor: colors.tint,
                        borderWidth: 1.5,
                      },
                    ]}
                    accessibilityRole="radio"
                    accessibilityState={{ selected: role === 'review' }}
                    onPress={() => setRole('review')}
                  >
                    <ThemedText
                      style={[
                        styles.roleButtonText,
                        {
                          color: role === 'review' ? colors.tint : colors.textSecondary,
                        },
                        role === 'review' && { fontWeight: 'bold' },
                      ]}
                    >
                      Consumidor
                    </ThemedText>
                  </TouchableOpacity>
                  <TouchableOpacity
                    style={[
                      styles.roleButton,
                      {
                        backgroundColor: colors.backgroundElement,
                        borderColor: colors.border,
                        borderWidth: 1,
                      },
                      role === 'company' && {
                        backgroundColor: colors.success + '15',
                        borderColor: colors.success,
                        borderWidth: 1.5,
                      },
                    ]}
                    accessibilityRole="radio"
                    accessibilityState={{ selected: role === 'company' }}
                    onPress={() => setRole('company')}
                  >
                    <ThemedText
                      style={[
                        styles.roleButtonText,
                        {
                          color: role === 'company' ? colors.success : colors.textSecondary,
                        },
                        role === 'company' && { fontWeight: 'bold' },
                      ]}
                    >
                      Empresa
                    </ThemedText>
                  </TouchableOpacity>
                </View>
              </View>
            )}

            {isRegistering && (
              <TouchableOpacity
                accessibilityRole="checkbox"
                accessibilityState={{ checked: termsAccepted }}
                style={styles.termsRow}
                onPress={() => setTermsAccepted((value) => !value)}
              >
                <View
                  style={[
                    styles.checkbox,
                    {
                      borderColor: termsAccepted ? colors.tint : colors.border,
                      backgroundColor: termsAccepted ? colors.tint : colors.backgroundElement,
                    },
                  ]}
                />
                <ThemedText style={[styles.termsText, { color: colors.textSecondary }]}>
                  Aceito os Termos de Uso e a Política de Privacidade.
                </ThemedText>
              </TouchableOpacity>
            )}

            {/* Botão Submit */}
            <TouchableOpacity
              accessibilityRole="button"
              accessibilityLabel={isRegistering ? 'Cadastrar conta' : 'Entrar'}
              style={[styles.submitButton, { backgroundColor: colors.brandActiveBlue }]}
              onPress={handleSubmit}
              disabled={formLoading}
            >
              {formLoading ? (
                <ActivityIndicator color={colors.backgroundElement} />
              ) : (
                <>
                  <ThemedText
                    style={[styles.submitButtonText, { color: colors.backgroundElement }]}
                  >
                    {isRegistering ? 'Cadastrar' : 'Entrar'}
                  </ThemedText>
                  <ArrowRight
                    size={18}
                    color={colors.backgroundElement}
                    style={{ marginLeft: 6 }}
                  />
                </>
              )}
            </TouchableOpacity>

            {/* Switch Login/Cadastro */}
            <TouchableOpacity
              style={styles.switchAuthType}
              onPress={() => {
                setIsRegistering(!isRegistering);
                setErrorMsg('');
              }}
            >
              <ThemedText style={[styles.switchAuthTypeText, { color: colors.tint }]}>
                {isRegistering
                  ? 'Já possui uma conta? Faça login'
                  : 'Não tem conta? Cadastre-se grátis'}
              </ThemedText>
            </TouchableOpacity>
          </View>
        </ScrollView>
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
  centerContainer: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  scrollContent: {
    paddingHorizontal: Spacing.four,
    paddingTop: Spacing.four,
    paddingBottom: Spacing.six,
  },
  authHeader: {
    marginTop: Spacing.five,
    marginBottom: Spacing.five,
    gap: 4,
  },
  authTitle: {
    fontSize: 28,
    fontWeight: 'bold',
  },
  authSubtitle: {
    fontSize: 14,
    lineHeight: 20,
  },
  formContainer: {
    gap: Spacing.three,
  },
  noticeBox: {
    padding: Spacing.three,
    borderRadius: Spacing.two,
    borderWidth: 1,
  },
  termsRow: {
    minHeight: 44,
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.two,
  },
  checkbox: {
    width: 22,
    height: 22,
    borderRadius: 4,
    borderWidth: 2,
  },
  termsText: {
    flex: 1,
    fontSize: 13,
    lineHeight: 18,
  },
  errorBox: {
    padding: Spacing.three,
    borderRadius: Spacing.two,
    borderWidth: 1,
  },
  errorText: {
    fontSize: 13,
    fontWeight: '500',
  },
  inputContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    height: 50,
    borderRadius: Spacing.three,
    paddingHorizontal: Spacing.three,
    gap: Spacing.two,
  },
  inputField: {
    flex: 1,
    fontSize: 14,
    height: '100%',
  },
  roleSelectorContainer: {
    marginTop: Spacing.two,
    gap: Spacing.two,
  },
  roleSelectorLabel: {
    fontSize: 13,
    fontWeight: 'bold',
  },
  roleButtonsRow: {
    flexDirection: 'row',
    gap: Spacing.three,
  },
  roleButton: {
    flex: 1,
    height: 44,
    borderRadius: Spacing.two,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1.5,
    borderColor: 'transparent',
  },
  roleButtonText: {
    fontSize: 13,
  },
  submitButton: {
    height: 50,
    borderRadius: Spacing.three,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: Spacing.three,
  },
  submitButtonText: {
    fontSize: 16,
    fontWeight: 'bold',
  },
  switchAuthType: {
    alignItems: 'center',
    paddingVertical: Spacing.two,
    marginTop: Spacing.two,
  },
  switchAuthTypeText: {
    fontSize: 13,
    fontWeight: '500',
  },
  profileHeader: {
    alignItems: 'center',
    marginTop: Spacing.four,
    marginBottom: Spacing.five,
    gap: Spacing.two,
  },
  avatarContainer: {
    width: 80,
    height: 80,
    borderRadius: 40,
    alignItems: 'center',
    justifyContent: 'center',
  },
  profileName: {
    fontSize: 20,
    fontWeight: 'bold',
  },
  profileEmail: {
    fontSize: 14,
  },
  roleBadge: {
    paddingHorizontal: Spacing.three,
    paddingVertical: 4,
    borderRadius: 12,
  },
  roleBadgeText: {
    fontSize: 11,
    fontWeight: 'bold',
  },
  actionSection: {
    gap: Spacing.two,
    marginBottom: Spacing.six,
  },
  sectionTitle: {
    fontSize: 12,
    fontWeight: 'bold',
    textTransform: 'uppercase',
    marginBottom: Spacing.one,
  },
  menuItem: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: Spacing.three,
    borderRadius: Spacing.three,
  },
  menuItemLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.three,
  },
  menuItemText: {
    fontSize: 14,
    fontWeight: '600',
  },
  logoutButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    height: 48,
    borderRadius: Spacing.three,
    borderWidth: 1,
    gap: Spacing.two,
  },
  logoutButtonText: {
    fontSize: 14,
    fontWeight: 'bold',
  },
  forgotPasswordContainer: {
    alignSelf: 'flex-end',
    paddingVertical: Spacing.one,
  },
  forgotPasswordText: {
    fontSize: 13,
    fontWeight: '600',
  },
});

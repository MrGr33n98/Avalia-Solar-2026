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
import { User, Mail, Lock, LogOut, ShieldCheck, ClipboardCheck, ArrowRight, UserPlus } from 'lucide-react-native';

import { ThemedText } from '@/components/themed-text';
import { ThemedView } from '@/components/themed-view';
import { Colors, Spacing } from '@/constants/theme';
import { useAuthStore } from '@/store/auth';

export default function ProfileScreen() {
  const scheme = useColorScheme();
  const colors = Colors[scheme === 'unspecified' || !scheme ? 'light' : scheme];
  const router = useRouter();

  // Estados de Sessão
  const { user, login, register, logout, isLoading } = useAuthStore();

  // Estados dos Formulários
  const [isRegistering, setIsRegistering] = useState(false);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [name, setName] = useState('');
  const [role, setRole] = useState<'consumer' | 'company'>('consumer');
  
  // Tratamento de erros e loading local
  const [errorMsg, setErrorMsg] = useState('');
  const [formLoading, setFormLoading] = useState(false);

  const handleSubmit = async () => {
    setErrorMsg('');
    if (!email || !password || (isRegistering && !name)) {
      setErrorMsg('Por favor, preencha todos os campos obrigatórios.');
      return;
    }

    setFormLoading(true);
    try {
      if (isRegistering) {
        await register(name, email, role, password);
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
        <ActivityIndicator size="large" color="#208AEF" />
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
              <View style={[styles.avatarContainer, { backgroundColor: 'rgba(32, 138, 239, 0.1)' }]}>
                <User size={40} color="#208AEF" />
              </View>
              <ThemedText type="subtitle" style={styles.profileName}>
                {user.name}
              </ThemedText>
              <ThemedText style={styles.profileEmail} themeColor="textSecondary">
                {user.email}
              </ThemedText>
              
              <View style={[styles.roleBadge, { backgroundColor: user.role === 'company' ? 'rgba(16, 185, 129, 0.1)' : 'rgba(32, 138, 239, 0.1)' }]}>
                <ThemedText style={[styles.roleBadgeText, { color: user.role === 'company' ? '#10B981' : '#208AEF' }]}>
                  {user.role === 'company' ? 'Parceiro Solar' : 'Consumidor'}
                </ThemedText>
              </View>
            </View>

            {/* Ações e Links rápidos */}
            <View style={styles.actionSection}>
              <ThemedText style={styles.sectionTitle}>Opções da Conta</ThemedText>
              
              <TouchableOpacity
                style={[styles.menuItem, { backgroundColor: colors.backgroundElement }]}
                onPress={() => router.push('/requests')}
              >
                <View style={styles.menuItemLeft}>
                  <ClipboardCheck size={20} color="#208AEF" />
                  <ThemedText style={styles.menuItemText}>
                    {user.role === 'company' ? 'Leads Recebidos' : 'Minhas Solicitações'}
                  </ThemedText>
                </View>
                <ArrowRight size={16} color="#8E8E93" />
              </TouchableOpacity>

              {user.role === 'company' && (
                <TouchableOpacity
                  style={[styles.menuItem, { backgroundColor: colors.backgroundElement }]}
                  onPress={() => router.push('/requests')} // Redireciona para aba leads por enquanto
                >
                  <View style={styles.menuItemLeft}>
                    <ShieldCheck size={20} color="#10B981" />
                    <ThemedText style={styles.menuItemText}>Empresa Verificada</ThemedText>
                  </View>
                  <ArrowRight size={16} color="#8E8E93" />
                </TouchableOpacity>
              )}
            </View>

            {/* Logout */}
            <TouchableOpacity
              style={[styles.logoutButton, { borderColor: '#E53E3E' }]}
              onPress={handleLogout}
              disabled={formLoading}
            >
              {formLoading ? (
                <ActivityIndicator color="#E53E3E" />
              ) : (
                <>
                  <LogOut size={18} color="#E53E3E" />
                  <ThemedText style={styles.logoutButtonText}>Sair da Conta</ThemedText>
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
        <ScrollView contentContainerStyle={styles.scrollContent} keyboardShouldPersistTaps="handled">
          
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
            {errorMsg ? (
              <View style={styles.errorBox}>
                <ThemedText style={styles.errorText}>{errorMsg}</ThemedText>
              </View>
            ) : null}

            {isRegistering && (
              <View style={[styles.inputContainer, { backgroundColor: colors.backgroundElement }]}>
                <User size={18} color="#8E8E93" />
                <TextInput
                  placeholder="Nome Completo"
                  placeholderTextColor="#8E8E93"
                  style={[styles.inputField, { color: colors.text }]}
                  value={name}
                  onChangeText={setName}
                />
              </View>
            )}

            <View style={[styles.inputContainer, { backgroundColor: colors.backgroundElement }]}>
              <Mail size={18} color="#8E8E93" />
              <TextInput
                placeholder="E-mail"
                placeholderTextColor="#8E8E93"
                keyboardType="email-address"
                autoCapitalize="none"
                style={[styles.inputField, { color: colors.text }]}
                value={email}
                onChangeText={setEmail}
              />
            </View>

            <View style={[styles.inputContainer, { backgroundColor: colors.backgroundElement }]}>
              <Lock size={18} color="#8E8E93" />
              <TextInput
                placeholder="Senha"
                placeholderTextColor="#8E8E93"
                secureTextEntry
                autoCapitalize="none"
                style={[styles.inputField, { color: colors.text }]}
                value={password}
                onChangeText={setPassword}
              />
            </View>

            {/* Seletor de Tipo de Perfil (Apenas no Registro) */}
            {isRegistering && (
              <View style={styles.roleSelectorContainer}>
                <ThemedText style={styles.roleSelectorLabel}>Tipo de Conta:</ThemedText>
                <View style={styles.roleButtonsRow}>
                  <TouchableOpacity
                    style={[
                      styles.roleButton,
                      { backgroundColor: colors.backgroundElement },
                      role === 'consumer' && { backgroundColor: 'rgba(32, 138, 239, 0.15)', borderColor: '#208AEF' },
                    ]}
                    onPress={() => setRole('consumer')}
                  >
                    <ThemedText style={[styles.roleButtonText, role === 'consumer' && { color: '#208AEF', fontWeight: 'bold' }]}>
                      Consumidor
                    </ThemedText>
                  </TouchableOpacity>
                  <TouchableOpacity
                    style={[
                      styles.roleButton,
                      { backgroundColor: colors.backgroundElement },
                      role === 'company' && { backgroundColor: 'rgba(16, 185, 129, 0.15)', borderColor: '#10B981' },
                    ]}
                    onPress={() => setRole('company')}
                  >
                    <ThemedText style={[styles.roleButtonText, role === 'company' && { color: '#10B981', fontWeight: 'bold' }]}>
                      Empresa
                    </ThemedText>
                  </TouchableOpacity>
                </View>
              </View>
            )}

            {/* Botão Submit */}
            <TouchableOpacity
              style={[styles.submitButton, { backgroundColor: '#208AEF' }]}
              onPress={handleSubmit}
              disabled={formLoading}
            >
              {formLoading ? (
                <ActivityIndicator color="#ffffff" />
              ) : (
                <>
                  <ThemedText style={styles.submitButtonText}>
                    {isRegistering ? 'Cadastrar' : 'Entrar'}
                  </ThemedText>
                  <ArrowRight size={18} color="#ffffff" style={{ marginLeft: 6 }} />
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
              <ThemedText style={styles.switchAuthTypeText}>
                {isRegistering ? 'Já possui uma conta? Faça login' : 'Não tem conta? Cadastre-se grátis'}
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
  errorBox: {
    backgroundColor: 'rgba(229, 62, 62, 0.1)',
    padding: Spacing.three,
    borderRadius: Spacing.two,
    borderWidth: 1,
    borderColor: 'rgba(229, 62, 62, 0.2)',
  },
  errorText: {
    color: '#E53E3E',
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
    color: '#8E8E93',
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
    color: '#ffffff',
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
    color: '#208AEF',
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
    color: '#8E8E93',
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
    color: '#E53E3E',
    fontSize: 14,
    fontWeight: 'bold',
  },
});

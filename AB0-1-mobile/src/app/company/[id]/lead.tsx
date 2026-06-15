import React, { useState, useEffect } from 'react';
import {
  StyleSheet,
  View,
  ScrollView,
  TextInput,
  TouchableOpacity,
  ActivityIndicator,
  useColorScheme,
  Alert,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { useQuery, useMutation } from '@tanstack/react-query';
import { ArrowLeft, User, Mail, Phone, MessageSquare, ClipboardList, Send, CheckCircle2 } from 'lucide-react-native';

import { ThemedText } from '@/components/themed-text';
import { ThemedView } from '@/components/themed-view';
import { Colors, Spacing } from '@/constants/theme';
import { companiesApi, leadsApi, categoriesApi } from '@/lib/api';
import { useAuthStore } from '@/store/auth';
import { useTracking } from '@/hooks/useTracking';

export default function LeadFormScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const scheme = useColorScheme();
  const colors = Colors[scheme === 'unspecified' || !scheme ? 'light' : scheme];
  const router = useRouter();
  const { user } = useAuthStore();
  const { trackLeadSent } = useTracking();

  // Estados dos Campos
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [phone, setPhone] = useState('');
  const [message, setMessage] = useState('');
  const [selectedCategoryId, setSelectedCategoryId] = useState<number | null>(null);
  
  // Controle de sucesso e validação
  const [submitted, setSubmitted] = useState(false);
  const [errorMsg, setErrorMsg] = useState('');

  // Pré-preenche informações se o usuário estiver logado
  useEffect(() => {
    if (user) {
      setName(user.name);
      setEmail(user.email);
    }
  }, [user]);

  // Buscar dados da empresa para exibir o nome do destinatário
  const { data: company, isLoading: isLoadingCompany } = useQuery({
    queryKey: ['company-detail-lead', id],
    queryFn: () => companiesApi.getByIdOrSlug(id),
    enabled: !!id,
  });

  // Buscar categorias para o seletor no formulário
  const { data: categories = [] } = useQuery({
    queryKey: ['categories'],
    queryFn: () => categoriesApi.getAll(),
  });

  // Inicializa categoria se a empresa tiver apenas uma
  useEffect(() => {
    if (company?.categories && company.categories.length > 0) {
      setSelectedCategoryId(company.categories[0].id);
    }
  }, [company]);

  // Mutação para enviar lead
  const createLeadMutation = useMutation({
    mutationFn: (data: {
      name: string;
      email: string;
      phone: string;
      message: string;
      category_id?: number;
      city?: string;
      state?: string;
    }) =>
      leadsApi.create({
        company_id: Number(id),
        name: data.name,
        email: data.email,
        phone: data.phone,
        message: data.message,
        category_id: data.category_id,
        city: company?.city || undefined,
        state: company?.state || undefined,
      }),
    onSuccess: () => {
      trackLeadSent(id, 'form');
      setSubmitted(true);
    },
    onError: (err: any) => {
      setErrorMsg(err.message || 'Falha ao enviar solicitação. Verifique sua conexão e tente novamente.');
    },
  });

  const handleSubmit = () => {
    setErrorMsg('');
    
    // Validações básicas
    if (!name || !email || !phone) {
      setErrorMsg('Nome, E-mail e Telefone são campos obrigatórios.');
      return;
    }
    
    if (phone.replace(/\D/g, '').length < 10) {
      setErrorMsg('Por favor, informe um número de telefone celular válido.');
      return;
    }

    createLeadMutation.mutate({
      name,
      email,
      phone,
      message,
      category_id: selectedCategoryId || undefined,
    });
  };

  if (submitted) {
    return (
      <ThemedView style={styles.container}>
        <SafeAreaView style={styles.safeArea}>
          <View style={styles.successContainer}>
            <CheckCircle2 size={80} color="#10B981" />
            <ThemedText type="title" style={styles.successTitle}>Solicitação Enviada!</ThemedText>
            <ThemedText style={styles.successSubtitle} themeColor="textSecondary">
              Seu pedido de orçamento foi encaminhado com sucesso para a {company?.name}. A empresa entrará em contato em breve via WhatsApp ou E-mail.
            </ThemedText>
            
            <TouchableOpacity
              style={[styles.successBtn, { backgroundColor: '#208AEF' }]}
              onPress={() => router.replace('/requests')}
            >
              <ThemedText style={styles.successBtnText}>Acompanhar Solicitações</ThemedText>
            </TouchableOpacity>
          </View>
        </SafeAreaView>
      </ThemedView>
    );
  }

  return (
    <ThemedView style={styles.container}>
      <SafeAreaView style={styles.safeArea}>
        
        {/* Header com Voltar */}
        <View style={styles.header}>
          <TouchableOpacity style={styles.backBtn} onPress={() => router.back()}>
            <ArrowLeft color={colors.text} size={22} />
          </TouchableOpacity>
          <View>
            <ThemedText type="subtitle">Pedir Orçamento</ThemedText>
            {isLoadingCompany ? (
              <ActivityIndicator size="small" color="#208AEF" />
            ) : (
              <ThemedText style={styles.headerSubtitle} themeColor="textSecondary">
                Destinatário: {company?.name}
              </ThemedText>
            )}
          </View>
        </View>

        <ScrollView contentContainerStyle={styles.scrollContent} keyboardShouldPersistTaps="handled">
          
          {errorMsg ? (
            <View style={styles.errorBox}>
              <ThemedText style={styles.errorText}>{errorMsg}</ThemedText>
            </View>
          ) : null}

          <View style={styles.formContainer}>
            {/* Campo Nome */}
            <ThemedText style={styles.fieldLabel}>Seu Nome Completo *</ThemedText>
            <View style={[styles.inputWrapper, { backgroundColor: colors.backgroundElement }]}>
              <User size={18} color="#8E8E93" />
              <TextInput
                placeholder="Insira seu nome..."
                placeholderTextColor="#8E8E93"
                style={[styles.inputField, { color: colors.text }]}
                value={name}
                onChangeText={setName}
              />
            </View>

            {/* Campo E-mail */}
            <ThemedText style={styles.fieldLabel}>Seu E-mail *</ThemedText>
            <View style={[styles.inputWrapper, { backgroundColor: colors.backgroundElement }]}>
              <Mail size={18} color="#8E8E93" />
              <TextInput
                placeholder="nome@exemplo.com"
                placeholderTextColor="#8E8E93"
                keyboardType="email-address"
                autoCapitalize="none"
                style={[styles.inputField, { color: colors.text }]}
                value={email}
                onChangeText={setEmail}
              />
            </View>

            {/* Campo Telefone / WhatsApp */}
            <ThemedText style={styles.fieldLabel}>Telefone Celular (WhatsApp) *</ThemedText>
            <View style={[styles.inputWrapper, { backgroundColor: colors.backgroundElement }]}>
              <Phone size={18} color="#8E8E93" />
              <TextInput
                placeholder="(DDD) 99999-9999"
                placeholderTextColor="#8E8E93"
                keyboardType="phone-pad"
                style={[styles.inputField, { color: colors.text }]}
                value={phone}
                onChangeText={setPhone}
              />
            </View>

            {/* Seletor de Categoria se aplicável */}
            {company?.categories && company.categories.length > 1 && (
              <View>
                <ThemedText style={styles.fieldLabel}>Serviço Solicitado</ThemedText>
                <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.categoryScroll}>
                  {company.categories.map((cat) => (
                    <TouchableOpacity
                      key={cat.id}
                      style={[
                        styles.categoryBadge,
                        { backgroundColor: colors.backgroundElement },
                        selectedCategoryId === cat.id && { backgroundColor: 'rgba(32, 138, 239, 0.15)', borderColor: '#208AEF' }
                      ]}
                      onPress={() => setSelectedCategoryId(cat.id)}
                    >
                      <ThemedText style={[styles.categoryBadgeText, selectedCategoryId === cat.id && { color: '#208AEF', fontWeight: 'bold' }]}>
                        {cat.name}
                      </ThemedText>
                    </TouchableOpacity>
                  ))}
                </ScrollView>
              </View>
            )}

            {/* Mensagem / Descrição */}
            <ThemedText style={styles.fieldLabel}>Descrição do Projeto / Mensagem</ThemedText>
            <View style={[styles.textareaWrapper, { backgroundColor: colors.backgroundElement }]}>
              <MessageSquare size={18} color="#8E8E93" style={{ marginTop: Spacing.two }} />
              <TextInput
                placeholder="Descreva detalhes como tamanho do imóvel, valor médio da conta de luz ou suas necessidades..."
                placeholderTextColor="#8E8E93"
                multiline
                numberOfLines={5}
                style={[styles.textareaField, { color: colors.text }]}
                value={message}
                onChangeText={setMessage}
              />
            </View>

            {/* Botão de Enviar */}
            <TouchableOpacity
              style={[styles.submitButton, { backgroundColor: '#208AEF' }]}
              onPress={handleSubmit}
              disabled={createLeadMutation.isPending}
            >
              {createLeadMutation.isPending ? (
                <ActivityIndicator color="#ffffff" />
              ) : (
                <>
                  <Send size={18} color="#ffffff" />
                  <ThemedText style={styles.submitButtonText}>Enviar Solicitação</ThemedText>
                </>
              )}
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
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: Spacing.four,
    paddingVertical: Spacing.three,
    gap: Spacing.three,
  },
  backBtn: {
    padding: Spacing.one,
  },
  headerSubtitle: {
    fontSize: 12,
  },
  scrollContent: {
    paddingHorizontal: Spacing.four,
    paddingBottom: Spacing.six,
  },
  errorBox: {
    backgroundColor: 'rgba(229, 62, 62, 0.1)',
    padding: Spacing.three,
    borderRadius: Spacing.two,
    borderWidth: 1,
    borderColor: 'rgba(229, 62, 62, 0.2)',
    marginBottom: Spacing.three,
  },
  errorText: {
    color: '#E53E3E',
    fontSize: 13,
    fontWeight: '500',
  },
  formContainer: {
    gap: Spacing.two,
  },
  fieldLabel: {
    fontSize: 13,
    fontWeight: 'bold',
    color: '#8E8E93',
    marginTop: Spacing.two,
  },
  inputWrapper: {
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
  textareaWrapper: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    borderRadius: Spacing.three,
    paddingHorizontal: Spacing.three,
    gap: Spacing.two,
    height: 120,
  },
  textareaField: {
    flex: 1,
    fontSize: 14,
    height: '100%',
    textAlignVertical: 'top',
    paddingTop: Spacing.two,
    paddingBottom: Spacing.two,
  },
  categoryScroll: {
    gap: Spacing.two,
    paddingVertical: Spacing.one,
  },
  categoryBadge: {
    paddingHorizontal: Spacing.three,
    paddingVertical: Spacing.two,
    borderRadius: 15,
    borderWidth: 1,
    borderColor: 'transparent',
  },
  categoryBadgeText: {
    fontSize: 12,
  },
  submitButton: {
    height: 50,
    borderRadius: Spacing.three,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: Spacing.two,
    marginTop: Spacing.four,
  },
  submitButtonText: {
    color: '#ffffff',
    fontSize: 16,
    fontWeight: 'bold',
  },
  successContainer: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: Spacing.five,
    textAlign: 'center',
  },
  successTitle: {
    fontSize: 22,
    fontWeight: 'bold',
    marginTop: Spacing.four,
    marginBottom: Spacing.two,
  },
  successSubtitle: {
    fontSize: 14,
    textAlign: 'center',
    lineHeight: 20,
    marginBottom: Spacing.five,
  },
  successBtn: {
    height: 48,
    paddingHorizontal: Spacing.five,
    borderRadius: 24,
    alignItems: 'center',
    justifyContent: 'center',
  },
  successBtnText: {
    color: '#ffffff',
    fontSize: 14,
    fontWeight: 'bold',
  },
});

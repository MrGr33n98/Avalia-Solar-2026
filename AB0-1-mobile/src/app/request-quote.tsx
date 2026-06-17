import React, { useState } from 'react';
import { View, StyleSheet, TouchableOpacity, TextInput, ScrollView, useColorScheme, ActivityIndicator, Alert } from 'react-native';
import { Stack, useRouter } from 'expo-router';
import { SafeAreaView } from 'react-native-safe-area-context';
import { ArrowLeft, Zap, MapPin, CheckCircle, Send, ShieldCheck, Mail, User, Phone, Check } from 'lucide-react-native';

import { ThemedText } from '@/components/themed-text';
import { ThemedView } from '@/components/themed-view';
import { Colors, Spacing } from '@/constants/theme';
import { fetchApi } from '@/lib/api';

export default function RequestQuoteScreen() {
  const router = useRouter();
  const scheme = useColorScheme();
  const colors = Colors[scheme === 'unspecified' || !scheme ? 'light' : scheme];

  const [step, setStep] = useState(1);
  const [loading, setLoading] = useState(false);
  const [leadId, setLeadId] = useState<number | null>(null);
  const [distributedCompanies, setDistributedCompanies] = useState<any[]>([]);

  // Campos do Formulário
  const [billValue, setBillValue] = useState('');
  const [monthlyKwh, setMonthlyKwh] = useState('');
  const [projectProfile, setProjectProfile] = useState('Residencial');
  const [city, setCity] = useState('');
  const [state, setState] = useState('');
  const [name, setName] = useState('');
  const [phone, setPhone] = useState('');
  const [email, setEmail] = useState('');
  const [decisionTimeline, setDecisionTimeline] = useState('Imediata');
  const [consent, setConsent] = useState(false);

  // OTP
  const [otpCode, setOtpCode] = useState('');

  const handleNext = async () => {
    if (step === 1) {
      if (!billValue) {
        Alert.alert('Atenção', 'Por favor, insira o valor médio da sua conta de luz.');
        return;
      }
      setStep(2);
    } else if (step === 2) {
      if (!city || !state) {
        Alert.alert('Atenção', 'Por favor, preencha a cidade e o estado para a instalação.');
        return;
      }
      setStep(3);
    } else if (step === 3) {
      if (!name || !phone || !email) {
        Alert.alert('Atenção', 'Por favor, preencha todos os dados de contato.');
        return;
      }
      if (!consent) {
        Alert.alert('Consentimento LGPD', 'É necessário aceitar os termos de consentimento para enviar o orçamento.');
        return;
      }
      await handleCreateLead();
    } else if (step === 4) {
      if (!otpCode || otpCode.length < 4) {
        Alert.alert('Código Inválido', 'Por favor, insira o código de verificação recebido.');
        return;
      }
      await handleVerifyOtp();
    }
  };

  // 1. Criação do Lead Provisório (Gera OTP)
  const handleCreateLead = async () => {
    setLoading(true);
    try {
      const payload = {
        lead: {
          name,
          email,
          phone,
          city,
          state: state.toUpperCase(),
          bill_value: billValue.replace(/[^0-9.,]/g, ''),
          monthly_kwh: monthlyKwh ? parseInt(monthlyKwh) : undefined,
          project_profile: projectProfile,
          decision_timeline: decisionTimeline,
          consent: consent ? 'true' : 'false',
        },
      };

      const res = await fetchApi<{ lead_id: number }>('leads/wizard_create', {
        method: 'POST',
        body: JSON.stringify(payload),
      });

      if (res && res.lead_id) {
        setLeadId(res.lead_id);
        setStep(4); // Avança para a tela de digitação do OTP
      } else {
        throw new Error('Não foi possível registrar o orçamento preliminar.');
      }
    } catch (err: any) {
      console.error('[RequestQuote] Erro ao criar lead wizard:', err);
      Alert.alert('Erro ao Enviar', err?.message || 'Ocorreu um erro ao processar seus dados. Verifique a conexão.');
    } finally {
      setLoading(false);
    }
  };

  // 2. Verificação do OTP e Distribuição Real de Leads
  const handleVerifyOtp = async () => {
    if (!leadId) return;
    setLoading(true);
    try {
      const res = await fetchApi<{ lead_id: number; companies: any[] }>(`leads/${leadId}/verify_otp`, {
        method: 'POST',
        body: JSON.stringify({ otp_code: otpCode }),
      });

      if (res && res.companies) {
        setDistributedCompanies(res.companies);
        setStep(5); // Sucesso final
      } else {
        throw new Error('Código de verificação incorreto ou expirado.');
      }
    } catch (err: any) {
      console.error('[RequestQuote] Erro ao verificar OTP:', err);
      Alert.alert('Verificação Falhou', err?.message || 'Código de verificação incorreto. Tente novamente.');
    } finally {
      setLoading(false);
    }
  };

  const renderStepIndicators = () => (
    <View style={styles.indicatorContainer}>
      {[1, 2, 3, 4].map((s) => (
        <View key={s} style={{ flexDirection: 'row', alignItems: 'center' }}>
          <View style={[
            styles.indicatorDot,
            { backgroundColor: s <= step ? colors.brandDarkBlue : colors.backgroundElement }
          ]}>
            <ThemedText style={{ color: s <= step ? '#fff' : '#8E8E93', fontSize: 10, fontWeight: 'bold' }}>
              {s}
            </ThemedText>
          </View>
          {s < 4 && (
            <View style={[
              styles.indicatorLine,
              { backgroundColor: s < step ? colors.brandDarkBlue : colors.backgroundElement }
            ]} />
          )}
        </View>
      ))}
    </View>
  );

  return (
    <SafeAreaView style={[styles.container, { backgroundColor: colors.background }]} edges={['top', 'bottom']}>
      <Stack.Screen options={{ headerShown: false }} />
      
      <View style={[styles.header, { borderBottomColor: colors.backgroundElement }]}>
        <TouchableOpacity onPress={() => router.back()} style={styles.backButton}>
          <ArrowLeft size={24} color={colors.text} />
        </TouchableOpacity>
        <ThemedText style={styles.headerTitle}>Leilão Reverso de Orçamento</ThemedText>
        <View style={{ width: 40 }} />
      </View>

      {step < 5 && renderStepIndicators()}

      <ScrollView contentContainerStyle={styles.content} keyboardShouldPersistTaps="handled">
        
        {/* Passo 1: Conta de Luz & Tipo de Instalação */}
        {step === 1 && (
          <View style={styles.stepContent}>
            <Zap size={48} color={colors.brandYellow} style={styles.icon} />
            <ThemedText type="title" style={styles.title}>Valores do Projeto</ThemedText>
            
            <ThemedText style={styles.fieldLabel}>Qual o valor médio da sua conta de luz?</ThemedText>
            <TextInput
              style={[styles.input, { backgroundColor: colors.backgroundElement, color: colors.text }]}
              placeholder="Ex: R$ 450,00"
              placeholderTextColor="#8E8E93"
              keyboardType="numeric"
              value={billValue}
              onChangeText={setBillValue}
            />

            <ThemedText style={[styles.fieldLabel, { marginTop: 20 }]}>Tipo de Projeto:</ThemedText>
            <View style={styles.chipsRow}>
              {['Residencial', 'Comercial', 'Industrial', 'Rural'].map((profile) => (
                <TouchableOpacity
                  key={profile}
                  style={[
                    styles.chipBtn,
                    projectProfile === profile && { backgroundColor: '#003E7E', borderColor: '#003E7E' },
                  ]}
                  onPress={() => setProjectProfile(profile)}
                >
                  <ThemedText style={[styles.chipText, projectProfile === profile && { color: '#FFFFFF', fontWeight: 'bold' }]}>
                    {profile}
                  </ThemedText>
                </TouchableOpacity>
              ))}
            </View>
          </View>
        )}

        {/* Passo 2: Localização e Consumo estimado */}
        {step === 2 && (
          <View style={styles.stepContent}>
            <MapPin size={48} color="#10B981" style={styles.icon} />
            <ThemedText type="title" style={styles.title}>Onde será a instalação?</ThemedText>
            
            <ThemedText style={styles.fieldLabel}>Cidade / Estado:</ThemedText>
            <View style={styles.row}>
              <TextInput
                style={[styles.input, { flex: 2, backgroundColor: colors.backgroundElement, color: colors.text, marginRight: 8 }]}
                placeholder="Cidade"
                placeholderTextColor="#8E8E93"
                value={city}
                onChangeText={setCity}
              />
              <TextInput
                style={[styles.input, { flex: 1, backgroundColor: colors.backgroundElement, color: colors.text }]}
                placeholder="UF (ex: SP)"
                placeholderTextColor="#8E8E93"
                maxLength={2}
                autoCapitalize="characters"
                value={state}
                onChangeText={setState}
              />
            </View>

            <ThemedText style={[styles.fieldLabel, { marginTop: 20 }]}>Consumo médio aproximado (kWh/mês - Opcional):</ThemedText>
            <TextInput
              style={[styles.input, { backgroundColor: colors.backgroundElement, color: colors.text }]}
              placeholder="Ex: 350"
              placeholderTextColor="#8E8E93"
              keyboardType="numeric"
              value={monthlyKwh}
              onChangeText={setMonthlyKwh}
            />
          </View>
        )}

        {/* Passo 3: Dados de Contato e Consentimento LGPD */}
        {step === 3 && (
          <View style={styles.stepContent}>
            <User size={48} color={colors.brandDarkBlue} style={styles.icon} />
            <ThemedText type="title" style={styles.title}>Dados de Contato</ThemedText>

            <TextInput
              style={[styles.input, { backgroundColor: colors.backgroundElement, color: colors.text, marginBottom: 12 }]}
              placeholder="Nome Completo"
              placeholderTextColor="#8E8E93"
              value={name}
              onChangeText={setName}
            />
            
            <TextInput
              style={[styles.input, { backgroundColor: colors.backgroundElement, color: colors.text, marginBottom: 12 }]}
              placeholder="WhatsApp com DDD"
              placeholderTextColor="#8E8E93"
              keyboardType="phone-pad"
              value={phone}
              onChangeText={setPhone}
            />

            <TextInput
              style={[styles.input, { backgroundColor: colors.backgroundElement, color: colors.text, marginBottom: 16 }]}
              placeholder="E-mail"
              placeholderTextColor="#8E8E93"
              keyboardType="email-address"
              autoCapitalize="none"
              value={email}
              onChangeText={setEmail}
            />

            <ThemedText style={styles.fieldLabel}>Urgência da Instalação:</ThemedText>
            <View style={styles.chipsRow}>
              {['Imediata', 'Até 3 meses', 'Apenas pesquisando'].map((timeline) => (
                <TouchableOpacity
                  key={timeline}
                  style={[
                    styles.chipBtn,
                    decisionTimeline === timeline && { backgroundColor: '#003E7E', borderColor: '#003E7E' },
                  ]}
                  onPress={() => setDecisionTimeline(timeline)}
                >
                  <ThemedText style={[styles.chipText, decisionTimeline === timeline && { color: '#FFFFFF', fontWeight: 'bold' }]}>
                    {timeline}
                  </ThemedText>
                </TouchableOpacity>
              ))}
            </View>

            {/* Checkbox de Consentimento LGPD */}
            <TouchableOpacity style={styles.consentRow} onPress={() => setConsent(!consent)}>
              <View style={[styles.checkbox, consent && { backgroundColor: '#10B981', borderColor: '#10B981' }]}>
                {consent && <Check size={12} color="#FFFFFF" />}
              </View>
              <ThemedText style={styles.consentText} themeColor="textSecondary">
                Declaro consentimento para compartilhar estes dados com integradores qualificados da minha região conforme a LGPD.
              </ThemedText>
            </TouchableOpacity>
          </View>
        )}

        {/* Passo 4: Verificação do Código OTP */}
        {step === 4 && (
          <View style={styles.stepContent}>
            <Mail size={48} color="#8B5CF6" style={styles.icon} />
            <ThemedText type="title" style={styles.title}>Valide seu Orçamento</ThemedText>
            <ThemedText style={styles.subtitle} themeColor="textSecondary">
              Para validar o seu leilão e evitar spam, enviamos um código OTP de verificação para o seu e-mail:
              {'\n'}<ThemedText style={{ fontWeight: 'bold' }}>{email}</ThemedText>
            </ThemedText>

            <TextInput
              style={[styles.input, styles.otpInput, { backgroundColor: colors.backgroundElement, color: colors.text }]}
              placeholder="Digite o código de 4 dígitos"
              placeholderTextColor="#8E8E93"
              keyboardType="number-pad"
              maxLength={6}
              value={otpCode}
              onChangeText={setOtpCode}
            />
          </View>
        )}

        {/* Passo 5: Sucesso Final com integradores listados */}
        {step === 5 && (
          <View style={styles.successContent}>
            <View style={styles.successCircle}>
              <CheckCircle size={80} color="#10B981" />
            </View>
            <ThemedText type="title" style={[styles.title, { textAlign: 'center' }]}>
              Pedido Enviado com Sucesso! 🚀
            </ThemedText>
            <ThemedText style={[styles.subtitle, { textAlign: 'center' }]} themeColor="textSecondary">
              Seu pedido foi autenticado e transmitido para os instaladores de {city}-{state}.
            </ThemedText>

            <ThemedText style={styles.partnersTitle}>Integradores que receberam o seu lead:</ThemedText>
            <View style={styles.partnersList}>
              {distributedCompanies.length === 0 ? (
                <ThemedText style={styles.partnerText} themeColor="textSecondary">
                  Buscando integradores adequados para cotação...
                </ThemedText>
              ) : (
                distributedCompanies.map((company) => (
                  <View key={company.id} style={styles.partnerRow}>
                    <ShieldCheck size={16} color="#10B981" style={{ marginRight: 8 }} />
                    <ThemedText style={styles.partnerName}>{company.name}</ThemedText>
                    <ThemedText style={styles.partnerLocation} themeColor="textSecondary">
                      ({company.city})
                    </ThemedText>
                  </View>
                ))
              )}
            </View>

            <TouchableOpacity 
              style={[styles.primaryButton, { backgroundColor: colors.brandDarkBlue, marginTop: 40, width: '100%' }]}
              onPress={() => router.replace('/explore')}
            >
              <ThemedText style={styles.primaryButtonText}>Voltar para o Radar</ThemedText>
            </TouchableOpacity>
          </View>
        )}
      </ScrollView>

      {step < 5 && (
        <View style={[styles.footer, { borderTopColor: colors.backgroundElement }]}>
          <TouchableOpacity 
            style={[styles.primaryButton, { backgroundColor: colors.brandYellow }]}
            onPress={handleNext}
            disabled={loading}
          >
            {loading ? (
              <ActivityIndicator color="#003E7E" />
            ) : (
              <ThemedText style={[styles.primaryButtonText, { color: '#003E7E' }]}>
                {step === 3 ? 'Disparar Pedido' : step === 4 ? 'Confirmar Verificação' : 'Continuar'}
              </ThemedText>
            )}
          </TouchableOpacity>
        </View>
      )}
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: Spacing.four,
    paddingVertical: Spacing.three,
    borderBottomWidth: 1,
  },
  backButton: {
    width: 40,
    height: 40,
    justifyContent: 'center',
  },
  headerTitle: {
    fontSize: 16,
    fontWeight: 'bold',
  },
  indicatorContainer: {
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    paddingVertical: Spacing.four,
  },
  indicatorDot: {
    width: 24,
    height: 24,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
  },
  indicatorLine: {
    width: 30,
    height: 2,
    marginHorizontal: 8,
  },
  content: {
    flexGrow: 1,
    padding: Spacing.five,
  },
  stepContent: {
    alignItems: 'stretch',
    marginTop: Spacing.four,
  },
  fieldLabel: {
    fontSize: 13,
    fontWeight: '700',
    color: '#8E8E93',
    marginBottom: Spacing.two,
  },
  chipsRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
    marginBottom: Spacing.three,
  },
  chipBtn: {
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#E2E8F0',
  },
  chipText: {
    fontSize: 12,
    color: '#475569',
  },
  consentRow: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    marginTop: 20,
    gap: 10,
    paddingHorizontal: 4,
  },
  checkbox: {
    width: 20,
    height: 20,
    borderRadius: 4,
    borderWidth: 2,
    borderColor: '#C0C0C0',
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: 2,
  },
  consentText: {
    flex: 1,
    fontSize: 11,
    lineHeight: 16,
  },
  icon: {
    alignSelf: 'center',
    marginBottom: Spacing.four,
  },
  title: {
    textAlign: 'center',
    marginBottom: Spacing.four,
  },
  subtitle: {
    textAlign: 'center',
    marginBottom: Spacing.six,
    lineHeight: 20,
    paddingHorizontal: Spacing.three,
  },
  input: {
    width: '100%',
    height: 50,
    borderRadius: Spacing.two,
    paddingHorizontal: Spacing.four,
    fontSize: 14,
  },
  otpInput: {
    fontSize: 16,
    textAlign: 'center',
    letterSpacing: 2,
    fontWeight: 'bold',
  },
  row: {
    flexDirection: 'row',
    width: '100%',
  },
  footer: {
    padding: Spacing.four,
    borderTopWidth: 1,
  },
  primaryButton: {
    height: 50,
    borderRadius: Spacing.three,
    alignItems: 'center',
    justifyContent: 'center',
  },
  primaryButtonText: {
    fontSize: 15,
    fontWeight: 'bold',
  },
  successContent: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: Spacing.six,
  },
  successCircle: {
    width: 100,
    height: 100,
    borderRadius: 50,
    backgroundColor: 'rgba(16, 185, 129, 0.1)',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: Spacing.six,
  },
  partnersTitle: {
    fontSize: 14,
    fontWeight: '700',
    color: '#475569',
    marginTop: 24,
    marginBottom: 12,
    alignSelf: 'flex-start',
  },
  partnersList: {
    width: '100%',
    backgroundColor: '#F8FAFC',
    borderRadius: 12,
    padding: 12,
    gap: 8,
  },
  partnerRow: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  partnerName: {
    fontSize: 13,
    fontWeight: '700',
    color: '#1E293B',
  },
  partnerLocation: {
    fontSize: 11,
    marginLeft: 6,
  },
  partnerText: {
    fontSize: 12,
    fontStyle: 'italic',
  },
});

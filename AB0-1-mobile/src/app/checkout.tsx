import React, { useState } from 'react';
import { Colors } from '@/constants/theme';
import { StyleSheet, ScrollView, View, TouchableOpacity, ActivityIndicator } , useColorScheme } from 'react-native';
import { useRouter, useLocalSearchParams } from 'expo-router';
import { ArrowLeft, ShieldCheck, CreditCard, Lock, CheckCircle2 } from 'lucide-react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { ThemedText } from '@/components/themed-text';
import { ThemedView } from '@/components/themed-view';
import { Colors, Spacing } from '@/constants/theme';

export default function CheckoutScreen() {
  const scheme = useColorScheme();
  const colors = Colors[scheme === 'unspecified' || !scheme ? 'light' : scheme];

  const router = useRouter();
  const params = useLocalSearchParams();
  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState(false);

  const companyName = params.companyName || 'Empresa Parceira';
  const priceEstimate = params.priceEstimate || 'R$ 15.000,00';
  const amountToPay = 15000; // Mock

  const handlePayment = async () => {
    setLoading(true);
    try {
      // Chamada para o nosso backend real (PaymentIntent)
      const baseUrl = process.env.EXPO_PUBLIC_API_BASE_URL || 'http://192.168.11.171:3001/api/v1';
      const response = await fetch(`${baseUrl}/payments/create_intent`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          amount: amountToPay,
          company_id: 1
        })
      });

      const data = await response.json();
      if (data.success) {
        setTimeout(() => {
          setLoading(false);
          setSuccess(true);
        }, 1500);
      } else {
        alert('Erro ao processar pagamento');
        setLoading(false);
      }
    } catch (e) {
      console.error(e);
      alert('Erro de conexão com o banco');
      setLoading(false);
    }
  };

  if (success) {
    return (
      <SafeAreaView style={styles.successContainer}>
        <View style={styles.successCard}>
          <View style={styles.successIconWrapper}>
            <CheckCircle2 color={colors.success} size={64} strokeWidth={2.5} />
          </View>
          <ThemedText style={styles.successTitle}>Pagamento Retido com Sucesso!</ThemedText>
          <ThemedText style={styles.successDescription}>
            O valor de {priceEstimate} foi cobrado do seu cartão, mas a {companyName} só receberá 50% agora. O restante ficará protegido pelo Avalia Solar Pay até você confirmar a instalação!
          </ThemedText>
          <TouchableOpacity 
            style={styles.primaryButton}
            onPress={() => router.replace('/explore')}
          >
            <ThemedText style={styles.buttonText}>Voltar para o Radar</ThemedText>
          </TouchableOpacity>
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.safeArea}>
      <View style={styles.header}>
        <TouchableOpacity style={styles.backButton} onPress={() => router.back()}>
          <ArrowLeft color={colors.backgroundElement} size={24} />
        </TouchableOpacity>
        <ThemedText style={styles.headerTitle}>Pagamento Seguro</ThemedText>
        <View style={{ width: 40 }} />
      </View>

      <ScrollView style={styles.container} contentContainerStyle={styles.scrollContent}>
        {/* Banner do Avalia Solar Pay */}
        <View style={styles.escrowBanner}>
          <ShieldCheck color={colors.backgroundElement} size={28} />
          <View style={styles.escrowTextContent}>
            <ThemedText style={styles.escrowTitle}>Avalia Solar Pay (Escrow)</ThemedText>
            <ThemedText style={styles.escrowSubtitle}>Seu dinheiro está protegido. A liberação ocorre por etapas concluídas.</ThemedText>
          </View>
        </View>

        {/* Resumo */}
        <View style={styles.summaryCard}>
          <ThemedText style={styles.summaryTitle}>Resumo da Contratação</ThemedText>
          <View style={styles.summaryRow}>
            <ThemedText style={styles.summaryLabel}>Integrador</ThemedText>
            <ThemedText style={styles.summaryValue}>{companyName}</ThemedText>
          </View>
          <View style={styles.summaryRow}>
            <ThemedText style={styles.summaryLabel}>Sistema</ThemedText>
            <ThemedText style={styles.summaryValue}>Kit Solar 4.5kWp</ThemedText>
          </View>
          <View style={[styles.summaryRow, styles.summaryTotalRow]}>
            <ThemedText style={styles.summaryTotalLabel}>Total a Pagar</ThemedText>
            <ThemedText style={styles.summaryTotalValue}>{priceEstimate}</ThemedText>
          </View>
        </View>

        {/* Milestones Preview */}
        <View style={styles.milestonesCard}>
          <ThemedText style={styles.milestonesTitle}>Como seu dinheiro será liberado:</ThemedText>
          
          <View style={styles.milestoneItem}>
            <View style={styles.milestoneDotActive} />
            <View style={styles.milestoneContent}>
              <ThemedText style={styles.milestoneName}>Imediato (Equipamentos)</ThemedText>
              <ThemedText style={styles.milestoneDesc}>50% do valor para compra do kit.</ThemedText>
            </View>
          </View>
          
          <View style={styles.milestoneLine} />

          <View style={styles.milestoneItem}>
            <View style={styles.milestoneDotLocked} />
            <View style={styles.milestoneContent}>
              <ThemedText style={styles.milestoneNameLocked}>Após Instalação (Protegido)</ThemedText>
              <ThemedText style={styles.milestoneDesc}>50% só liberado quando VOCÊ aprovar o serviço.</ThemedText>
            </View>
            <Lock color={colors.textSecondary} size={16} />
          </View>
        </View>

        {/* Fake Card Input */}
        <ThemedText style={styles.inputLabel}>Dados do Cartão (Stripe)</ThemedText>
        <View style={styles.cardInputFake}>
          <CreditCard color={colors.textSecondary} size={20} style={{ marginRight: 10 }} />
          <ThemedText style={styles.cardFakeText}>**** **** **** 4242</ThemedText>
        </View>

      </ScrollView>

      {/* Botão Flutuante */}
      <View style={styles.footer}>
        <TouchableOpacity 
          style={styles.payButton}
          onPress={handlePayment}
          disabled={loading}
        >
          {loading ? (
            <ActivityIndicator color={colors.backgroundElement} />
          ) : (
            <ThemedText style={styles.payButtonText}>Pagar {priceEstimate}</ThemedText>
          )}
        </TouchableOpacity>
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: { flex: 1, backgroundColor: colors.background },
  header: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingHorizontal: 16, paddingVertical: 12, backgroundColor: colors.backgroundElement, borderBottomWidth: 1, borderBottomColor: colors.border },
  backButton: { width: 40, height: 40, borderRadius: 20, backgroundColor: colors.surfaceSubtle, justifyContent: 'center', alignItems: 'center' },
  headerTitle: { fontSize: 18, fontWeight: '700', color: colors.backgroundElement },
  container: { flex: 1 },
  scrollContent: { padding: 16, paddingBottom: 100 },
  escrowBanner: { flexDirection: 'row', backgroundColor: colors.brandDarkBlue, padding: 16, borderRadius: 16, alignItems: 'center', marginBottom: 20 },
  escrowTextContent: { flex: 1, marginLeft: 16 },
  escrowTitle: { color: colors.backgroundElement, fontSize: 16, fontWeight: '700', marginBottom: 4 },
  escrowSubtitle: { color: colors.border, fontSize: 13, lineHeight: 18 },
  summaryCard: { backgroundColor: colors.backgroundElement, padding: 16, borderRadius: 16, marginBottom: 20, borderWidth: 1, borderColor: colors.border },
  summaryTitle: { fontSize: 16, fontWeight: '700', color: colors.backgroundElement, marginBottom: 16 },
  summaryRow: { flexDirection: 'row', justifyContent: 'space-between', marginBottom: 12 },
  summaryLabel: { color: colors.textSecondary, fontSize: 14 },
  summaryValue: { color: colors.backgroundElement, fontSize: 14, fontWeight: '500' },
  summaryTotalRow: { borderTopWidth: 1, borderTopColor: colors.border, paddingTop: 12, marginTop: 4, marginBottom: 0 },
  summaryTotalLabel: { color: colors.backgroundElement, fontSize: 16, fontWeight: '600' },
  summaryTotalValue: { color: colors.success, fontSize: 18, fontWeight: '700' },
  milestonesCard: { backgroundColor: colors.backgroundElement, padding: 16, borderRadius: 16, marginBottom: 20, borderWidth: 1, borderColor: colors.border },
  milestonesTitle: { fontSize: 14, fontWeight: '600', color: colors.backgroundElement, marginBottom: 16 },
  milestoneItem: { flexDirection: 'row', alignItems: 'center' },
  milestoneDotActive: { width: 12, height: 12, borderRadius: 6, backgroundColor: colors.success, marginRight: 12 },
  milestoneDotLocked: { width: 12, height: 12, borderRadius: 6, backgroundColor: colors.border, marginRight: 12 },
  milestoneLine: { width: 2, height: 20, backgroundColor: colors.border, marginLeft: 5, marginVertical: 4 },
  milestoneContent: { flex: 1 },
  milestoneName: { fontSize: 14, fontWeight: '600', color: colors.backgroundElement },
  milestoneNameLocked: { fontSize: 14, fontWeight: '600', color: colors.textSecondary },
  milestoneDesc: { fontSize: 12, color: colors.textSecondary, marginTop: 2 },
  inputLabel: { fontSize: 14, fontWeight: '600', color: colors.backgroundElement, marginBottom: 8, marginLeft: 4 },
  cardInputFake: { flexDirection: 'row', alignItems: 'center', backgroundColor: colors.backgroundElement, padding: 16, borderRadius: 12, borderWidth: 1, borderColor: colors.border },
  cardFakeText: { color: colors.backgroundElement, fontSize: 16, letterSpacing: 2 },
  footer: { position: 'absolute', bottom: 0, left: 0, right: 0, backgroundColor: colors.backgroundElement, padding: 16, borderTopWidth: 1, borderTopColor: colors.border },
  payButton: { backgroundColor: colors.success, padding: 16, borderRadius: 12, alignItems: 'center' },
  payButtonText: { color: colors.backgroundElement, fontSize: 16, fontWeight: '700' },
  successContainer: { flex: 1, backgroundColor: colors.backgroundElement, justifyContent: 'center', padding: 20 },
  successCard: { alignItems: 'center' },
  successIconWrapper: { width: 100, height: 100, borderRadius: 50, backgroundColor: '#DCFCE7', justifyContent: 'center', alignItems: 'center', marginBottom: 24 },
  successTitle: { fontSize: 24, fontWeight: '700', color: colors.backgroundElement, marginBottom: 16, textAlign: 'center' },
  successDescription: { fontSize: 16, color: colors.textSecondary, textAlign: 'center', lineHeight: 24, marginBottom: 32 },
  primaryButton: { backgroundColor: colors.brandDarkBlue, paddingVertical: 16, paddingHorizontal: 32, borderRadius: 12, width: '100%', alignItems: 'center' },
  buttonText: { color: colors.backgroundElement, fontSize: 16, fontWeight: '700' }
});

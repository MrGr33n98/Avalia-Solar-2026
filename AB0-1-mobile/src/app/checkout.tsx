import React, { useState } from 'react';
import { StyleSheet, ScrollView, View, TouchableOpacity, ActivityIndicator } from 'react-native';
import { useRouter, useLocalSearchParams } from 'expo-router';
import { ArrowLeft, ShieldCheck, CreditCard, Lock, CheckCircle2 } from 'lucide-react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { ThemedText } from '@/components/themed-text';
import { ThemedView } from '@/components/themed-view';
import { Colors, Spacing } from '@/constants/theme';

export default function CheckoutScreen() {
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
            <CheckCircle2 color="#22C55E" size={64} strokeWidth={2.5} />
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
          <ArrowLeft color="#1E293B" size={24} />
        </TouchableOpacity>
        <ThemedText style={styles.headerTitle}>Pagamento Seguro</ThemedText>
        <View style={{ width: 40 }} />
      </View>

      <ScrollView style={styles.container} contentContainerStyle={styles.scrollContent}>
        {/* Banner do Avalia Solar Pay */}
        <View style={styles.escrowBanner}>
          <ShieldCheck color="#FFFFFF" size={28} />
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
            <Lock color="#94A3B8" size={16} />
          </View>
        </View>

        {/* Fake Card Input */}
        <ThemedText style={styles.inputLabel}>Dados do Cartão (Stripe)</ThemedText>
        <View style={styles.cardInputFake}>
          <CreditCard color="#64748B" size={20} style={{ marginRight: 10 }} />
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
            <ActivityIndicator color="#FFFFFF" />
          ) : (
            <ThemedText style={styles.payButtonText}>Pagar {priceEstimate}</ThemedText>
          )}
        </TouchableOpacity>
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: { flex: 1, backgroundColor: '#F8FAFC' },
  header: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingHorizontal: 16, paddingVertical: 12, backgroundColor: '#FFFFFF', borderBottomWidth: 1, borderBottomColor: '#E2E8F0' },
  backButton: { width: 40, height: 40, borderRadius: 20, backgroundColor: '#F1F5F9', justifyContent: 'center', alignItems: 'center' },
  headerTitle: { fontSize: 18, fontWeight: '700', color: '#1E293B' },
  container: { flex: 1 },
  scrollContent: { padding: 16, paddingBottom: 100 },
  escrowBanner: { flexDirection: 'row', backgroundColor: '#003E7E', padding: 16, borderRadius: 16, alignItems: 'center', marginBottom: 20 },
  escrowTextContent: { flex: 1, marginLeft: 16 },
  escrowTitle: { color: '#FFFFFF', fontSize: 16, fontWeight: '700', marginBottom: 4 },
  escrowSubtitle: { color: '#E2E8F0', fontSize: 13, lineHeight: 18 },
  summaryCard: { backgroundColor: '#FFFFFF', padding: 16, borderRadius: 16, marginBottom: 20, borderWidth: 1, borderColor: '#E2E8F0' },
  summaryTitle: { fontSize: 16, fontWeight: '700', color: '#1E293B', marginBottom: 16 },
  summaryRow: { flexDirection: 'row', justifyContent: 'space-between', marginBottom: 12 },
  summaryLabel: { color: '#64748B', fontSize: 14 },
  summaryValue: { color: '#1E293B', fontSize: 14, fontWeight: '500' },
  summaryTotalRow: { borderTopWidth: 1, borderTopColor: '#E2E8F0', paddingTop: 12, marginTop: 4, marginBottom: 0 },
  summaryTotalLabel: { color: '#1E293B', fontSize: 16, fontWeight: '600' },
  summaryTotalValue: { color: '#22C55E', fontSize: 18, fontWeight: '700' },
  milestonesCard: { backgroundColor: '#FFFFFF', padding: 16, borderRadius: 16, marginBottom: 20, borderWidth: 1, borderColor: '#E2E8F0' },
  milestonesTitle: { fontSize: 14, fontWeight: '600', color: '#1E293B', marginBottom: 16 },
  milestoneItem: { flexDirection: 'row', alignItems: 'center' },
  milestoneDotActive: { width: 12, height: 12, borderRadius: 6, backgroundColor: '#22C55E', marginRight: 12 },
  milestoneDotLocked: { width: 12, height: 12, borderRadius: 6, backgroundColor: '#CBD5E1', marginRight: 12 },
  milestoneLine: { width: 2, height: 20, backgroundColor: '#E2E8F0', marginLeft: 5, marginVertical: 4 },
  milestoneContent: { flex: 1 },
  milestoneName: { fontSize: 14, fontWeight: '600', color: '#1E293B' },
  milestoneNameLocked: { fontSize: 14, fontWeight: '600', color: '#64748B' },
  milestoneDesc: { fontSize: 12, color: '#64748B', marginTop: 2 },
  inputLabel: { fontSize: 14, fontWeight: '600', color: '#1E293B', marginBottom: 8, marginLeft: 4 },
  cardInputFake: { flexDirection: 'row', alignItems: 'center', backgroundColor: '#FFFFFF', padding: 16, borderRadius: 12, borderWidth: 1, borderColor: '#E2E8F0' },
  cardFakeText: { color: '#1E293B', fontSize: 16, letterSpacing: 2 },
  footer: { position: 'absolute', bottom: 0, left: 0, right: 0, backgroundColor: '#FFFFFF', padding: 16, borderTopWidth: 1, borderTopColor: '#E2E8F0' },
  payButton: { backgroundColor: '#22C55E', padding: 16, borderRadius: 12, alignItems: 'center' },
  payButtonText: { color: '#FFFFFF', fontSize: 16, fontWeight: '700' },
  successContainer: { flex: 1, backgroundColor: '#FFFFFF', justifyContent: 'center', padding: 20 },
  successCard: { alignItems: 'center' },
  successIconWrapper: { width: 100, height: 100, borderRadius: 50, backgroundColor: '#DCFCE7', justifyContent: 'center', alignItems: 'center', marginBottom: 24 },
  successTitle: { fontSize: 24, fontWeight: '700', color: '#1E293B', marginBottom: 16, textAlign: 'center' },
  successDescription: { fontSize: 16, color: '#64748B', textAlign: 'center', lineHeight: 24, marginBottom: 32 },
  primaryButton: { backgroundColor: '#003E7E', paddingVertical: 16, paddingHorizontal: 32, borderRadius: 12, width: '100%', alignItems: 'center' },
  buttonText: { color: '#FFFFFF', fontSize: 16, fontWeight: '700' }
});

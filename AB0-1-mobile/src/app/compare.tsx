import React from 'react';
import { StyleSheet, ScrollView, View, TouchableOpacity, Dimensions } from 'react-native';
import { useRouter } from 'expo-router';
import { ArrowLeft, Trash2, CheckCircle2, ShieldCheck, Zap, Clock } from 'lucide-react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Image } from 'expo-image';

import { ThemedText } from '@/components/themed-text';
import { ThemedView } from '@/components/themed-view';
import { Colors, Spacing } from '@/constants/theme';
import { useCompareStore, CompareCompany } from '@/store/compare';
import { useColorScheme } from 'react-native';

const { width } = Dimensions.get('window');
// Calculate card width allowing for slight peek of next card if 3 cards
const CARD_WIDTH = width * 0.75; 

export default function CompareScreen() {
  const router = useRouter();
  const scheme = useColorScheme();
  const colors = Colors[scheme === 'unspecified' || !scheme ? 'light' : scheme];
  
  const { selectedCompanies, removeCompany, clearCompare } = useCompareStore();

  const handleClear = () => {
    clearCompare();
    router.back();
  };

  const renderEmpty = () => (
    <View style={styles.emptyContainer}>
      <ThemedText style={styles.emptyTitle}>Nenhuma empresa selecionada</ThemedText>
      <ThemedText style={styles.emptySubtitle} themeColor="textSecondary">
        Volte ao radar e selecione empresas para comparar suas propostas lado a lado.
      </ThemedText>
      <TouchableOpacity 
        style={[styles.backButton, { backgroundColor: colors.brandActiveBlue }]}
        onPress={() => router.back()}
      >
        <ThemedText style={styles.backButtonText}>Voltar ao Radar</ThemedText>
      </TouchableOpacity>
    </View>
  );

  return (
    <ThemedView style={styles.container}>
      <SafeAreaView edges={['top']} style={{ flex: 1 }}>
        {/* Header */}
        <View style={[styles.header, { borderBottomColor: colors.border }]}>
          <TouchableOpacity onPress={() => router.back()} style={styles.headerButton}>
            <ArrowLeft size={24} color={colors.text} />
          </TouchableOpacity>
          <ThemedText style={styles.headerTitle}>Comparador Raio-X</ThemedText>
          <TouchableOpacity onPress={handleClear} style={styles.headerButton}>
            <ThemedText style={{ color: colors.danger, fontWeight: '600' }}>Limpar</ThemedText>
          </TouchableOpacity>
        </View>

        {selectedCompanies.length === 0 ? (
          renderEmpty()
        ) : (
          <ScrollView style={styles.content} showsVerticalScrollIndicator={false}>
            <View style={styles.disclaimerBox}>
              <ShieldCheck size={20} color="#10B981" />
              <ThemedText style={styles.disclaimerText}>
                As propostas abaixo são estimativas baseadas na média de mercado da empresa. Solicite um orçamento final no Chat.
              </ThemedText>
            </View>

            <ScrollView 
              horizontal 
              showsHorizontalScrollIndicator={false}
              contentContainerStyle={styles.scrollContent}
              snapToInterval={CARD_WIDTH + Spacing.three}
              decelerationRate="fast"
            >
              {selectedCompanies.map((company) => (
                <View key={company.id} style={[styles.compareCard, { width: CARD_WIDTH, borderColor: colors.border }]}>
                  {/* Company Header */}
                  <View style={styles.cardHeader}>
                    {company.logoUrl ? (
                      <Image source={{ uri: company.logoUrl }} style={styles.companyLogo} />
                    ) : (
                      <View style={[styles.companyLogoFallback, { backgroundColor: colors.surfaceSubtle }]}>
                        <ThemedText style={styles.companyLogoText}>{company.name.charAt(0)}</ThemedText>
                      </View>
                    )}
                    <TouchableOpacity onPress={() => removeCompany(company.id)} style={styles.removeBtn}>
                      <Trash2 size={18} color={colors.textSecondary} />
                    </TouchableOpacity>
                  </View>
                  
                  <ThemedText style={styles.companyName} numberOfLines={2}>{company.name}</ThemedText>
                  
                  {company.isVerified && (
                    <View style={styles.verifiedBadge}>
                      <CheckCircle2 size={12} color="#10B981" />
                      <ThemedText style={styles.verifiedText}>Verificada</ThemedText>
                    </View>
                  )}

                  {/* Rating */}
                  <View style={styles.ratingRow}>
                    <ThemedText style={styles.ratingStars}>⭐ {company.ratingAvg || 'Novo'}</ThemedText>
                    <ThemedText style={styles.ratingCount}>({company.reviewsCount || 0} avaliações)</ThemedText>
                  </View>

                  <View style={[styles.divider, { backgroundColor: colors.border }]} />

                  {/* Feature Rows */}
                  <View style={styles.featureRow}>
                    <ThemedText style={styles.featureLabel}>Preço Estimado</ThemedText>
                    <ThemedText style={styles.featureValueHighlight}>
                      {company.priceEstimate || 'Sob consulta'}
                    </ThemedText>
                  </View>

                  <View style={styles.featureRow}>
                    <View style={styles.featureLabelIcon}>
                      <Zap size={14} color="#8B5CF6" style={{ marginRight: 4 }} />
                      <ThemedText style={styles.featureLabel}>Potência</ThemedText>
                    </View>
                    <ThemedText style={styles.featureValue}>{company.powerKwp ? `${company.powerKwp} kWp` : '--'}</ThemedText>
                  </View>

                  <View style={styles.featureRow}>
                    <View style={styles.featureLabelIcon}>
                      <ShieldCheck size={14} color="#10B981" style={{ marginRight: 4 }} />
                      <ThemedText style={styles.featureLabel}>Garantia</ThemedText>
                    </View>
                    <ThemedText style={styles.featureValue}>{company.warrantyYears ? `${company.warrantyYears} anos` : 'A consultar'}</ThemedText>
                  </View>

                  <View style={styles.featureRow}>
                    <View style={styles.featureLabelIcon}>
                      <Clock size={14} color="#F59E0B" style={{ marginRight: 4 }} />
                      <ThemedText style={styles.featureLabel}>Instalação</ThemedText>
                    </View>
                    <ThemedText style={styles.featureValue}>{company.installTimeDays ? `~${company.installTimeDays} dias` : 'Variável'}</ThemedText>
                  </View>

                  {/* Actions */}
                  <View style={{ gap: Spacing.two, marginTop: Spacing.four }}>
                    <TouchableOpacity 
                      style={[styles.actionButton, { backgroundColor: colors.brandActiveBlue, marginTop: 0 }]}
                      onPress={() => router.push(`/company/${company.id}/lead`)}
                    >
                      <ThemedText style={styles.actionButtonText}>Falar com Empresa</ThemedText>
                    </TouchableOpacity>

                    <TouchableOpacity 
                      style={[styles.actionButton, { backgroundColor: '#22C55E', marginTop: 0, flexDirection: 'row', justifyContent: 'center', gap: 8 }]}
                      onPress={() => router.push({ pathname: '/checkout', params: { companyName: company.name, priceEstimate: company.priceEstimate || 'R$ 15.000,00' }})}
                    >
                      <ShieldCheck color="#FFFFFF" size={16} />
                      <ThemedText style={styles.actionButtonText}>Contratar (Pay)</ThemedText>
                    </TouchableOpacity>
                  </View>

                </View>
              ))}
            </ScrollView>
          </ScrollView>
        )}
      </SafeAreaView>
    </ThemedView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: Spacing.four,
    paddingVertical: Spacing.three,
    borderBottomWidth: 1,
  },
  headerButton: {
    padding: Spacing.one,
  },
  headerTitle: {
    fontSize: 18,
    fontWeight: 'bold',
  },
  emptyContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: Spacing.six,
  },
  emptyTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    marginBottom: Spacing.two,
  },
  emptySubtitle: {
    fontSize: 14,
    textAlign: 'center',
    marginBottom: Spacing.five,
  },
  backButton: {
    paddingHorizontal: Spacing.five,
    paddingVertical: 14,
    borderRadius: 24,
  },
  backButtonText: {
    color: '#fff',
    fontWeight: 'bold',
    fontSize: 16,
  },
  content: {
    flex: 1,
  },
  disclaimerBox: {
    flexDirection: 'row',
    backgroundColor: '#ECFDF5',
    marginHorizontal: Spacing.four,
    marginTop: Spacing.four,
    padding: Spacing.three,
    borderRadius: 12,
    alignItems: 'center',
    gap: Spacing.two,
  },
  disclaimerText: {
    flex: 1,
    color: '#065F46',
    fontSize: 12,
  },
  scrollContent: {
    paddingHorizontal: Spacing.four,
    paddingTop: Spacing.four,
    paddingBottom: Spacing.six,
    gap: Spacing.three,
  },
  compareCard: {
    backgroundColor: '#ffffff',
    borderRadius: 20,
    padding: Spacing.four,
    borderWidth: 1,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.05,
    shadowRadius: 10,
    elevation: 2,
  },
  cardHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: Spacing.three,
  },
  companyLogo: {
    width: 48,
    height: 48,
    borderRadius: 12,
  },
  companyLogoFallback: {
    width: 48,
    height: 48,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
  },
  companyLogoText: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#64748B',
  },
  removeBtn: {
    padding: Spacing.one,
  },
  companyName: {
    fontSize: 16,
    fontWeight: 'bold',
    marginBottom: 4,
  },
  verifiedBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 8,
    gap: 4,
  },
  verifiedText: {
    color: '#10B981',
    fontSize: 12,
    fontWeight: '600',
  },
  ratingRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  ratingStars: {
    fontSize: 14,
    fontWeight: 'bold',
  },
  ratingCount: {
    fontSize: 12,
    color: '#64748B',
  },
  divider: {
    height: 1,
    width: '100%',
    marginVertical: Spacing.four,
  },
  featureRow: {
    marginBottom: Spacing.three,
  },
  featureLabel: {
    fontSize: 12,
    color: '#64748B',
    marginBottom: 2,
  },
  featureLabelIcon: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 2,
  },
  featureValue: {
    fontSize: 15,
    fontWeight: '600',
  },
  featureValueHighlight: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#208AEF',
  },
  actionButton: {
    marginTop: Spacing.four,
    paddingVertical: 12,
    borderRadius: 12,
    alignItems: 'center',
  },
  actionButtonText: {
    color: '#ffffff',
    fontWeight: 'bold',
    fontSize: 14,
  },
});

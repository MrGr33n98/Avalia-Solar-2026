import React from 'react';
import { Colors } from '@/constants/theme';
import { StyleSheet, View, ScrollView, TouchableOpacity, Dimensions } , useColorScheme } from 'react-native';
import { useRouter } from 'expo-router';
import { ThemedText } from '@/components/themed-text';
import { ThemedView } from '@/components/themed-view';
import { Colors, Spacing } from '@/constants/theme';
import { SafeAreaView } from 'react-native-safe-area-context';
import { ArrowLeft, MessageSquare, QrCode, TrendingUp, Users, Star, SlidersHorizontal, Sparkles } from 'lucide-react-native';

const { width } = Dimensions.get('window');

export default function DashboardScreen() {
  const scheme = useColorScheme();
  const colors = Colors[scheme === 'unspecified' || !scheme ? 'light' : scheme];

  const router = useRouter();

  return (
    <ThemedView style={styles.container}>
      <SafeAreaView edges={['top']} style={{ backgroundColor: colors.tint }} />
      
      {/* Header Premium do Dashboard */}
      <View style={styles.header}>
        <View style={styles.headerTop}>
          <TouchableOpacity onPress={() => router.back()} style={styles.backButton}>
            <ArrowLeft size={24} color={colors.backgroundElement} />
          </TouchableOpacity>
          <View style={styles.headerRight}>
            <View style={styles.statusBadge}>
              <ThemedText style={styles.statusText}>Plano PRO</ThemedText>
            </View>
          </View>
        </View>
        <ThemedText style={styles.headerTitle}>Painel da Empresa</ThemedText>
        <ThemedText style={styles.headerSubtitle}>SolarTech Energia</ThemedText>
      </View>

      <ScrollView contentContainerStyle={styles.scrollContent} showsVerticalScrollIndicator={false}>
        
        {/* Métricas Principais */}
        <View style={styles.metricsContainer}>
          <TouchableOpacity 
            style={styles.metricCard}
            onPress={() => router.push('/dashboard/leads')}
          >
            <View style={[styles.iconWrapper, { backgroundColor: '#DBEAFE' }]}>
              <TrendingUp size={20} color="#2563EB" />
            </View>
            <ThemedText style={styles.metricValue}>124</ThemedText>
            <ThemedText style={styles.metricLabel}>Leads Gerados</ThemedText>
          </TouchableOpacity>

          <TouchableOpacity 
            style={styles.metricCard}
            onPress={() => router.push('/dashboard/reviews')}
          >
            <View style={[styles.iconWrapper, { backgroundColor: '#FEF3C7' }]}>
              <Star size={20} color="#D97706" />
            </View>
            <ThemedText style={styles.metricValue}>4.9</ThemedText>
            <ThemedText style={styles.metricLabel}>Nota Média</ThemedText>
          </TouchableOpacity>
        </View>

        {/* Ferramentas de Captação */}
        <ThemedText style={styles.sectionTitle}>Ferramentas de Venda</ThemedText>
        
        <TouchableOpacity 
          style={styles.actionCard} 
          onPress={() => router.push('/dashboard/qr-generator')}
        >
          <View style={[styles.actionIcon, { backgroundColor: '#F3E8FF' }]}>
            <QrCode size={24} color="#9333EA" />
          </View>
          <View style={styles.actionContent}>
            <ThemedText style={styles.actionTitle}>Captar Avaliação (QR Code)</ThemedText>
            <ThemedText style={styles.actionDescription}>Gere um QR Code para o cliente escanear ao fim da instalação.</ThemedText>
          </View>
        </TouchableOpacity>

        <TouchableOpacity 
          style={styles.actionCard} 
          onPress={() => router.push('/chat')}
        >
          <View style={[styles.actionIcon, { backgroundColor: '#DCFCE7' }]}>
            <MessageSquare size={24} color="#16A34A" />
          </View>
          <View style={styles.actionContent}>
            <View style={{ flexDirection: 'row', alignItems: 'center' }}>
              <ThemedText style={styles.actionTitle}>Inbox de Orçamentos</ThemedText>
              <View style={styles.badge}>
                <ThemedText style={styles.badgeText}>3</ThemedText>
              </View>
            </View>
            <ThemedText style={styles.actionDescription}>Responda leads e negocie propostas em tempo real.</ThemedText>
          </View>
        </TouchableOpacity>

        {/* Gerenciamento da Conta */}
        <ThemedText style={styles.sectionTitle}>Gerenciamento da Conta</ThemedText>
        
        <TouchableOpacity 
          style={styles.actionCard} 
          onPress={() => router.push('/dashboard/settings')}
        >
          <View style={[styles.actionIcon, { backgroundColor: colors.surfaceSubtle }]}>
            <SlidersHorizontal size={24} color="#475569" />
          </View>
          <View style={styles.actionContent}>
            <ThemedText style={styles.actionTitle}>Configurações da Empresa</ThemedText>
            <ThemedText style={styles.actionDescription}>Configure horários, serviços, site e telefone.</ThemedText>
          </View>
        </TouchableOpacity>

        <TouchableOpacity 
          style={styles.actionCard} 
          onPress={() => router.push('/dashboard/plans')}
        >
          <View style={[styles.actionIcon, { backgroundColor: colors.starYellow + "10" }]}>
            <Sparkles size={24} color={colors.starYellow} />
          </View>
          <View style={styles.actionContent}>
            <ThemedText style={styles.actionTitle}>Planos & Assinaturas</ThemedText>
            <ThemedText style={styles.actionDescription}>Visualize e altere sua assinatura premium do marketplace.</ThemedText>
          </View>
        </TouchableOpacity>

      </ScrollView>
    </ThemedView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.background,
  },
  header: {
    backgroundColor: colors.tint,
    paddingHorizontal: Spacing.four,
    paddingBottom: Spacing.five,
    paddingTop: Spacing.two,
    borderBottomLeftRadius: 24,
    borderBottomRightRadius: 24,
  },
  headerTop: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: Spacing.four,
  },
  backButton: {
    padding: Spacing.one,
    marginLeft: -Spacing.one,
  },
  headerRight: {},
  statusBadge: {
    backgroundColor: 'rgba(255, 255, 255, 0.2)',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 12,
  },
  statusText: {
    color: colors.backgroundElement,
    fontSize: 10,
    fontWeight: 'bold',
  },
  headerTitle: {
    color: colors.backgroundElement,
    fontSize: 24,
    fontWeight: 'bold',
  },
  headerSubtitle: {
    color: '#BFDBFE',
    fontSize: 14,
    marginTop: 2,
  },
  scrollContent: {
    paddingBottom: Spacing.six,
  },
  metricsContainer: {
    flexDirection: 'row',
    paddingHorizontal: Spacing.four,
    marginTop: -Spacing.four,
    gap: Spacing.three,
  },
  metricCard: {
    flex: 1,
    backgroundColor: colors.backgroundElement,
    borderRadius: 16,
    padding: Spacing.three,
    elevation: 4,
    shadowColor: '#000000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.08,
    shadowRadius: 8,
  },
  iconWrapper: {
    width: 40,
    height: 40,
    borderRadius: 20,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: Spacing.two,
  },
  metricValue: {
    fontSize: 24,
    fontWeight: '800',
    color: colors.text,
  },
  metricLabel: {
    fontSize: 12,
    color: colors.textSecondary,
    marginTop: 2,
  },
  sectionTitle: {
    fontSize: 16,
    fontWeight: '700',
    color: colors.text,
    paddingHorizontal: Spacing.four,
    marginTop: Spacing.five,
    marginBottom: Spacing.three,
  },
  actionCard: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.backgroundElement,
    marginHorizontal: Spacing.four,
    marginBottom: Spacing.three,
    padding: Spacing.three,
    borderRadius: 16,
    elevation: 2,
    shadowColor: '#000000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 4,
  },
  actionIcon: {
    width: 48,
    height: 48,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: Spacing.three,
  },
  actionContent: {
    flex: 1,
  },
  actionTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: colors.text,
    marginBottom: 4,
  },
  actionDescription: {
    fontSize: 12,
    color: colors.textSecondary,
    lineHeight: 16,
  },
  badge: {
    backgroundColor: colors.danger,
    borderRadius: 10,
    paddingHorizontal: 6,
    paddingVertical: 2,
    marginLeft: 8,
  },
  badgeText: {
    color: colors.backgroundElement,
    fontSize: 10,
    fontWeight: 'bold',
  },
});

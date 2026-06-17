import React from 'react';
import { StyleSheet, ScrollView, View, TouchableOpacity, ActivityIndicator, useColorScheme } from 'react-native';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { useQuery } from '@tanstack/react-query';
import { SafeAreaView } from 'react-native-safe-area-context';
import { ArrowLeft, Sun, Battery, Wrench, Sparkles, ShieldCheck, ChevronRight } from 'lucide-react-native';

import { ThemedText } from '@/components/themed-text';
import { ThemedView } from '@/components/themed-view';
import { Colors, Spacing } from '@/constants/theme';
import { companiesApi } from '@/lib/api';

export default function CompanyServicesScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const scheme = useColorScheme();
  const colors = Colors[scheme === 'unspecified' || !scheme ? 'light' : scheme];
  const router = useRouter();

  // Buscar dados da empresa para obter o nome real
  const { data: company, isLoading } = useQuery({
    queryKey: ['company-detail', id],
    queryFn: () => companiesApi.getByIdOrSlug(id!),
    enabled: !!id,
  });

  const servicesList = [
    {
      id: 'on-grid',
      title: 'Sistema On-Grid',
      subtitle: 'Conectado à rede elétrica da concessionária',
      description: 'Desenvolvimento de projetos de energia solar integrados à rede pública. Inclui engenharia, homologação completa junto à concessionária de energia e instalação rápida com equipamentos de alta eficiência.',
      icon: <Sun color="#208AEF" size={24} />,
      badge: 'Mais Vendido',
      badgeColor: '#E6F4FE',
      badgeTextColor: '#208AEF'
    },
    {
      id: 'off-grid',
      title: 'Sistema Off-Grid',
      subtitle: 'Sistemas autônomos com armazenamento',
      description: 'Solução ideal para propriedades rurais, locais isolados sem acesso à rede elétrica ou para quem deseja independência total. Utiliza bancos de baterias inteligentes para garantir energia constante 24 horas por dia.',
      icon: <Battery color="#10B981" size={24} />,
      badge: 'Armazenamento',
      badgeColor: '#E6FDF5',
      badgeTextColor: '#10B981'
    },
    {
      id: 'manutencao',
      title: 'Manutenção Preventiva',
      subtitle: 'Garantia de segurança e vida útil das placas',
      description: 'Visitas técnicas programadas para inspeção térmica com câmera infravermelha, reaperto de conexões elétricas da caixa de junção e inversores, e verificação estrutural contra oxidação ou fadiga.',
      icon: <Wrench color="#F59E0B" size={24} />,
      badge: 'Manutenção',
      badgeColor: '#FFFBEB',
      badgeTextColor: '#F59E0B'
    },
    {
      id: 'limpeza',
      title: 'Limpeza de Placas',
      subtitle: 'Até 30% mais eficiência energética',
      description: 'Remoção especializada de poeira, dejetos de pássaros, fuligem e poluição das placas solares utilizando produtos biodegradáveis específicos que não danificam o vidro antirreflexo das células fotovoltaicas.',
      icon: <Sparkles color="#8B5CF6" size={24} />,
      badge: 'Limpeza',
      badgeColor: '#F5F3FF',
      badgeTextColor: '#8B5CF6'
    }
  ];

  if (isLoading) {
    return (
      <ThemedView style={styles.centerContainer}>
        <ActivityIndicator size="large" color="#208AEF" />
        <ThemedText style={{ marginTop: Spacing.three }}>Carregando serviços...</ThemedText>
      </ThemedView>
    );
  }

  return (
    <SafeAreaView style={styles.safeArea} edges={['top', 'bottom']}>
      {/* Header */}
      <View style={[styles.header, { borderBottomColor: colors.border }]}>
        <TouchableOpacity style={styles.backButton} onPress={() => router.back()}>
          <ArrowLeft color="#1E293B" size={24} />
        </TouchableOpacity>
        <View style={styles.headerTitleContainer}>
          <ThemedText style={styles.headerTitle}>Serviços</ThemedText>
          <ThemedText style={styles.headerSubtitle} numberOfLines={1}>
            {company?.name || 'Carregando...'}
          </ThemedText>
        </View>
        <View style={{ width: 40 }} />
      </View>

      <ScrollView style={styles.container} contentContainerStyle={styles.scrollContent} showsVerticalScrollIndicator={false}>
        {/* Banner Informativo */}
        <View style={styles.infoBanner}>
          <ShieldCheck color="#FFFFFF" size={24} />
          <View style={styles.infoTextContent}>
            <ThemedText style={styles.infoTitle}>Garantia Avalia Solar</ThemedText>
            <ThemedText style={styles.infoSubtitle}>Todos os serviços contam com integradores verificados e seguro de instalação.</ThemedText>
          </View>
        </View>

        <ThemedText style={styles.sectionTitle}>Portfólio de Serviços</ThemedText>

        {/* Lista de Serviços */}
        <View style={styles.servicesGrid}>
          {servicesList.map((service) => (
            <View key={service.id} style={styles.serviceCard}>
              <View style={styles.cardHeader}>
                <View style={styles.iconWrapper}>
                  {service.icon}
                </View>
                <View style={styles.cardTitleWrapper}>
                  <View style={styles.titleRow}>
                    <ThemedText style={styles.serviceTitle}>{service.title}</ThemedText>
                    {service.badge && (
                      <View style={[styles.badge, { backgroundColor: service.badgeColor }]}>
                        <ThemedText style={[styles.badgeText, { color: service.badgeTextColor }]}>
                          {service.badge}
                        </ThemedText>
                      </View>
                    )}
                  </View>
                  <ThemedText style={styles.serviceSubtitle}>{service.subtitle}</ThemedText>
                </View>
              </View>
              
              <ThemedText style={styles.serviceDescription}>
                {service.description}
              </ThemedText>
              
              <View style={styles.cardDivider} />
              
              <TouchableOpacity 
                style={styles.quoteRedirectBtn}
                onPress={() => router.push(`/company/${id}/lead`)}
              >
                <ThemedText style={styles.quoteRedirectBtnText}>Orçar este serviço</ThemedText>
                <ChevronRight color="#208AEF" size={16} />
              </TouchableOpacity>
            </View>
          ))}
        </View>
      </ScrollView>

      {/* Botão de Rodapé Fixo */}
      <View style={[styles.footer, { borderTopColor: colors.border }]}>
        <TouchableOpacity 
          style={styles.quoteButton}
          onPress={() => router.push(`/company/${id}/lead`)}
        >
          <ThemedText style={styles.quoteButtonText}>Solicitar Orçamento Geral</ThemedText>
        </TouchableOpacity>
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: '#F8FAFC',
  },
  centerContainer: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingVertical: 12,
    backgroundColor: '#FFFFFF',
    borderBottomWidth: 1,
    elevation: 2,
    shadowColor: '#000000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 5,
  },
  backButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: '#F1F5F9',
    justifyContent: 'center',
    alignItems: 'center',
  },
  headerTitleContainer: {
    flex: 1,
    marginLeft: 12,
  },
  headerTitle: {
    fontSize: 18,
    fontWeight: '700',
    color: '#1E293B',
  },
  headerSubtitle: {
    fontSize: 12,
    color: '#64748B',
    marginTop: 1,
  },
  container: {
    flex: 1,
  },
  scrollContent: {
    padding: 16,
    paddingBottom: 100,
  },
  infoBanner: {
    flexDirection: 'row',
    backgroundColor: '#003E7E',
    padding: 16,
    borderRadius: 16,
    alignItems: 'center',
    marginBottom: 24,
  },
  infoTextContent: {
    flex: 1,
    marginLeft: 16,
  },
  infoTitle: {
    color: '#FFFFFF',
    fontSize: 15,
    fontWeight: '700',
    marginBottom: 2,
  },
  infoSubtitle: {
    color: '#E2E8F0',
    fontSize: 12,
    lineHeight: 16,
  },
  sectionTitle: {
    fontSize: 16,
    fontWeight: '700',
    color: '#1E293B',
    marginBottom: 16,
    marginLeft: 4,
  },
  servicesGrid: {
    gap: 16,
  },
  serviceCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 16,
    padding: 16,
    borderWidth: 1,
    borderColor: '#E2E8F0',
    shadowColor: '#000000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.02,
    shadowRadius: 10,
    elevation: 2,
  },
  cardHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 12,
  },
  iconWrapper: {
    width: 48,
    height: 48,
    borderRadius: 12,
    backgroundColor: '#F1F5F9',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 12,
  },
  cardTitleWrapper: {
    flex: 1,
  },
  titleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    flexWrap: 'wrap',
    gap: 6,
  },
  serviceTitle: {
    fontSize: 15,
    fontWeight: '700',
    color: '#1E293B',
  },
  serviceSubtitle: {
    fontSize: 12,
    color: '#64748B',
    marginTop: 2,
  },
  badge: {
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 8,
  },
  badgeText: {
    fontSize: 10,
    fontWeight: '700',
  },
  serviceDescription: {
    fontSize: 13,
    color: '#475569',
    lineHeight: 18,
    marginBottom: 8,
  },
  cardDivider: {
    height: 1,
    backgroundColor: '#F1F5F9',
    marginVertical: 12,
  },
  quoteRedirectBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  quoteRedirectBtnText: {
    fontSize: 13,
    fontWeight: '600',
    color: '#208AEF',
  },
  footer: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    backgroundColor: '#FFFFFF',
    padding: 16,
    borderTopWidth: 1,
    elevation: 10,
    shadowColor: '#000000',
    shadowOffset: { width: 0, height: -4 },
    shadowOpacity: 0.05,
    shadowRadius: 10,
  },
  quoteButton: {
    backgroundColor: '#208AEF',
    paddingVertical: 14,
    borderRadius: 12,
    alignItems: 'center',
  },
  quoteButtonText: {
    color: '#FFFFFF',
    fontSize: 15,
    fontWeight: '700',
  },
});

import React, { useEffect, useState } from 'react';
import {
  StyleSheet,
  View,
  ScrollView,
  TouchableOpacity,
  useColorScheme,
  Alert,
  ActivityIndicator,
  Linking,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';
import { ArrowLeft, Sparkles, ShieldCheck, Award, Zap } from 'lucide-react-native';

import { ThemedText } from '@/components/themed-text';
import { ThemedView } from '@/components/themed-view';
import { Colors } from '@/constants/theme';
import { fetchApi } from '@/lib/api';
import { useAuthStore } from '@/store/auth';

interface Plan {
  id: number;
  name: string;
  description: string;
  price: number;
  features_json?: Record<string, any> | string;
  features?: string; // fallback
  is_public: boolean;
  display_order: number;
  plan_tier_template?: string;
}

export default function DashboardPlansScreen() {
  const scheme = useColorScheme();
  const colors = Colors[scheme === 'unspecified' || !scheme ? 'light' : scheme];
  const router = useRouter();
  const { user } = useAuthStore();

  const [plans, setPlans] = useState<Plan[]>([]);
  const [loading, setLoading] = useState(true);
  const [userCompany, setUserCompany] = useState<any>(null);
  const [checkoutLoadingId, setCheckoutLoadingId] = useState<number | null>(null);

  useEffect(() => {
    async function loadData() {
      try {
        // Carrega planos da API
        const plansData = await fetchApi<Plan[]>('billing/plans');
        setPlans(plansData || []);

        // Carrega empresa atual
        if (user?.company_id) {
          const res = await fetchApi<{ company: any }>(`companies/${user.company_id}`);
          if (res && res.company) {
            setUserCompany(res.company);
          }
        } else {
          // Fallback para buscar a empresa
          const companies = await fetchApi<any[]>('companies/mine');
          if (companies && companies.length > 0) {
            const res = await fetchApi<{ company: any }>(`companies/${companies[0].id}`);
            if (res && res.company) {
              setUserCompany(res.company);
            }
          }
        }
      } catch (error) {
        console.error('[Plans] Erro ao carregar assinaturas:', error);
      } finally {
        setLoading(false);
      }
    }

    loadData();
  }, [user]);

  const translateFeature = (key: string): string => {
    const translations: Record<string, string> = {
      'product_description': 'Ficha técnica detalhada',
      'product_features_block': 'Especificações técnicas completas',
      'company_links_block': 'Links de contato e redes sociais',
      'setup_included': 'Instalação inicial gratuita',
      'custom_ctas': 'Botão de WhatsApp e CTAs de conversão',
      'verified_product': 'Selo de empresa ativa e verificada',
      'highlight_badges': 'Destaque visual especial nas buscas',
      'social_proof': 'Exibição de avaliações destacadas',
      'promo_banner': 'Banner promocional no perfil',
      'pricing_table': 'Tabela comparativa de preços',
      'special_offer': 'Espaço de ofertas especiais',
      'media_gallery': 'Galeria de fotos de instalações',
      'advanced_analytics': 'Dashboard de métricas avançadas',
      'financing_simulation': 'Simulação de financiamento própria',
      'leads_marketplace': 'Acesso ao leilão de leads da região',
      'intent_scores': 'Pontuação de intenção de compra do lead',
      'webhooks': 'Integração de leads via Webhooks',
    };
    return translations[key] || key;
  };

  const getPlanFeatures = (plan: Plan): string[] => {
    let rawFeatures: Record<string, any> = {};
    if (plan.features_json) {
      rawFeatures = typeof plan.features_json === 'string' 
        ? JSON.parse(plan.features_json) 
        : plan.features_json;
    } else if (plan.features) {
      try {
        rawFeatures = JSON.parse(plan.features);
      } catch {
        rawFeatures = {};
      }
    }

    return Object.entries(rawFeatures)
      .filter(([_, enabled]) => !!enabled)
      .map(([key]) => translateFeature(key));
  };

  const getPlanIcon = (tier?: string) => {
    switch (tier) {
      case 'essential':
        return <ShieldCheck size={24} color="#10B981" />;
      case 'pro':
        return <Sparkles size={24} color="#F59E0B" />;
      case 'enterprise':
        return <Zap size={24} color="#8B5CF6" />;
      default:
        return <Award size={24} color="#94A3B8" />;
    }
  };

  const getPlanBadge = (tier?: string) => {
    switch (tier) {
      case 'pro':
        return 'Mais Vendido';
      case 'enterprise':
        return 'Máximo Retorno';
      default:
        return null;
    }
  };

  const handleUpgrade = async (plan: Plan) => {
    if (!userCompany) {
      Alert.alert('Erro', 'Sua conta de usuário não possui uma empresa associada no momento.');
      return;
    }

    setCheckoutLoadingId(plan.id);
    try {
      const response = await fetchApi<{ checkout_url: string }>('billing/checkout', {
        method: 'POST',
        body: JSON.stringify({
          company_id: userCompany.id,
          plan_id: plan.id,
          success_url: 'avaliasolar://checkout/success',
          cancel_url: 'avaliasolar://checkout/cancel',
        }),
      });

      if (response && response.checkout_url) {
        Linking.openURL(response.checkout_url);
      } else {
        throw new Error('Sessão de checkout vazia');
      }
    } catch (error: any) {
      console.error('[Plans] Erro ao iniciar checkout:', error);
      Alert.alert(
        'Erro de Checkout',
        error?.message || 'Não foi possível gerar a página de checkout. Tente novamente mais tarde.'
      );
    } finally {
      setCheckoutLoadingId(null);
    }
  };

  if (loading) {
    return (
      <SafeAreaView style={[styles.safeArea, { justifyContent: 'center', alignItems: 'center' }]}>
        <ActivityIndicator size="large" color="#003E7E" />
        <ThemedText style={{ marginTop: 12 }}>Carregando opções de planos...</ThemedText>
      </SafeAreaView>
    );
  }

  // Verifica se o plano do loop é o plano ativo da empresa
  const isCurrentPlan = (plan: Plan) => {
    if (!userCompany) return plan.plan_tier_template === 'free';
    return userCompany.plan_id === plan.id;
  };

  return (
    <SafeAreaView style={styles.safeArea} edges={['top', 'bottom']}>
      {/* Header */}
      <View style={[styles.header, { borderBottomColor: colors.border }]}>
        <TouchableOpacity style={styles.backButton} onPress={() => router.back()}>
          <ArrowLeft color="#1E293B" size={24} />
        </TouchableOpacity>
        <ThemedText style={styles.headerTitle}>Planos & Assinaturas</ThemedText>
        <View style={{ width: 40 }} />
      </View>

      <ScrollView style={styles.container} contentContainerStyle={styles.scrollContent} showsVerticalScrollIndicator={false}>
        
        {/* Banner Informativo */}
        <View style={styles.banner}>
          <ShieldCheck color="#FFFFFF" size={24} />
          <View style={styles.bannerText}>
            <ThemedText style={styles.bannerTitle}>Potencialize suas vendas</ThemedText>
            <ThemedText style={styles.bannerSubtitle}>Escolha o plano ideal e apareça para mais clientes qualificados.</ThemedText>
          </View>
        </View>

        {/* Lista de Planos */}
        <View style={styles.plansList}>
          {plans.map((plan) => {
            const isCurrent = isCurrentPlan(plan);
            const badge = getPlanBadge(plan.plan_tier_template);
            const featuresList = getPlanFeatures(plan);
            const isCheckoutLoading = checkoutLoadingId === plan.id;

            return (
              <View key={plan.id} style={[styles.planCard, isCurrent && styles.currentPlanCard]}>
                
                {badge && (
                  <View style={[styles.planBadge, { backgroundColor: isCurrent ? '#FFFBEB' : '#F5F3FF' }]}>
                    <ThemedText style={[styles.badgeText, { color: isCurrent ? '#F59E0B' : '#8B5CF6' }]}>
                      {badge}
                    </ThemedText>
                  </View>
                )}

                <View style={styles.planHeader}>
                  <View style={styles.iconWrapper}>
                    {getPlanIcon(plan.plan_tier_template)}
                  </View>
                  <View style={{ flex: 1 }}>
                    <ThemedText style={styles.planName}>{plan.name}</ThemedText>
                    <ThemedText style={styles.planPrice}>
                      {plan.price === 0 ? 'Grátis' : `R$ ${parseFloat(plan.price.toString()).toFixed(2).replace('.', ',')}/mês`}
                    </ThemedText>
                  </View>
                </View>

                {plan.description ? (
                  <ThemedText style={styles.planDescription} themeColor="textSecondary">
                    {plan.description}
                  </ThemedText>
                ) : null}

                <View style={styles.divider} />

                <View style={styles.featuresList}>
                  {featuresList.map((feat, fidx) => (
                    <View key={fidx} style={styles.featureRow}>
                      <ShieldCheck size={14} color="#10B981" style={{ marginRight: 8 }} />
                      <ThemedText style={styles.featureText}>{feat}</ThemedText>
                    </View>
                  ))}
                </View>

                <TouchableOpacity
                  style={[
                    styles.actionBtn, 
                    { 
                      backgroundColor: isCurrent 
                        ? '#E2E8F0' 
                        : plan.plan_tier_template === 'enterprise' 
                          ? '#8B5CF6' 
                          : '#003E7E' 
                    }
                  ]}
                  onPress={() => handleUpgrade(plan)}
                  disabled={isCurrent || isCheckoutLoading}
                >
                  {isCheckoutLoading ? (
                    <ActivityIndicator color={isCurrent ? '#64748B' : '#FFFFFF'} />
                  ) : (
                    <ThemedText style={[styles.actionBtnText, { color: isCurrent ? '#64748B' : '#FFFFFF' }]}>
                      {isCurrent ? 'Plano Atual' : 'Contratar Plano'}
                    </ThemedText>
                  )}
                </TouchableOpacity>
              </View>
            );
          })}
        </View>

      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: '#F8FAFC',
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingVertical: 12,
    backgroundColor: '#FFFFFF',
    borderBottomWidth: 1,
  },
  backButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: '#F1F5F9',
    justifyContent: 'center',
    alignItems: 'center',
  },
  headerTitle: {
    fontSize: 16,
    fontWeight: '700',
    color: '#1E293B',
  },
  container: {
    flex: 1,
  },
  scrollContent: {
    padding: 16,
    paddingBottom: 40,
  },
  banner: {
    flexDirection: 'row',
    backgroundColor: '#003E7E',
    padding: 16,
    borderRadius: 16,
    alignItems: 'center',
    marginBottom: 24,
  },
  bannerText: {
    marginLeft: 16,
    flex: 1,
  },
  bannerTitle: {
    color: '#FFFFFF',
    fontSize: 15,
    fontWeight: '700',
  },
  bannerSubtitle: {
    color: '#E2E8F0',
    fontSize: 11,
    lineHeight: 16,
    marginTop: 2,
  },
  plansList: {
    gap: 20,
  },
  planCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 16,
    padding: 20,
    borderWidth: 1,
    borderColor: '#E2E8F0',
    position: 'relative',
    elevation: 2,
    shadowColor: '#000000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.02,
    shadowRadius: 10,
  },
  currentPlanCard: {
    borderColor: '#F59E0B',
    borderWidth: 2,
  },
  planBadge: {
    position: 'absolute',
    top: -12,
    right: 20,
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: 'rgba(0,0,0,0.05)',
  },
  badgeText: {
    fontSize: 9,
    fontWeight: '900',
    textTransform: 'uppercase',
  },
  planHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 16,
  },
  iconWrapper: {
    width: 48,
    height: 48,
    borderRadius: 12,
    backgroundColor: '#F1F5F9',
    alignItems: 'center',
    justifyContent: 'center',
  },
  planName: {
    fontSize: 16,
    fontWeight: '800',
    color: '#1E293B',
  },
  planPrice: {
    fontSize: 13,
    color: '#475569',
    fontWeight: '600',
    marginTop: 2,
  },
  planDescription: {
    fontSize: 12,
    color: '#64748B',
    marginTop: 10,
    lineHeight: 16,
  },
  divider: {
    height: 1,
    backgroundColor: '#F1F5F9',
    marginVertical: 16,
  },
  featuresList: {
    gap: 12,
    marginBottom: 20,
  },
  featureRow: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  featureText: {
    fontSize: 13,
    color: '#475569',
  },
  actionBtn: {
    height: 46,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
  },
  actionBtnText: {
    fontSize: 14,
    fontWeight: '800',
  },
});
